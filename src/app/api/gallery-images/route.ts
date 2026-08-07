import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';
import { normalizeCategory } from '@/lib/categoryUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '500', 10)));
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const conn = await connectToDatabase();
    if (!conn) {
      console.warn('MongoDB connection failed in GET /api/gallery-images');
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        totalPages: 1,
        message: 'Database connection unavailable'
      }, { status: 200 });
    }

    const filter: Record<string, unknown> = {};
    if (category && category.trim() && category.toLowerCase() !== 'all') {
      const norm = normalizeCategory(category);
      if (norm === 'brand') {
        filter.category = { $regex: /brand|collaboration/i };
      } else if (norm === 'newborn') {
        filter.category = { $regex: /newborn|baby|infant/i };
      } else if (norm === 'maternity') {
        filter.category = { $regex: /maternity|pregnancy/i };
      } else if (norm === 'portrait') {
        filter.category = { $regex: /portrait/i };
      } else if (norm === 'family') {
        filter.category = { $regex: /family|families/i };
      } else if (norm === 'events') {
        filter.category = { $regex: /event/i };
      } else if (norm === 'wedding') {
        filter.category = { $regex: /wedding/i };
      } else if (norm === 'couple') {
        filter.category = { $regex: /couple/i };
      } else {
        const escaped = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.category = { $regex: new RegExp(escaped, 'i') };
      }
    }
    if (featured === 'true') filter.featured = true;

    const total = await GalleryImage.countDocuments(filter);
    const items = await GalleryImage.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const mapped = (items || []).map((item: any) => ({
      ...item,
      _id: String(item._id || ''),
      thumbnail: item.thumbnail || item.src || '',
      src: item.src || '',
      alt: item.alt || item.title || '',
      title: item.title || '',
      description: item.description || '',
      width: item.width || 800,
      height: item.height || 1000,
      category: item.category || 'Portrait',
      featured: !!item.featured,
      order: item.order ?? 0,
    }));

    return NextResponse.json({
      items: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error: any) {
    console.error('GalleryImage GET error:', error);
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
      error: 'Failed to fetch gallery images',
      message: error?.message || String(error),
    }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    if (!body.src) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const item = await GalleryImage.create({
      src: body.src,
      publicId: body.publicId || '',
      alt: body.alt || body.title || '',
      title: body.title || '',
      description: body.description || '',
      width: body.width || 800,
      height: body.height || 1000,
      category: body.category || '',
      featured: !!body.featured,
      order: body.order ?? 0,
    });

    triggerRevalidation();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('GalleryImage POST error:', error);
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const item = await GalleryImage.findByIdAndUpdate(id, updateData, { new: true });
    if (!item) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }

    triggerRevalidation();

    return NextResponse.json(item);
  } catch (error) {
    console.error('GalleryImage PUT error:', error);
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const item = await GalleryImage.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }

    triggerRevalidation();

    return NextResponse.json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (error) {
    console.error('GalleryImage DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}
