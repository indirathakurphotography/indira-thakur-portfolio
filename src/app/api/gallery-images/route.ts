import { NextResponse } from 'next/server';
import GalleryImage from '@/models/GalleryImage';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase, requireObjectId, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : 'Gallery request failed' }, { status: error instanceof CmsError ? error.status : 500, headers });

export async function GET(request: Request) {
  try {
    await requireDatabase();
    const search = new URL(request.url).searchParams;
    const page = Math.max(1, Number.parseInt(search.get('page') || '1', 10) || 1);
    const limit = Math.min(1000, Math.max(1, Number.parseInt(search.get('limit') || '100', 10) || 100));
    const query: Record<string, unknown> = {};
    if (search.get('category')) query.category = search.get('category');
    if (search.get('featured') === 'true') query.featured = true;
    const [total, items] = await Promise.all([
      (GalleryImage as any).countDocuments(query),
      (GalleryImage as any).find(query).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return NextResponse.json({ items: items.map(serialize), total, page, totalPages: Math.max(1, Math.ceil(total / limit)) }, { headers });
  } catch (error) { console.error('Gallery GET error:', error); return fail(error); }
}

export async function POST(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const body = await request.json();
    if (typeof body.src !== 'string' || !body.src.trim()) throw new CmsError('Image URL is required.', 400);
    await requireDatabase();
    const created = await (GalleryImage as any).create(stripPersistenceFields(body));
    const verified = await (GalleryImage as any).findById(created._id).lean();
    if (!verified) throw new CmsError('Gallery write verification failed.');
    triggerRevalidation();
    return NextResponse.json(serialize(verified), { status: 201, headers });
  } catch (error) { console.error('Gallery POST error:', error); return fail(error); }
}

export async function PUT(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const body = await request.json();
    const id = requireObjectId(body.id || body._id || new URL(request.url).searchParams.get('id'), 'Gallery image ID');
    await requireDatabase();
    const updated = await (GalleryImage as any).findByIdAndUpdate(id, { $set: stripPersistenceFields(body) }, { new: true, runValidators: true }).lean();
    if (!updated) throw new CmsError('Gallery image not found.', 404);
    const verified = await (GalleryImage as any).findById(id).lean();
    if (!verified) throw new CmsError('Gallery write verification failed.');
    triggerRevalidation();
    return NextResponse.json(serialize(verified), { headers });
  } catch (error) { console.error('Gallery PUT error:', error); return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const id = requireObjectId(new URL(request.url).searchParams.get('id'), 'Gallery image ID');
    await requireDatabase();
    const deleted = await (GalleryImage as any).findByIdAndDelete(id);
    if (!deleted) throw new CmsError('Gallery image not found.', 404);
    if (await (GalleryImage as any).exists({ _id: id })) throw new CmsError('Gallery delete verification failed.');
    triggerRevalidation();
    return NextResponse.json({ success: true }, { headers });
  } catch (error) { console.error('Gallery DELETE error:', error); return fail(error); }
}
