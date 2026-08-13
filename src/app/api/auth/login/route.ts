import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret, getGlobalAuthGeneration } from '@/lib/auth';
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const ip = getClientIp(request);
    const uaHeader = request.headers.get('user-agent') || '';
    const { browser, os, device } = parseUserAgent(uaHeader);

    let authenticatedUser: { email: string; role: string; name: string; userId: string } | null = null;

    const configuredEmail = (process.env.ADMIN_EMAIL || 'admin@indirathakur.com').trim().toLowerCase();
    const configuredPassword = (process.env.ADMIN_PASSWORD || 'Admin@indira').trim();

    // 1. Try MongoDB Authentication
    if (process.env.MONGODB_URI) {
      try {
        const { connectToDatabase } = await import('@/lib/mongodb');
        const User = (await import('@/models/User')).default;
        const bcrypt = (await import('bcryptjs')).default;
        await connectToDatabase();

        const user = await (User as any).findOne({ email: cleanEmail });

        if (user && user.isActive !== false) {
          if (typeof user.comparePassword === 'function') {
            let isMatch = await user.comparePassword(cleanPassword);
            
            // If DB password check failed, check if input password matches configured master password
            if (!isMatch && (cleanEmail === configuredEmail || cleanEmail === 'admin@indirathakurphotography.com') && cleanPassword === configuredPassword) {
              isMatch = true;
              // Sync updated password hash to MongoDB
              user.password = await bcrypt.hash(cleanPassword, 12);
              user.authGeneration = (user.authGeneration || 1) + 1;
            }

            if (isMatch) {
              authenticatedUser = {
                email: user.email,
                role: user.role || 'admin',
                name: user.name || 'Super Admin',
                userId: user._id.toString(),
              };

              user.lastLogin = new Date();
              user.lastActive = new Date();
              await user.save().catch(() => {});
            }
          }
        } else if (!user && (cleanEmail === configuredEmail || cleanEmail === 'admin@indirathakurphotography.com') && cleanPassword === configuredPassword) {
          // Upsert Super Admin account into MongoDB if it doesn't exist yet
          try {
            const hashedPassword = await bcrypt.hash(cleanPassword, 12);
            const newUser = await User.create({
              name: 'Super Admin',
              email: cleanEmail,
              password: hashedPassword,
              role: 'admin',
              isActive: true,
              lastLogin: new Date(),
              lastActive: new Date(),
              authGeneration: 2,
            });
            authenticatedUser = {
              email: newUser.email,
              role: newUser.role || 'admin',
              name: newUser.name || 'Super Admin',
              userId: newUser._id.toString(),
            };
          } catch (createErr) {
            console.error('[Auth] Failed to create Super Admin user record:', createErr);
          }
        }
      } catch (dbErr) {
        console.error('[Auth] MongoDB auth check error:', dbErr);
      }
    }

    // 2. Fallback check for configured primary admin credentials (if DB not available or offline)
    if (!authenticatedUser && (cleanEmail === configuredEmail || cleanEmail === 'admin@indirathakurphotography.com')) {
      if (cleanPassword === configuredPassword) {
        authenticatedUser = {
          email: cleanEmail,
          role: 'admin',
          name: 'Super Admin',
          userId: 'default-admin-id',
        };
      }
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentGen = getGlobalAuthGeneration();

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
            sessionVersion: currentGen,
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
          sessionVersion: currentGen,
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
        authGeneration: currentGen,
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
