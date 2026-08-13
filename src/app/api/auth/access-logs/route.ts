import { NextResponse } from 'next/server';
import { requireAuth, bumpGlobalAuthGeneration } from '@/lib/auth';
import LoginLog from '@/models/LoginLog';
import { connectDb } from '@/lib/cmsDatabase';
import { serializeDoc } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionId } = await request.json();

    if (action === 'revoke_all') {
      await connectDb();
      await LoginLog.updateMany({ status: 'success' }, { status: 'revoked', logoutTime: new Date() });

      const newVersion = bumpGlobalAuthGeneration();

      const response = NextResponse.json({
        success: true,
        message: 'All active admin sessions have been revoked globally.',
        newVersion,
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

      return NextResponse.json({ success: true, message: `Session ${sessionId} revoked.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Access logs POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Action failed' }, { status, headers: NO_CACHE_HEADERS });
  }
}
