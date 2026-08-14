import { NextResponse } from 'next/server';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';
import { normalizeIp } from '@/lib/security';
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
  } catch (error: any) {
    console.error('Security GET error:', error);
    return jsonError(error?.message || 'Failed to fetch security state', error?.status || 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    await connectDb();

    const body = await request.json();
    const { action } = body;

    const BlockedIp = (await import('@/models/BlockedIp')).default;

    if (action === 'block') {
      const ip = normalizeIp(body.ip);
      if (!ip || !isValidIp(ip)) {
        return jsonError('A valid IPv4 or IPv6 address is required', 400);
      }
      const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 300) : 'Blocked by administrator';
      assertNoProhibitedLanguage({ reason });

      const existing = await BlockedIp.findOne({ ip }).lean();
      if (existing) {
        return jsonError(`IP ${ip} is already blocked`, 409);
      }

      const created = await BlockedIp.create({ ip, reason, blockedBy: actor.email });
      return NextResponse.json({ success: true, blocked: serializeDoc(created) }, { status: 201, headers: NO_CACHE_HEADERS });
    }

    if (action === 'unblock') {
      const ip = normalizeIp(body.ip);
      if (!ip) {
        return jsonError('IP address is required', 400);
      }
      const result = await BlockedIp.deleteOne({ ip });
      if (result.deletedCount !== 1) {
        return jsonError(`IP ${ip} is not blocked`, 404);
      }
      return NextResponse.json({ success: true, message: `IP ${ip} unblocked` }, { headers: NO_CACHE_HEADERS });
    }

    return jsonError('Invalid action', 400);
  } catch (error: any) {
    console.error('Security POST error:', error);
    return jsonError(error?.message || 'Security action failed', error?.status || 500);
  }
}
