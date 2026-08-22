import { connectToDatabase } from '@/lib/mongodb';
import { getClientIp } from '@/lib/security';
import { parseUserAgent } from '@/lib/uaParser';

export interface AuditLogEntry {
  action: string;
  adminEmail: string;
  adminName?: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  targetResource?: string;
  details?: string;
  status?: 'success' | 'failed' | 'warning';
}

declare global {
  var __inMemoryAuditLogs: any[] | undefined;
}

export function getInMemoryAuditLogs() {
  if (!global.__inMemoryAuditLogs) {
    global.__inMemoryAuditLogs = [];
  }
  return global.__inMemoryAuditLogs;
}

export async function recordAuditLog(
  request: Request | null,
  entry: AuditLogEntry
): Promise<void> {
  let ip = entry.ip || '127.0.0.1';
  let ua = entry.userAgent || '';
  let browser = entry.browser || 'Unknown';
  let os = entry.os || 'Unknown';
  let device = entry.device || 'Desktop';

  if (request) {
    ip = getClientIp(request);
    ua = request.headers.get('user-agent') || '';
    const parsed = parseUserAgent(ua);
    browser = parsed.browser;
    os = parsed.os;
    device = parsed.device;
  }

  const logDoc = {
    _id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action: entry.action,
    adminEmail: entry.adminEmail.toLowerCase(),
    adminName: entry.adminName || 'Administrator',
    ip,
    userAgent: ua,
    browser,
    os,
    device,
    targetResource: entry.targetResource || '',
    details: entry.details || '',
    status: entry.status || 'success',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await connectToDatabase();
    if (db) {
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create({
        ...logDoc,
        timestamp: new Date(logDoc.timestamp),
      }).catch(() => {});
      return;
    }
  } catch (err) {
    console.warn('[AuditLogger] Database unavailable, writing to memory log:', err);
  }

  const mem = getInMemoryAuditLogs();
  mem.unshift(logDoc);
  if (mem.length > 1000) mem.pop();
}
