import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Film from '@/models/Film';
import { formatVideoEmbedUrl } from '@/lib/videoUrlHelper';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

async function connectDb() {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (err) {
      console.warn('MongoDB connection error in films route:', err);
    }
  }
}

export async function GET() {
  try {
    await connectDb();
    if (mongoose.connection.readyState === 1) {
      const films = await Film.find().sort({ order: 1, createdAt: -1 }).lean();
      if (films) {
        const normalized = films.map((f: any) => ({
          ...f,
          videoUrl: formatVideoEmbedUrl(f.videoUrl),
        }));
        return NextResponse.json(normalized);
      }
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching films:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const { title, description, videoUrl, thumbnailUrl, publicId, category, duration, featured, order } = body;

    if (!title || !videoUrl) {
      return NextResponse.json({ error: 'Title and Video URL are required' }, { status: 400 });
    }

    const normalizedVideoUrl = formatVideoEmbedUrl(videoUrl);

    if (mongoose.connection.readyState === 1) {
      const newFilm = await Film.create({
        title,
        description: description || '',
        videoUrl: normalizedVideoUrl,
        thumbnailUrl: thumbnailUrl || '',
        publicId: publicId || '',
        category: category || 'Films',
        duration: duration || '',
        featured: Boolean(featured),
        order: Number(order) || 0,
      });
      triggerRevalidation();
      return NextResponse.json(newFilm, { status: 201 });
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, item: { ...body, videoUrl: normalizedVideoUrl } }, { status: 201 });
  } catch (error) {
    console.error('Error creating film:', error);
    return NextResponse.json({ error: 'Failed to create film' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const body = await request.json();
    const id = idParam || body.id || body._id;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (body.videoUrl) {
      body.videoUrl = formatVideoEmbedUrl(body.videoUrl);
    }

    if (mongoose.connection.readyState === 1) {
      const updated = await Film.findByIdAndUpdate(id, body, { new: true });
      triggerRevalidation();
      return NextResponse.json(updated);
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, item: body });
  } catch (error) {
    console.error('Error updating film:', error);
    return NextResponse.json({ error: 'Failed to update film' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    if (mongoose.connection.readyState === 1) {
      await Film.findByIdAndDelete(id);
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Film deleted' });
  } catch (error) {
    console.error('Error deleting film:', error);
    return NextResponse.json({ error: 'Failed to delete film' }, { status: 500 });
  }
}
