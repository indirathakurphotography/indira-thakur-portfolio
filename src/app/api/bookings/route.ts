import { NextResponse } from 'next/server';
import Booking from '@/models/Booking';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase, requireObjectId, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const error = (value: unknown) => NextResponse.json({ error: value instanceof Error ? value.message : 'Booking request failed' }, { status: value instanceof CmsError ? value.status : 500, headers });

export async function GET(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    await requireDatabase();
    return NextResponse.json((await (Booking as any).find({}).sort({ createdAt: -1 }).lean()).map(serialize), { headers });
  } catch (value) { console.error('Booking GET error:', value); return error(value); }
}

export async function PUT(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const body = await request.json();
    const id = requireObjectId(body.id || body._id, 'Booking ID');
    await requireDatabase();
    const updated = await (Booking as any).findByIdAndUpdate(id, { $set: stripPersistenceFields(body) }, { new: true, runValidators: true }).lean();
    if (!updated) throw new CmsError('Booking not found.', 404);
    const verified = await (Booking as any).findById(id).lean();
    if (!verified) throw new CmsError('Booking write verification failed.');
    return NextResponse.json(serialize(verified), { headers });
  } catch (value) { console.error('Booking PUT error:', value); return error(value); }
}

export async function DELETE(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const id = requireObjectId(new URL(request.url).searchParams.get('id'), 'Booking ID');
    await requireDatabase();
    const deleted = await (Booking as any).findByIdAndDelete(id);
    if (!deleted) throw new CmsError('Booking not found.', 404);
    if (await (Booking as any).exists({ _id: id })) throw new CmsError('Booking delete verification failed.');
    return NextResponse.json({ success: true }, { headers });
  } catch (value) { console.error('Booking DELETE error:', value); return error(value); }
}
