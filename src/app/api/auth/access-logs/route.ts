import { NextResponse } from 'next/server';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';
import LoginLog from '@/models/LoginLog';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const logs = await LoginLog.find({})
      .sort({ loginTime: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ logs: serializeDoc(logs) }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Access logs GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch logs' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const { action, sessionId } = await request.json();

    if (action === 'revoke_all') {
      await connectDb();

      // DB-backed global session revocation: bump EVERY user's authGeneration.
      // Any JWT signed with an older generation is rejected by verifyAuthUser
      // / requireAdmin on the very next request, on every serverless instance.
      const result = await User.updateMany({}, { $inc: { authGeneration: 1 } });

      await LoginLog.updateMany({ status: 'success' }, { status: 'revoked', logoutTime: new Date() });

      const response = NextResponse.json({
        success: true,
        message: 'All active admin sessions have been revoked globally.',
        newVersion: Date.now(),
        affectedUsers: result.modifiedCount,
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
      await connectDb();
      const result = await LoginLog.updateOne({ sessionId }, { status: 'revoked', logoutTime: new Date() });
      if (result.matchedCount !== 1) {
        return NextResponse.json({ error: `Session ${sessionId} not found` }, { status: 404 });
      }

      // The token carries the user's generation; bumping it invalidates all
      // tokens currently signed with that generation (single-admin model).
      await User.updateMany({}, { $inc: { authGeneration: 1 } });

      return NextResponse.json({ success: true, message: `Session ${sessionId} revoked.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Access logs POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Action failed' }, { status, headers: NO_CACHE_HEADERS });
  }
}
