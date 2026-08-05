import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Film from '@/models/Film';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const films = await Film.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(films);
  } catch (error) {
    console.error('Error fetching films:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch films' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { title, description, videoUrl, thumbnailUrl, publicId, category, duration, featured, order } = body;

    if (!title || !videoUrl) {
      return NextResponse.json({ error: 'Title and Video URL are required' }, { status: 400 });
    }

    const newFilm = await Film.create({
      title,
      description: description || '',
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      publicId: publicId || '',
      category: category || 'Films',
      duration: duration || '',
      featured: Boolean(featured),
      order: Number(order) || 0,
    });
    return NextResponse.json(newFilm, { status: 201 });
  } catch (error) {
    console.error('Error creating film:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create film' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const body = await request.json();
    const id = idParam || body.id || body._id;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    const updated = await Film.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating film:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update film' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    await Film.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Film deleted' });
  } catch (error) {
    console.error('Error deleting film:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete film' },
      { status: 500 }
    );
  }
}
