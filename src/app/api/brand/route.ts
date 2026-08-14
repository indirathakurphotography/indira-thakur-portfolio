import { NextResponse } from 'next/server';
import BrandSettings from '@/models/BrandSettings';
import { requireAdmin, connectDb } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    await connectDb();
    const brand = await BrandSettings.findOne().lean();
    return NextResponse.json(brand || {}, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Brand GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand settings' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const body = await request.json();
    assertNoProhibitedLanguage(body);
    const { _id, id, __v, createdAt, updatedAt, ...updateData } = body;

    const brand: any = await BrandSettings.findOneAndUpdate({}, { $set: updateData }, { new: true, upsert: true }).lean();
    if (!brand) {
      return NextResponse.json({ error: 'Failed to persist brand settings' }, { status: 500 });
    }

    // Read-after-write verification
    const fresh = await BrandSettings.findOne().lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: brand settings were not found in MongoDB.' }, { status: 500 });
    }

    triggerRevalidation();
    return NextResponse.json(fresh, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Brand PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update brand settings' }, { status, headers: NO_CACHE_HEADERS });
  }
}
