import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { createInstagramLink, deleteInstagramLink, listInstagramLinks, updateInstagramLink } from '@/lib/instagramLinksStorage';

export const dynamic = 'force-dynamic';

function isInstagramUrl(value: unknown): boolean {
  try {
    return new URL(String(value)).hostname.replace(/^www\./, '').toLowerCase() === 'instagram.com';
  } catch {
    return false;
  }
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const admin = url.searchParams.get('admin') === 'true';
    const items = await listInstagramLinks(category, admin);
    return NextResponse.json(items, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Instagram links' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    if (!body.category || !body.url || !['instagram', 'video'].includes(body.mediaType)) {
      return NextResponse.json({ error: 'Category, media type and URL are required' }, { status: 400 });
    }
    if (body.mediaType === 'instagram' && !isInstagramUrl(body.url)) {
      return NextResponse.json({ error: 'Please use a full public Instagram URL from instagram.com.' }, { status: 400 });
    }
    return NextResponse.json(await createInstagramLink(body), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create Instagram item' }, { status: error?.status || 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = body._id || body.id || new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    if (body.mediaType === 'instagram' && body.url && !isInstagramUrl(body.url)) {
      return NextResponse.json({ error: 'Please use a full public Instagram URL from instagram.com.' }, { status: 400 });
    }
    return NextResponse.json(await updateInstagramLink(id, body));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update Instagram item' }, { status: error?.status || 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    await deleteInstagramLink(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete Instagram item' }, { status: error?.status || 500 });
  }
}
