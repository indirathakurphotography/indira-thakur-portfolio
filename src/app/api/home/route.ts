import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
import { fetchSiteConfig, updateSiteConfigData } from '@/lib/siteConfigStorage';
import { DEFAULT_FULL_SITE_CONFIG } from '@/lib/siteConfigDefaults';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const config = await fetchSiteConfig();
    const home = config?.home || DEFAULT_FULL_SITE_CONFIG.home;
    return NextResponse.json(home, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Home API GET error:', error);
    return NextResponse.json(DEFAULT_FULL_SITE_CONFIG.home, { headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const currentConfig = await fetchSiteConfig();
    const updatedHome = {
      ...(currentConfig?.home || DEFAULT_FULL_SITE_CONFIG.home),
      ...body,
    };

    await updateSiteConfigData({ home: updatedHome });
    triggerRevalidation();

    return NextResponse.json(updatedHome, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Home API PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json(
      { error: error?.message || 'Failed to update homepage settings' },
      { status, headers: NO_CACHE_HEADERS }
    );
  }
}
