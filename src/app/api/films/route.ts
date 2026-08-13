import { NextResponse } from 'next/server';
import {
  fetchAllFilms,
  createNewFilm,
  updateExistingFilm,
  deleteExistingFilm,
} from '@/lib/filmsStorage';
import { triggerRevalidation } from '@/lib/revalidate';
import { validateFilmPayload } from '@/lib/filmValidation';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const films = await fetchAllFilms();
    return NextResponse.json(films, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching films:', error);
    const fallback = await fetchAllFilms();
    return NextResponse.json(fallback, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validation = validateFilmPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid film payload' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const created = await createNewFilm(body);
    triggerRevalidation();
    return NextResponse.json(created, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error creating film:', error);
    return NextResponse.json({ error: 'Failed to create film' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const body = await request.json();
    const id = idParam || body.id || body._id;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    const validation = validateFilmPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid film payload' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const updated = await updateExistingFilm(id, body);
    triggerRevalidation();
    return NextResponse.json(updated || { success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error updating film:', error);
    return NextResponse.json({ error: 'Failed to update film' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    await deleteExistingFilm(id);
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Film deleted' }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error deleting film:', error);
    return NextResponse.json({ error: 'Failed to delete film' }, { status: 500 });
  }
}
