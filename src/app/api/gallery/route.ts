import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const items = await Gallery.find({}).sort({ order: 1, createdAt: -1 });
        if (items && items.length > 0) {
          return NextResponse.json(items);
        }
      } catch (dbErr) {
        console.warn('MongoDB gallery fetch failed, returning default fallback', dbErr);
      }
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('Gallery GET error:', error);
    return NextResponse.json([], { status: 200 });
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

    const item = await Gallery.create({
      src: body.src,
      publicId: body.publicId || '',
      alt: body.alt || body.title || '',
      title: body.title || '',
      description: body.description || '',
      width: body.width || 800,
      height: body.height || 1000,
      category: body.category || 'Portrait',
      featured: !!body.featured,
      order: body.order ?? 0,
    });

    triggerRevalidation();
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Gallery POST error:', error);
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 });
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

    const item = await Gallery.findByIdAndUpdate(id, updateData, { new: true });
    if (!item) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json(item);
  } catch (error) {
    console.error('Gallery PUT error:', error);
    return NextResponse.json({ error: 'Failed to update gallery item' }, { status: 500 });
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

    const item = await Gallery.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Gallery DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
  }
}
