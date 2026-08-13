import { NextResponse } from 'next/server';
import FAQ from '@/models/FAQ';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase, requireObjectId, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
const errorResponse = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected CMS error';
  return NextResponse.json({ error: message }, { status: error instanceof CmsError ? error.status : 500, headers });
};

export async function GET() {
  try {
    await requireDatabase();
    const items = await FAQ.find({}).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(items.map(serialize), { headers });
  } catch (error) { console.error('FAQ GET error:', error); return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    await requireDatabase();
    const body = await request.json();
    if (typeof body.question !== 'string' || !body.question.trim() || typeof body.answer !== 'string' || !body.answer.trim()) {
      throw new CmsError('Question and answer are required.', 400);
    }
    const created = await FAQ.create({ question: body.question.trim(), answer: body.answer.trim(), category: body.category || 'General', order: Number.isFinite(body.order) ? body.order : Date.now() });
    const verified = await FAQ.findById(created._id).lean();
    if (!verified) throw new CmsError('FAQ write verification failed. No changes were saved.');
    triggerRevalidation();
    return NextResponse.json(serialize(verified), { status: 201, headers });
  } catch (error) { console.error('FAQ POST error:', error); return errorResponse(error); }
}

export async function PUT(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    await requireDatabase();
    const body = await request.json();
    const id = requireObjectId(body.id || body._id || new URL(request.url).searchParams.get('id'), 'FAQ ID');
    const update = stripPersistenceFields(body);
    if (update.question !== undefined && (typeof update.question !== 'string' || !update.question.trim())) throw new CmsError('Question cannot be empty.', 400);
    if (update.answer !== undefined && (typeof update.answer !== 'string' || !update.answer.trim())) throw new CmsError('Answer cannot be empty.', 400);
    const updated = await FAQ.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!updated) throw new CmsError('FAQ not found.', 404);
    const verified = await FAQ.findById(id).lean();
    if (!verified) throw new CmsError('FAQ write verification failed.');
    triggerRevalidation();
    return NextResponse.json(serialize(verified), { headers });
  } catch (error) { console.error('FAQ PUT error:', error); return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    await requireDatabase();
    const id = requireObjectId(new URL(request.url).searchParams.get('id'), 'FAQ ID');
    const deleted = await FAQ.findByIdAndDelete(id).lean();
    if (!deleted) throw new CmsError('FAQ not found.', 404);
    if (await FAQ.exists({ _id: id })) throw new CmsError('FAQ delete verification failed.');
    triggerRevalidation();
    return NextResponse.json({ success: true }, { headers });
  } catch (error) { console.error('FAQ DELETE error:', error); return errorResponse(error); }
}
