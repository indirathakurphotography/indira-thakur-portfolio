import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
