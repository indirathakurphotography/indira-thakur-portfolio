import { NextResponse } from 'next/server';
import { fetchFooterData, updateFooterData } from '@/lib/footerStorage';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const data = await fetchFooterData();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Footer GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch footer data' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const updated = await updateFooterData(body);
    triggerRevalidation();
    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Footer PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update footer data' }, { status, headers: NO_CACHE_HEADERS });
  }
}
