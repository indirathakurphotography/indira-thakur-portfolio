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
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '500', 10)));
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let allItems = await fetchAllGalleryImages(category);

    if (featured === 'true') {
      allItems = allItems.filter((i) => i.featured);
    }

    const total = allItems.length;
    const start = (page - 1) * limit;
    const paginatedItems = allItems.slice(start, start + limit);

    return NextResponse.json({
      items: paginatedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    }, {
      headers: NO_CACHE_HEADERS,
    });
  } catch (error: any) {
    console.error('GalleryImage GET error:', error);
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

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('GalleryImage POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create gallery image' }, { status });
  }
}

function searchParamsGet(req: Request, key: string): string | null {
  try {
    const url = new URL(req.url);
    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const id = body.id || body._id || request.headers.get('x-id');
    const { id: _ignoreId, _id: _ignoreUnderscoreId, ...updateData } = body;

    const targetId = id || searchParamsGet(request, 'id');

    if (!targetId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const item = await updateGalleryImageItem(targetId, updateData);

    triggerRevalidation();

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('GalleryImage PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update gallery image' }, { status });
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

    return NextResponse.json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (error: any) {
    console.error('GalleryImage DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete gallery image' }, { status });
  }
}
