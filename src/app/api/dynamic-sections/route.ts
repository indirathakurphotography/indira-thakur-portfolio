import { NextResponse } from 'next/server';
import DynamicSections from '@/models/DynamicSections';
import { requireAdmin, connectDb } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

const DynamicSectionsModel = DynamicSections as any;

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageKey = searchParams.get('pageKey');

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey query parameter is required' }, { status: 400 });
    }

    await connectDb();
    const doc = await DynamicSectionsModel.findOne({ pageKey }).lean();
    return NextResponse.json(doc || { pageKey, sections: [] }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('DynamicSections GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dynamic sections' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const body = await request.json();
    const { pageKey, sections } = body;

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey is required' }, { status: 400 });
    }

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: 'sections must be an array' }, { status: 400 });
    }

    const doc: any = await DynamicSectionsModel.findOneAndUpdate(
      { pageKey },
      { pageKey, sections },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    if (!doc) {
      return NextResponse.json({ error: 'Failed to persist dynamic sections' }, { status: 500 });
    }

    // Read-after-write verification
    const fresh = await DynamicSectionsModel.findOne({ pageKey }).lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: dynamic sections were not found in MongoDB.' }, { status: 500 });
    }

    triggerRevalidation();
    return NextResponse.json(fresh, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('DynamicSections PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update dynamic sections' }, { status, headers: NO_CACHE_HEADERS });
  }
}
