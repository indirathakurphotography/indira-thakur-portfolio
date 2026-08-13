import { NextResponse } from 'next/server';
import { fetchAboutData, updateAboutData } from '@/lib/aboutStorage';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const aboutData = await fetchAboutData();
    return NextResponse.json(aboutData, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('About GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch About content' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const updated = await updateAboutData(body);
    triggerRevalidation();
    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('About PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update About content' }, { status, headers: NO_CACHE_HEADERS });
  }
}
