import { NextResponse } from 'next/server';
import SiteConfig from '@/models/SiteConfig';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const config = await SiteConfig.findOne().lean();
    return NextResponse.json(serializeDoc(config) || {});
  } catch (error: any) {
    console.error('CMS export error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Export failed' }, { status });
  }
}
