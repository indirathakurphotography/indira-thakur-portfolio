import { NextResponse } from 'next/server';
import { requireAuth, bumpGlobalAuthGeneration } from '@/lib/auth';
import LoginLog from '@/models/LoginLog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.MONGODB_URI) {
      const { connectToDatabase } = await import('@/lib/mongodb');
      await connectToDatabase();

      const logs = await LoginLog.find({})
        .sort({ loginTime: -1 })
        .limit(100)
        .lean();

      return NextResponse.json({ logs });
    }

    return NextResponse.json({
      logs: [
        {
          _id: 'log-1',
          email: user.email,
          ip: '127.0.0.1',
          browser: 'Google Chrome',
          os: 'macOS',
          device: 'Desktop',
          location: 'Mumbai, MH, India',
          status: 'success',
          sessionId: user.sessionId || 'sess-current',
          loginTime: new Date().toISOString(),
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
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
      const newVersion = bumpGlobalAuthGeneration();

      if (process.env.MONGODB_URI) {
        try {
          const { connectToDatabase } = await import('@/lib/mongodb');
          await connectToDatabase();
          await LoginLog.updateMany({ status: 'success' }, { status: 'revoked', logoutTime: new Date() });
        } catch {}
      }

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
      if (process.env.MONGODB_URI) {
        try {
          const { connectToDatabase } = await import('@/lib/mongodb');
          await connectToDatabase();
          await LoginLog.updateOne({ sessionId }, { status: 'revoked', logoutTime: new Date() });
        } catch {}
      }

      return NextResponse.json({ success: true, message: `Session ${sessionId} revoked.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
