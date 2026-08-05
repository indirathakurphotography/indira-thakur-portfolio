import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

function getNormalizedCategoryFilter(category: string): Record<string, unknown> | null {
  if (!category || !category.trim() || category.toLowerCase() === 'all') {
    return null;
  }
  const catLower = category.toLowerCase().trim();
  if (catLower.includes('newborn')) {
    return { category: { $regex: /newborn/i } };
  }
  if (catLower.includes('maternity') || catLower.includes('birth')) {
    return { category: { $regex: /maternity/i } };
  }
  if (catLower.includes('event') || catLower.includes('celebration')) {
    return { category: { $regex: /event/i } };
  }
  if (catLower.includes('portrait') || catLower.includes('fine art') || catLower.includes('child') || catLower.includes('baby') || catLower.includes('family')) {
    return { category: { $regex: /portrait/i } };
  }
  if (catLower.includes('wedding')) {
    return { category: { $regex: /wedding/i } };
  }
  if (catLower.includes('brand') || catLower.includes('collab')) {
    return { category: { $regex: /brand/i } };
  }
  return { category: { $regex: new RegExp(catLower.replace(/[^a-z0-9]/g, '.*'), 'i') } };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let items: any[] = [];
    let total = 0;

    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();

        const filter: Record<string, unknown> = {};
        if (category) {
          const catFilter = getNormalizedCategoryFilter(category);
          if (catFilter) Object.assign(filter, catFilter);
        }
        if (featured === 'true') filter.featured = true;

        const [dbTotal, dbItems] = await Promise.all([
          GalleryImage.countDocuments(filter),
          GalleryImage.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ]);

        total = dbTotal;
        items = dbItems || [];
      } catch (dbErr) {
        console.warn('MongoDB gallery fetch failed:', dbErr);
      }
    }

    const mapped = items.map((item: any) => ({
      ...item,
      _id: item._id ? String(item._id) : item.id || `img-${Math.random().toString(36).substr(2, 9)}`,
      thumbnail: item.thumbnail || item.src,
      src: item.src,
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
    });
  } catch (error) {
    console.error('GalleryImage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
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
