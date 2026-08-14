import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { parseUserAgent, getClientIp } from '@/lib/uaParser';
import LoginLog from '@/models/LoginLog';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const secret = getJwtSecret();
    if (!secret) {
      return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const ip = getClientIp(request);
    const uaHeader = request.headers.get('user-agent') || '';
    const { browser, os, device } = parseUserAgent(uaHeader);

    let authenticatedUser: { email: string; role: string; name: string; userId: string; authGeneration?: number } | null = null;

    // Authentication is MongoDB-backed only.  There is deliberately no hardcoded
    // administrator account or environment-password bypass.
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Authentication database is not configured.' }, { status: 503 });
    }
    try {
        const { connectToDatabase } = await import('@/lib/mongodb');
        const User = (await import('@/models/User')).default;
        await connectToDatabase();

        const user = await (User as any).findOne({ email: cleanEmail });

        if (user && user.isActive !== false && (user.role === 'admin' || user.role === 'editor')) {
          if (typeof user.comparePassword === 'function') {
            const isMatch = await user.comparePassword(cleanPassword);

            if (isMatch) {
              authenticatedUser = {
                email: user.email,
                role: user.role,
                name: user.name || 'Super Admin',
                userId: user._id.toString(),
                authGeneration: typeof user.authGeneration === 'number' ? user.authGeneration : 1,
              };

              user.lastLogin = new Date();
              user.lastActive = new Date();
              await user.save().catch(() => {});
            }
          }
        }
    } catch (dbErr) {
      console.error('[Auth] MongoDB auth check error:', dbErr);
      return NextResponse.json({ error: 'Authentication database is unavailable.' }, { status: 503 });
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!authenticatedUser) {
      // Record failed attempt
      if (process.env.MONGODB_URI) {
        try {
          const { connectToDatabase } = await import('@/lib/mongodb');
          await connectToDatabase();
          await LoginLog.create({
            email: cleanEmail,
            ip,
            userAgent: uaHeader,
            browser,
            os,
            device,
            location: ip.startsWith('10.') || ip === '127.0.0.1' ? 'Internal Network' : 'Mumbai, MH, India',
            status: 'failed',
            sessionId,
            sessionVersion: 1,
          }).catch(() => {});
        } catch {}
      }

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Record successful login
    if (process.env.MONGODB_URI) {
      try {
        const { connectToDatabase } = await import('@/lib/mongodb');
        await connectToDatabase();
        await LoginLog.create({
          email: authenticatedUser.email,
          userId: authenticatedUser.userId,
          ip,
          userAgent: uaHeader,
          browser,
          os,
          device,
          location: ip.startsWith('10.') || ip === '127.0.0.1' ? 'Internal Network' : 'Mumbai, MH, India',
          status: 'success',
          sessionId,
          sessionVersion: authenticatedUser.authGeneration ?? 1,
        }).catch(() => {});
      } catch {}
    }

    // 4. Issue Token with sessionVersion
    const token = jwt.sign(
      {
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        name: authenticatedUser.name,
        userId: authenticatedUser.userId,
        sessionId,
        authGeneration: authenticatedUser.authGeneration ?? 1,
      },
      secret,
      { expiresIn: '30d' }
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: authenticatedUser,
      sessionId,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Unexpected login error:', error?.message || error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
