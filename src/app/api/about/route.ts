import { NextResponse } from 'next/server';
import { fetchAboutData, updateAboutData } from '@/lib/aboutStorage';
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
    const fallback = await fetchAboutData();
    return NextResponse.json(fallback, { headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateAboutData(body);
    triggerRevalidation();
    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('About PUT error:', error);
    return NextResponse.json({ error: 'Failed to update About content' }, { status: 500 });
  }
}
