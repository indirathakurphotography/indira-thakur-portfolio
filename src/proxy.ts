import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getClientIp, isIpBlocked, logBlockedAccess } from '@/lib/security';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Server-side denylist: blocked sources receive 403 for every /admin/*
  // route BEFORE any page or auth flow is reached. Public routes are never
  // matched by the proxy matcher, so normal visitors are unaffected.
  const ip = getClientIp(request);
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    await logBlockedAccess({
      ip,
      path: pathname,
      method: request.method,
      reason: 'denylist',
      userAgent: request.headers.get('user-agent') || '',
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const authToken = request.cookies.get('auth_token')?.value;
    const secret = process.env.JWT_SECRET || '';

    let valid = false;
    if (authToken && secret) {
      try {
        const decoded = jwt.verify(authToken, secret) as { email?: string };
        valid = !!decoded?.email;
      } catch {
        valid = false;
      }
    }

    if (!valid) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear any stale/invalid token so the login page starts clean.
      response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
