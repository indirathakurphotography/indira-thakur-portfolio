import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import VideoTestimonial from '@/models/VideoTestimonial';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const featured = searchParams.get('featured');

    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      const filter: Record<string, unknown> = {};
      if (featured === 'true') filter.featured = true;

      const items = await VideoTestimonial.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .lean();
      return NextResponse.json(items);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('GET /api/video-testimonials error:', error);
    return jsonError('Failed to fetch video testimonials', 500);
  }
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length') || 'unknown';
  const contentType = request.headers.get('content-type') || '';
  console.log(`[API /api/video-testimonials] POST Request Received. Content-Length: ${contentLength} bytes, Content-Type: ${contentType}`);

  try {
    const user = requireAuth(request);
    if (!user) return jsonError('Unauthorized access', 401);

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

    console.log(`[API /api/video-testimonials] Creating Testimonial for "${clientName}". videoUrl Length: ${videoUrl?.length || 0} chars, Prefix: "${videoUrl?.substring(0, 40)}..."`);

    if (!clientName || !videoUrl) {
      return jsonError('Client Name and Video URL are required', 400);
    }

    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      const created = await VideoTestimonial.create({
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
      return NextResponse.json(created, { status: 201 });
    }

    return NextResponse.json(
      {
        _id: `vtest-${Date.now()}`,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/video-testimonials error:', error);
    return jsonError(`Failed to create video testimonial: ${error.message || 'Error'}`, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (!user) return jsonError('Unauthorized access', 401);

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const body = await request.json();

    const targetId = id || body._id || body.id;
    if (!targetId) return jsonError('Video testimonial ID is required', 400);

    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      const updated = await VideoTestimonial.findByIdAndUpdate(
        targetId,
        { $set: body },
        { new: true, runValidators: true }
      );
      if (!updated) return jsonError('Video testimonial not found', 404);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ _id: targetId, ...body });
  } catch (error: any) {
    console.error('PUT /api/video-testimonials error:', error);
    return jsonError('Failed to update video testimonial', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (!user) return jsonError('Unauthorized access', 401);

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    if (!id) return jsonError('Video testimonial ID is required', 400);

    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      const deleted = await VideoTestimonial.findByIdAndDelete(id);
      if (!deleted) return jsonError('Video testimonial not found', 404);
    }

    return NextResponse.json({ success: true, message: 'Video testimonial deleted' });
  } catch (error: any) {
    console.error('DELETE /api/video-testimonials error:', error);
    return jsonError('Failed to delete video testimonial', 500);
  }
}
