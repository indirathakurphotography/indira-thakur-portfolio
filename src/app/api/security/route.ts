import { NextResponse } from 'next/server';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';
import { normalizeIp, getInMemoryBlockedIps, getInMemoryBlockedAccessLogs } from '@/lib/security';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
}

function isValidIp(input: string): boolean {
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (v4.test(input)) {
    return input.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255);
  }
  return /^[0-9a-f:]{2,45}$/i.test(input);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    try {
      await connectDb();
      const BlockedIp = (await import('@/models/BlockedIp')).default;
      const BlockedAccessLog = (await import('@/models/BlockedAccessLog')).default;

      const [blockedIps, recentAttempts, attemptCount] = await Promise.all([
        BlockedIp.find({}).sort({ createdAt: -1 }).limit(100).lean(),
        BlockedAccessLog.find({}).sort({ createdAt: -1 }).limit(50).lean(),
        BlockedAccessLog.countDocuments(),
      ]);

      return NextResponse.json(
        {
          blockedIps: serializeDoc(blockedIps),
          recentAttempts: serializeDoc(recentAttempts),
          attemptCount,
        },
        { headers: NO_CACHE_HEADERS }
      );
    } catch (dbErr) {
      console.warn('MongoDB security GET warning, using in-memory store:', dbErr);
      const memBlocked = getInMemoryBlockedIps();
      const memAttempts = getInMemoryBlockedAccessLogs();
      return NextResponse.json(
        {
          blockedIps: memBlocked,
          recentAttempts: memAttempts,
          attemptCount: memAttempts.length,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }
  } catch (error: any) {
    console.error('Security GET error:', error);
    return jsonError(error?.message || 'Failed to fetch security state', error?.status || 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json();
    const { action } = body;

    if (action === 'block') {
      const ip = normalizeIp(body.ip);
      if (!ip || !isValidIp(ip)) {
        return jsonError('A valid IPv4 or IPv6 address is required', 400);
      }
      const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 300) : 'Blocked by administrator';
      assertNoProhibitedLanguage({ reason });

      const newBlockedItem = {
        _id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ip,
        reason,
        blockedBy: actor.email,
        createdAt: new Date().toISOString(),
      };

      try {
        await connectDb();
        const BlockedIp = (await import('@/models/BlockedIp')).default;
        const existing = await BlockedIp.findOne({ ip }).lean();
        if (existing) {
          return jsonError(`IP ${ip} is already blocked`, 409);
        }
        const created = await BlockedIp.create({ ip, reason, blockedBy: actor.email });
        newBlockedItem._id = created._id.toString();
      } catch (dbErr) {
        console.warn('MongoDB block IP warning, saving in memory:', dbErr);
        const mem = getInMemoryBlockedIps();
        if (mem.some((b) => b.ip === ip)) {
          return jsonError(`IP ${ip} is already blocked`, 409);
        }
        mem.unshift(newBlockedItem);
      }

      const { recordAuditLog } = await import('@/lib/auditLogger');
      await recordAuditLog(request, {
        action: 'IP_BLOCKED',
        adminEmail: actor.email,
        adminName: actor.name,
        targetResource: `IP: ${ip}`,
        details: `Blocked IP (${reason})`,
        status: 'warning',
      });

      return NextResponse.json({ success: true, blocked: newBlockedItem }, { status: 201, headers: NO_CACHE_HEADERS });
    }

    if (action === 'unblock') {
      const ip = normalizeIp(body.ip);
      if (!ip) {
        return jsonError('IP address is required', 400);
      }

      let removed = false;
      try {
        await connectDb();
        const BlockedIp = (await import('@/models/BlockedIp')).default;
        const result = await BlockedIp.deleteOne({ ip });
        removed = result.deletedCount === 1;
      } catch (dbErr) {
        console.warn('MongoDB unblock warning, removing from memory:', dbErr);
      }

      const mem = getInMemoryBlockedIps();
      const idx = mem.findIndex((b) => b.ip === ip);
      if (idx !== -1) {
        mem.splice(idx, 1);
        removed = true;
      }

      if (!removed) {
        return jsonError(`IP ${ip} is not blocked`, 404);
      }

      const { recordAuditLog } = await import('@/lib/auditLogger');
      await recordAuditLog(request, {
        action: 'IP_UNBLOCKED',
        adminEmail: actor.email,
        adminName: actor.name,
        targetResource: `IP: ${ip}`,
        details: 'Removed IP from admin blocklist',
        status: 'success',
      });

      return NextResponse.json({ success: true, message: `IP ${ip} unblocked` }, { headers: NO_CACHE_HEADERS });
    }

    return jsonError('Invalid action', 400);
  } catch (error: any) {
    console.error('Security POST error:', error);
    return jsonError(error?.message || 'Security action failed', error?.status || 500);
  }
}
