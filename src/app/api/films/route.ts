import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Film from '@/models/Film';
import { formatVideoEmbedUrl } from '@/lib/videoUrlHelper';

export const dynamic = 'force-dynamic';

const DEFAULT_FILMS = [
  {
    _id: 'default-film-1',
    title: 'The Royal Himachali Story',
    description: 'A breathtaking wedding highlight capturing traditional rituals, serene mountain landscapes, and timeless motion.',
    videoUrl: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
    category: 'Cinematography',
    duration: '3:45',
    featured: true,
    order: 1,
  },
  {
    _id: 'default-film-2',
    title: 'Newborn Storytelling — First Whispers',
    description: 'Gentle acoustic soundscapes and peaceful newborn slumbers preserved in cinematic high definition.',
    videoUrl: 'https://drive.google.com/file/d/1d3h-mN7_yq8x9W8v-0v7n4z8m9L0K1J2/view',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=1200',
    category: 'Newborn',
    duration: '2:15',
    featured: true,
    order: 2,
  },
  {
    _id: 'default-film-3',
    title: 'Fine Art Maternity Vignette',
    description: 'Editorial maternity portraiture set to slow ambient strings and warm golden-hour light.',
    videoUrl: 'https://drive.google.com/file/d/1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7/view',
    thumbnailUrl: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1200',
    category: 'Maternity',
    duration: '4:10',
    featured: false,
    order: 3,
  },
];

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
      if (films && films.length > 0) {
        const normalized = films.map((f: any) => ({
          ...f,
          videoUrl: formatVideoEmbedUrl(f.videoUrl),
        }));
        return NextResponse.json(normalized);
      }
    }
    return NextResponse.json(DEFAULT_FILMS);
  } catch (error) {
    console.error('Error fetching films:', error);
    return NextResponse.json(DEFAULT_FILMS);
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
      return NextResponse.json(newFilm, { status: 201 });
    }

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
      return NextResponse.json(updated);
    }

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

    return NextResponse.json({ success: true, message: 'Film deleted' });
  } catch (error) {
    console.error('Error deleting film:', error);
    return NextResponse.json({ error: 'Failed to delete film' }, { status: 500 });
  }
}
