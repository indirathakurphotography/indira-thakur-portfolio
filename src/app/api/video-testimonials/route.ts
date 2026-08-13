import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import VideoTestimonial from '@/models/VideoTestimonial';
import { triggerRevalidation } from '@/lib/revalidate';
import { CmsError, requireDatabase, requireObjectId, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

function jsonError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = error instanceof CmsError ? error.status : 500;
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  try {
    await requireDatabase();
    const items = await (VideoTestimonial as any).find({}).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(items.map(serialize), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/video-testimonials error:', error);
    return jsonError(error, 'Failed to load video testimonials');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    const body = await request.json();
    if (typeof body.clientName !== 'string' || !body.clientName.trim() || typeof body.videoUrl !== 'string' || !body.videoUrl.trim()) {
      throw new CmsError('Client name and video URL are required.', 400);
    }
    await requireDatabase();
    const created = await (VideoTestimonial as any).create({
      clientName: body.clientName.trim(), title: body.title || '', role: body.role || '', quote: body.quote || '',
      videoUrl: body.videoUrl.trim(), thumbnailUrl: body.thumbnailUrl || '', publicId: body.publicId || '',
      duration: body.duration || '', fileSize: Number(body.fileSize) || 0, uploadSource: body.uploadSource || 'device',
      rating: Number(body.rating) || 5, featured: Boolean(body.featured), order: Number(body.order) || 0,
    });
    const verified = await (VideoTestimonial as any).findById(created._id).lean();
    if (!verified) throw new CmsError('Video testimonial write verification failed.');
    triggerRevalidation();
    return NextResponse.json(serialize(verified), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('POST /api/video-testimonials error:', error);
    return jsonError(error, 'Failed to create video testimonial');
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    const body = await request.json();
    const recordId = requireObjectId(request.nextUrl.searchParams.get('id') || body._id || body.id, 'Video testimonial ID');
    await requireDatabase();
    const updated = await (VideoTestimonial as any).findByIdAndUpdate(recordId, { $set: stripPersistenceFields(body) }, { new: true, runValidators: true }).lean();
    if (!updated) throw new CmsError('Video testimonial not found.', 404);
    const verified = await (VideoTestimonial as any).findById(recordId).lean();
    if (!verified) throw new CmsError('Video testimonial write verification failed.');
    triggerRevalidation();
    return NextResponse.json(serialize(verified), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('PUT /api/video-testimonials error:', error);
    return jsonError(error, 'Failed to update video testimonial');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    const recordId = requireObjectId(request.nextUrl.searchParams.get('id'), 'Video testimonial ID');
    await requireDatabase();
    const deleted = await (VideoTestimonial as any).findByIdAndDelete(recordId);
    if (!deleted) throw new CmsError('Video testimonial not found.', 404);
    if (await (VideoTestimonial as any).exists({ _id: recordId })) throw new CmsError('Video testimonial delete verification failed.');
    triggerRevalidation();
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('DELETE /api/video-testimonials error:', error);
    return jsonError(error, 'Failed to delete video testimonial');
  }
}
