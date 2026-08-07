import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Film from '@/models/Film';
import { formatVideoEmbedUrl } from '@/lib/videoUrlHelper';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const REAL_CLIENT_VIDEO_URL =
  'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/testimonials/1785434838420-aqp8kjipspxweauimz8l2-tjzkwyupz0y5i01hrqafypnmmua11dn-9x8xsjcebrymcsvle8wzptswuaymtxmnzocqxa9ofp.mp4';

const APPROVED_FILM = {
  _id: 'film-anurag-shalaka',
  title: 'Anurag & Shalaka',
  description:
    'A breathtaking wedding film capturing timeless love, intimate traditions, and gentle emotions.',
  videoUrl: REAL_CLIENT_VIDEO_URL,
  thumbnailUrl:
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/films/1785569204452-thumbnail.jpg',
  category: 'Wedding Film',
  duration: '3:45',
  featured: true,
  order: 1,
};

export const DEFAULT_FILMS = [APPROVED_FILM];

async function connectDb() {
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
    } catch (err) {
      console.warn('MongoDB connection error in films route:', err);
    }
  }
}

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

let cachedFilmsResponse: any = null;
let lastFilmsFetchTime = 0;
const CACHE_TTL_MS = 60000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedFilmsResponse && (now - lastFilmsFetchTime) < CACHE_TTL_MS) {
      return NextResponse.json(cachedFilmsResponse, { headers: CACHE_HEADERS });
    }

    await connectDb();
    let result = DEFAULT_FILMS;
    if (mongoose.connection.readyState === 1) {
      const films = await Film.find().sort({ order: 1, createdAt: -1 }).lean();

      if (films && films.length > 0) {
        result = films.map((f: any) => ({
          ...f,
          videoUrl: formatVideoEmbedUrl(f.videoUrl),
        }));
      }
    }

    cachedFilmsResponse = result;
    lastFilmsFetchTime = Date.now();

    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching films:', error);
    return NextResponse.json(DEFAULT_FILMS, { headers: CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  cachedFilmsResponse = null;
  try {
    await connectDb();
    const body = await request.json();
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      publicId,
      category,
      duration,
      featured,
      order,
    } = body;
    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: 'Title and Video URL are required' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { success: true, item: { ...body, videoUrl: normalizedVideoUrl } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating film:', error);
    return NextResponse.json(
      { error: 'Failed to create film' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  cachedFilmsResponse = null;
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const body = await request.json();
    const id = idParam || body.id || body._id;
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for update' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Failed to update film' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  cachedFilmsResponse = null;
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for deletion' },
        { status: 400 }
      );
    }
    if (mongoose.connection.readyState === 1) {
      await Film.findByIdAndDelete(id);
    }
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Film deleted' });
  } catch (error) {
    console.error('Error deleting film:', error);
    return NextResponse.json(
      { error: 'Failed to delete film' },
      { status: 500 }
    );
  }
}
