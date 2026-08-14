import { NextResponse } from 'next/server';
import SEO from '@/models/SEO';
import { requireAdmin, connectDb } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { triggerRevalidation } from '@/lib/revalidate';

const SEOModel = SEO as any;

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    await connectDb();
    const seo = await SEOModel.findOne().lean();
    return NextResponse.json(seo || {}, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('SEO GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const body = await request.json();
    assertNoProhibitedLanguage(body);
    const { _id, id, __v, createdAt, updatedAt, ...updateData } = body;

    const seo: any = await SEOModel.findOneAndUpdate({}, { $set: updateData }, { new: true, upsert: true }).lean();
    if (!seo) {
      return NextResponse.json({ error: 'Failed to persist SEO settings' }, { status: 500 });
    }

    // Read-after-write verification
    const fresh = await SEOModel.findOne().lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: SEO settings were not found in MongoDB.' }, { status: 500 });
    }

    triggerRevalidation();
    return NextResponse.json(fresh, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('SEO PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update SEO settings' }, { status, headers: NO_CACHE_HEADERS });
  }
}
