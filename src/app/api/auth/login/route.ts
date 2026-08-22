import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { parseUserAgent, getClientIp } from '@/lib/uaParser';
import LoginLog from '@/models/LoginLog';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { assertIpNotBlocked } = await import('@/lib/security');
    await assertIpNotBlocked(request);

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

    // Check MongoDB first if available, otherwise check in-memory store
    let foundInDb = false;
    try {
      const { connectToDatabase } = await import('@/lib/mongodb');
      const User = (await import('@/models/User')).default;
      const db = await connectToDatabase();

      if (db) {
        foundInDb = true;
        const user = await (User as any).findOne({ email: cleanEmail });

        if (user) {
          if (user.isActive === false || user.isBlocked === true || user.status === 'blocked' || user.status === 'disabled') {
            const reason = user.isBlocked || user.status === 'blocked' ? 'Account is blocked' : 'Account is disabled';
            const { recordAuditLog } = await import('@/lib/auditLogger');
            await recordAuditLog(request, {
              action: 'ADMIN_LOGIN_REJECTED',
              adminEmail: cleanEmail,
              adminName: user.name || 'Admin',
              targetResource: `User: ${cleanEmail}`,
              details: `Login attempt rejected: ${reason}`,
              status: 'failed',
            });
            return NextResponse.json({ error: `${reason}. Please contact the primary administrator.` }, { status: 403 });
          }

          if (user.role === 'admin' || user.role === 'editor') {
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
        }
      }
    } catch (dbErr) {
      console.warn('[Auth] MongoDB auth check error, trying in-memory store:', dbErr);
    }

    if (!foundInDb || !authenticatedUser) {
      const { getInMemoryUsers } = await import('@/lib/auth');
      const bcrypt = (await import('bcryptjs')).default;
      const memUsers = getInMemoryUsers();
      const memUser = memUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      if (memUser) {
        if (memUser.isActive === false || memUser.isBlocked === true || memUser.status === 'blocked' || memUser.status === 'disabled') {
          const reason = memUser.isBlocked || memUser.status === 'blocked' ? 'Account is blocked' : 'Account is disabled';
          const { recordAuditLog } = await import('@/lib/auditLogger');
          await recordAuditLog(request, {
            action: 'ADMIN_LOGIN_REJECTED',
            adminEmail: cleanEmail,
            adminName: memUser.name || 'Admin',
            targetResource: `User: ${cleanEmail}`,
            details: `Login attempt rejected: ${reason}`,
            status: 'failed',
          });
          return NextResponse.json({ error: `${reason}. Please contact the primary administrator.` }, { status: 403 });
        }

        const isMatch = bcrypt.compareSync(cleanPassword, memUser.passwordHash);
        if (isMatch) {
          authenticatedUser = {
            email: memUser.email,
            role: memUser.role,
            name: memUser.name,
            userId: memUser._id,
            authGeneration: memUser.authGeneration || 1,
          };
          memUser.lastLogin = new Date().toISOString();
        }
      }
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!authenticatedUser) {
      // Record failed attempt
      try {
        const { connectToDatabase } = await import('@/lib/mongodb');
        const db = await connectToDatabase();
        if (db) {
          await LoginLog.create({
            email: cleanEmail,
            ip,
            userAgent: uaHeader,
            browser,
            os,
            device,
            status: 'failed',
            sessionId,
            sessionVersion: 1,
          }).catch(() => {});
        }
      } catch {}

      const { recordAuditLog } = await import('@/lib/auditLogger');
      await recordAuditLog(request, {
        action: 'ADMIN_LOGIN_FAILED',
        adminEmail: cleanEmail,
        adminName: 'Unknown',
        targetResource: 'Authentication',
        details: 'Invalid email or password',
        status: 'failed',
      });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Record successful login
    try {
      const { connectToDatabase } = await import('@/lib/mongodb');
      const db = await connectToDatabase();
      if (db) {
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
      }
    } catch {}

    const { getInMemoryLoginLogs } = await import('@/lib/auth');
    const memLogs = getInMemoryLoginLogs();
    memLogs.unshift({
      _id: sessionId,
      email: authenticatedUser.email,
      ip,
      userAgent: uaHeader,
      browser,
      os,
      device,
      status: 'success',
      sessionId,
      loginTime: new Date().toISOString(),
    });
    if (memLogs.length > 200) memLogs.pop();

    const { recordAuditLog } = await import('@/lib/auditLogger');
    await recordAuditLog(request, {
      action: 'ADMIN_LOGIN_SUCCESS',
      adminEmail: authenticatedUser.email,
      adminName: authenticatedUser.name,
      targetResource: 'Admin CMS',
      details: `Logged in via ${browser} on ${os}`,
      status: 'success',
    });

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
