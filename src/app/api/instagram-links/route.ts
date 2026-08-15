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

export async function GET(request: Request) {
  try {
    return NextResponse.json(await listInstagramLinks(new URL(request.url).searchParams.get('category') || undefined));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Instagram links' }, { status: 503 });
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
