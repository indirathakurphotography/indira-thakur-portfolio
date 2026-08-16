import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Gallery.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Gallery GET error:', error);
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

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Gallery POST error:', error);
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 });
  }
}
