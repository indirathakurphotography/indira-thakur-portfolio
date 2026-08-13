import { NextResponse } from 'next/server';
import Service from '@/models/Service';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase, requireObjectId, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : 'Service request failed' }, { status: error instanceof CmsError ? error.status : 500, headers });

export async function GET() {
  try { await requireDatabase(); return NextResponse.json((await (Service as any).find({}).sort({ order: 1, createdAt: -1 }).lean()).map(serialize), { headers }); }
  catch (error) { console.error('Service GET error:', error); return fail(error); }
}

export async function POST(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const body = await request.json();
    if (typeof body.title !== 'string' || !body.title.trim() || typeof body.slug !== 'string' || !body.slug.trim()) throw new CmsError('Title and slug are required.', 400);
    await requireDatabase();
    const created = await (Service as any).create(stripPersistenceFields(body));
    const verified = await (Service as any).findById(created._id).lean();
    if (!verified) throw new CmsError('Service write verification failed.');
    triggerRevalidation(); return NextResponse.json(serialize(verified), { status: 201, headers });
  } catch (error) { console.error('Service POST error:', error); return fail(error); }
}

export async function PUT(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const body = await request.json(); const id = requireObjectId(body.id || body._id || new URL(request.url).searchParams.get('id'), 'Service ID');
    await requireDatabase();
    const updated = await (Service as any).findByIdAndUpdate(id, { $set: stripPersistenceFields(body) }, { new: true, runValidators: true }).lean();
    if (!updated) throw new CmsError('Service not found.', 404);
    const verified = await (Service as any).findById(id).lean(); if (!verified) throw new CmsError('Service write verification failed.');
    triggerRevalidation(); return NextResponse.json(serialize(verified), { headers });
  } catch (error) { console.error('Service PUT error:', error); return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const id = requireObjectId(new URL(request.url).searchParams.get('id'), 'Service ID'); await requireDatabase();
    const deleted = await (Service as any).findByIdAndDelete(id); if (!deleted) throw new CmsError('Service not found.', 404);
    if (await (Service as any).exists({ _id: id })) throw new CmsError('Service delete verification failed.');
    triggerRevalidation(); return NextResponse.json({ success: true }, { headers });
  } catch (error) { console.error('Service DELETE error:', error); return fail(error); }
}
