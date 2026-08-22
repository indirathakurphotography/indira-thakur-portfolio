import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDb } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request);
    if (user) {
      await connectDb();
      if (user.sessionId) {
        const LoginLog = (await import('@/models/LoginLog')).default;
        await LoginLog.updateOne(
          { sessionId: user.sessionId },
          { status: 'logged_out', logoutTime: new Date() }
        ).catch(() => {});
      }

      const { recordAuditLog } = await import('@/lib/auditLogger');
      await recordAuditLog(request, {
        action: 'ADMIN_LOGOUT',
        adminEmail: user.email,
        adminName: user.name || 'Admin',
        targetResource: 'Admin CMS',
        details: 'Administrator logged out',
        status: 'success',
      });
    }
  } catch (err) {
    console.warn('Logout logging error:', err);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

