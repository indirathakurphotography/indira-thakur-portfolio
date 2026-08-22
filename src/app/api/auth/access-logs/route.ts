import { NextResponse } from 'next/server';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';
import { getInMemoryUsers, getInMemoryLoginLogs } from '@/lib/auth';
import LoginLog from '@/models/LoginLog';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    try {
      await connectDb();
      const logs = await LoginLog.find({})
        .sort({ loginTime: -1 })
        .limit(100)
        .lean();

      return NextResponse.json({ logs: serializeDoc(logs) }, { headers: NO_CACHE_HEADERS });
    } catch (dbErr) {
      console.warn('MongoDB access logs GET warning, returning in-memory store:', dbErr);
      const memLogs = getInMemoryLoginLogs();
      return NextResponse.json({ logs: memLogs }, { headers: NO_CACHE_HEADERS });
    }
  } catch (error: any) {
    console.error('Access logs GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch logs' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);

    const { action, sessionId } = await request.json();

    if (action === 'revoke_all') {
      let affectedCount = 0;
      try {
        await connectDb();
        const result = await User.updateMany({}, { $inc: { authGeneration: 1 } });
        await LoginLog.updateMany({ status: 'success' }, { status: 'revoked', logoutTime: new Date() });
        affectedCount = result.modifiedCount;
      } catch (dbErr) {
        console.warn('MongoDB revoke_all warning, updating in-memory store:', dbErr);
        const memUsers = getInMemoryUsers();
        memUsers.forEach((u) => {
          u.authGeneration = (u.authGeneration || 1) + 1;
        });
        const memLogs = getInMemoryLoginLogs();
        memLogs.forEach((l) => {
          if (l.status === 'success') {
            l.status = 'revoked';
            l.logoutTime = new Date().toISOString();
          }
        });
        affectedCount = memUsers.length;
      }

      const { recordAuditLog } = await import('@/lib/auditLogger');
      await recordAuditLog(request, {
        action: 'ALL_SESSIONS_REVOKED',
        adminEmail: actor.email,
        adminName: actor.name,
        targetResource: 'Global Admin Sessions',
        details: `Revoked all active admin sessions (${affectedCount} accounts affected)`,
        status: 'warning',
      });

      const response = NextResponse.json({
        success: true,
        message: 'All active admin sessions have been revoked globally.',
        newVersion: Date.now(),
        affectedUsers: affectedCount,
      });

      response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });

      return response;
    }

    if (action === 'revoke_session' && sessionId) {
      let targetEmail = 'admin';
      let found = false;

      try {
        await connectDb();
        const targetSession = await LoginLog.findOne({ sessionId }).lean();
        const result = await LoginLog.updateOne({ sessionId }, { status: 'revoked', logoutTime: new Date() });
        if (result.matchedCount === 1) {
          found = true;
          targetEmail = (targetSession as any)?.email || targetEmail;
        }
      } catch (dbErr) {
        console.warn('MongoDB revoke_session warning, updating in-memory store:', dbErr);
      }

      const memLogs = getInMemoryLoginLogs();
      const sessionLog = memLogs.find((l) => l.sessionId === sessionId);
      if (sessionLog) {
        sessionLog.status = 'revoked';
        sessionLog.logoutTime = new Date().toISOString();
        targetEmail = sessionLog.email || targetEmail;
        found = true;
      }

      if (!found) {
        return NextResponse.json({ error: `Session ${sessionId} not found` }, { status: 404 });
      }

      const { recordAuditLog } = await import('@/lib/auditLogger');
      await recordAuditLog(request, {
        action: 'SESSION_REVOKED',
        adminEmail: actor.email,
        adminName: actor.name,
        targetResource: `Session: ${sessionId}`,
        details: `Revoked session for ${targetEmail}`,
        status: 'warning',
      });

      return NextResponse.json({ success: true, message: `Session ${sessionId} revoked.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Access logs POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Action failed' }, { status, headers: NO_CACHE_HEADERS });
  }
}
