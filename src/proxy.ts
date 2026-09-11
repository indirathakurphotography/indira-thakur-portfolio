import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getClientIp, isIpBlocked, logBlockedAccess } from '@/lib/security';
import { getJwtSecret } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimit';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Server-side denylist: blocked sources receive 403
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

  // 2. Sliding window rate limiting on sensitive API endpoints
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const limitResult = checkRateLimit(ip, 'login', 10, 60);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a moment and try again.' },
        { status: 429, headers: getRateLimitHeaders(limitResult) }
      );
    }
  }

  if (pathname === '/api/auth/reset-password' && request.method === 'POST') {
    const limitResult = checkRateLimit(ip, 'reset-pass', 5, 900);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(limitResult) }
      );
    }
  }

  if (pathname === '/api/contact' && request.method === 'POST') {
    const limitResult = checkRateLimit(ip, 'contact', 5, 60);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment before sending another message.' },
        { status: 429, headers: getRateLimitHeaders(limitResult) }
      );
    }
  }

  if (pathname === '/api/chat' && request.method === 'POST') {
    const limitResult = checkRateLimit(ip, 'chat', 20, 60);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Concierge is currently busy. Please wait a moment.' },
        { status: 429, headers: getRateLimitHeaders(limitResult) }
      );
    }
  }

  if (pathname.startsWith('/api/upload') && (request.method === 'POST' || request.method === 'PUT')) {
    const limitResult = checkRateLimit(ip, 'upload', 30, 60);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please wait a minute.' },
        { status: 429, headers: getRateLimitHeaders(limitResult) }
      );
    }
  }

  // 3. Admin UI authentication check
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const authToken = request.cookies.get('auth_token')?.value;
    const secret = getJwtSecret();

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

  // 4. Apply standard security headers to all downstream responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
