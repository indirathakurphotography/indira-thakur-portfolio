import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/analyticsStorage';
import { getClientIp } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, referrer, device, browser, os, sessionId } = body || {};

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    // Do not track internal admin page views or API calls
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const ip = getClientIp(req);
    const country =
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('x-country-code') ||
      (ip === '127.0.0.1' || ip.startsWith('10.') ? 'Local/Dev' : 'IN');

    const city =
      req.headers.get('x-vercel-ip-city') ||
      req.headers.get('cf-ipcity') ||
      (ip === '127.0.0.1' || ip.startsWith('10.') ? 'Internal' : 'Mumbai');

    await recordPageView({
      path,
      referrer,
      device,
      browser,
      os,
      ip,
      country,
      city,
      sessionId: sessionId || 'anon_session',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[analytics/track] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
