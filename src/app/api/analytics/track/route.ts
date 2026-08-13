import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/analyticsStorage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, device, browser, os, sessionId } = body || {};

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    // Do not track internal admin page views
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ success: true, ignored: true });
    }

    await recordPageView({
      path,
      referrer,
      device,
      browser,
      os,
      sessionId: sessionId || 'anon_session',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[analytics/track] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
