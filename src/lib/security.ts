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

declare global {
  var __inMemoryBlockedIps: { _id: string; ip: string; reason: string; blockedBy: string; createdAt: string }[] | undefined;
  var __inMemoryBlockedAccessLogs: { _id: string; ip: string; path: string; method: string; reason: string; userAgent: string; createdAt: string }[] | undefined;
}

export function getInMemoryBlockedIps() {
  if (!global.__inMemoryBlockedIps) {
    global.__inMemoryBlockedIps = [];
  }
  return global.__inMemoryBlockedIps;
}

export function getInMemoryBlockedAccessLogs() {
  if (!global.__inMemoryBlockedAccessLogs) {
    global.__inMemoryBlockedAccessLogs = [];
  }
  return global.__inMemoryBlockedAccessLogs;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return false;

  try {
    const db = await connectToDatabase();
    if (db) {
      const BlockedIp = (await import('@/models/BlockedIp')).default;
      const found = await BlockedIp.findOne({ ip: cleanIp }).select('_id').lean();
      if (found) return true;
    }
  } catch (err) {
    console.warn('MongoDB isIpBlocked warning, using memory store:', err);
  }

  const mem = getInMemoryBlockedIps();
  return mem.some((b) => b.ip === cleanIp);
}

export async function logBlockedAccess(details: {
  ip: string;
  path: string;
  method: string;
  reason: string;
  userAgent?: string;
}): Promise<void> {
  const item = {
    _id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ip: normalizeIp(details.ip),
    path: details.path || '',
    method: details.method || '',
    reason: details.reason || 'denylist',
    userAgent: details.userAgent || '',
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await connectToDatabase();
    if (db) {
      const BlockedAccessLog = (await import('@/models/BlockedAccessLog')).default;
      await BlockedAccessLog.create({
        ...item,
        createdAt: new Date(item.createdAt),
      }).catch(() => {});
      return;
    }
  } catch {
    // Fallback to memory
  }

  const mem = getInMemoryBlockedAccessLogs();
  mem.unshift(item);
  if (mem.length > 200) mem.pop();
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
