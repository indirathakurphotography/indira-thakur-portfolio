import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
import {
  fetchAllGalleryImages,
  createGalleryImageItem,
  updateGalleryImageItem,
  deleteGalleryImageItem,
} from '@/lib/galleryStorage';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const items = await fetchAllGalleryImages(category);
    return NextResponse.json(items, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Gallery GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    if (!body.src) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const item = await createGalleryImageItem(body);

    triggerRevalidation();
    return NextResponse.json(item, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Gallery POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create gallery item' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = body.id || body._id || searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const { id: _ignoreId, _id: _ignoreUnderscoreId, ...updateData } = body;
    const item = await updateGalleryImageItem(id, updateData);

    triggerRevalidation();
    return NextResponse.json(item, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Gallery PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update gallery item' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    await deleteGalleryImageItem(id);

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Gallery item deleted' }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Gallery DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete gallery item' }, { status, headers: NO_CACHE_HEADERS });
  }
}
