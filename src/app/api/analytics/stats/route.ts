import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsStats } from '@/lib/analyticsStorage';
import { requireAdmin } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const stats = await getAnalyticsStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[analytics/stats] Error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch analytics' }, { status });
  }
}
