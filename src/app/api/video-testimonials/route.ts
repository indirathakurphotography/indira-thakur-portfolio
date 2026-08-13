import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VideoTestimonial from '@/models/VideoTestimonial';
import { requireAdmin, parseObjectId } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

const VideoTestimonialModel = VideoTestimonial as any;

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
}

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return jsonError('Database connection unavailable', 503);
    }
    const items = await VideoTestimonialModel.find({}).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(items, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('GET /api/video-testimonials error:', error);
    return jsonError('Failed to fetch video testimonials', 503);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await connectToDatabase();
    if (!db) {
      return jsonError('Database connection unavailable', 503);
    }

    const body = await request.json();
    const {
      clientName,
      title,
      role,
      quote,
      videoUrl,
      thumbnailUrl,
      publicId,
      duration,
      fileSize,
      uploadSource,
      rating,
      featured,
      order,
    } = body;
    if (!clientName || !videoUrl) {
      return jsonError('Client Name and Video URL are required', 400);
    }

    const created: any = await VideoTestimonial.create({
      clientName,
      title: title || '',
      role: role || '',
      quote: quote || '',
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      publicId: publicId || '',
      duration: duration || '',
      fileSize: fileSize || 0,
      uploadSource: uploadSource || 'device',
      rating: rating || 5,
      featured: Boolean(featured),
      order: Number(order) || 0,
    });

    // Read-after-write verification
    const fresh = await VideoTestimonialModel.findById(created._id).lean();
    if (!fresh) {
      return jsonError('Read-after-write verification failed: created video testimonial was not found in MongoDB.', 500);
    }

    triggerRevalidation();
    return NextResponse.json(fresh, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('POST /api/video-testimonials error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to create video testimonial', status);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await connectToDatabase();
    if (!db) {
      return jsonError('Database connection unavailable', 503);
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const body = await request.json();
    const targetId = id || body._id || body.id;
    if (!targetId) return jsonError('Video testimonial ID is required', 400);

    const objectId = parseObjectId(targetId);
    const { _id, id: _unusedId, ...updateData } = body;

    const updated: any = await VideoTestimonialModel.findByIdAndUpdate(
      objectId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return jsonError('Video testimonial not found', 404);

    // Read-after-write verification
    const fresh = await VideoTestimonialModel.findById(objectId).lean();
    if (!fresh) {
      return jsonError('Read-after-write verification failed: updated video testimonial was not found in MongoDB.', 500);
    }

    triggerRevalidation();
    return NextResponse.json(fresh, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('PUT /api/video-testimonials error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to update video testimonial', status);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await connectToDatabase();
    if (!db) {
      return jsonError('Database connection unavailable', 503);
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    if (!id) return jsonError('Video testimonial ID is required', 400);

    const objectId = parseObjectId(id);
    const deleted = await VideoTestimonial.deleteOne({ _id: objectId });
    if (deleted.deletedCount !== 1) return jsonError('Video testimonial not found', 404);

    // Delete verification
    const check = await VideoTestimonialModel.findById(objectId).lean();
    if (check) {
      return jsonError('Delete verification failed: video testimonial still exists in MongoDB.', 500);
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Video testimonial deleted' }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('DELETE /api/video-testimonials error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to delete video testimonial', status);
  }
}
