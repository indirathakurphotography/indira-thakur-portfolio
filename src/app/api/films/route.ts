import { NextResponse } from 'next/server';
import {
  fetchAllFilms,
  createNewFilm,
  updateExistingFilm,
  deleteExistingFilm,
} from '@/lib/filmsStorage';
import { requireAdmin } from '@/lib/cmsDatabase';
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
    return NextResponse.json({ error: 'Failed to fetch films' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
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
  } catch (error: any) {
    console.error('Error creating film:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create film' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
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
    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error updating film:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update film' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    await deleteExistingFilm(id);
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Film deleted' }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error deleting film:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete film' }, { status, headers: NO_CACHE_HEADERS });
  }
}
