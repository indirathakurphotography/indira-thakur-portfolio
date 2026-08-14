import { ApiError } from '@/lib/cmsDatabase';
import { connectToDatabase } from '@/lib/mongodb';

export const BLOCKED_IP_NOTICE = 'Forbidden';

export function getClientIp(request: Request): string {
  const xVercel = request.headers.get('x-vercel-forwarded-for');
  if (xVercel) return xVercel.split(',')[0].trim();
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  return '127.0.0.1';
}

export function normalizeIp(raw: string): string {
  const trimmed = (raw || '').trim();
  const isV6 = trimmed.includes(':') && !trimmed.includes('.');
  return isV6 ? trimmed.toLowerCase() : trimmed;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return false;
  const db = await connectToDatabase();
  if (!db) return false;
  const BlockedIp = (await import('@/models/BlockedIp')).default;
  const found = await BlockedIp.findOne({ ip: cleanIp }).select('_id').lean();
  return !!found;
}

export async function logBlockedAccess(details: {
  ip: string;
  path: string;
  method: string;
  reason: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const db = await connectToDatabase();
    if (!db) return;
    const BlockedAccessLog = (await import('@/models/BlockedAccessLog')).default;
    await BlockedAccessLog.create({
      ip: normalizeIp(details.ip),
      path: details.path || '',
      method: details.method || '',
      reason: details.reason || 'denylist',
      userAgent: details.userAgent || '',
    }).catch(() => {});
  } catch {
    // Logging must never break request handling.
  }
}

export async function assertIpNotBlocked(request: Request): Promise<void> {
  const ip = getClientIp(request);
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    await logBlockedAccess({
      ip,
      path: new URL(request.url).pathname,
      method: request.method,
      reason: 'denylist',
      userAgent: request.headers.get('user-agent') || '',
    });
    throw new ApiError(BLOCKED_IP_NOTICE, 403);
  }
}
