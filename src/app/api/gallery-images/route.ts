import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
          filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
        }
        if (featured === 'true') filter.featured = true;

        const projection = 'src width height category shoot alt title order createdAt';

        const [dbTotal, dbItems] = await Promise.all([
          GalleryImage.countDocuments(filter),
          GalleryImage.find(filter, projection)
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ]);

        if (dbItems) {
          total = dbTotal;
          items = dbItems;
        }
      } catch (dbErr) {
        console.warn('MongoDB gallery fetch failed:', dbErr);
      }
    }

    const mapped = items.map((item) => ({
      ...item,
      thumbnail: item.src,
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

function triggerRevalidation() {
  try {
    revalidatePath('/');
    revalidatePath('/gallery');
    revalidatePath('/admin');
    revalidatePath('/admin/gallery');
    revalidateTag('gallery', 'default');
    revalidateTag('site-config', 'default');
  } catch (e) {
    console.warn('Gallery revalidate error:', e);
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
