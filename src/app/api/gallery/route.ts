import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';
import {
  fetchAllGalleryImages,
  createGalleryImageItem,
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
    return NextResponse.json([], { status: 200, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!body.src) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const item = await createGalleryImageItem(body);

    triggerRevalidation();
    return NextResponse.json(item, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Gallery POST error:', error);
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    await deleteGalleryImageItem(id);

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Gallery item deleted' }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Gallery DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
  }
}


