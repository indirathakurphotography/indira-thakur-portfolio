import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import VideoTestimonial from '@/models/VideoTestimonial';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const REAL_CLIENT_VIDEO_URL =
  'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/testimonials/1785434838420-aqp8kjipspxweauimz8l2-tjzkwyupz0y5i01hrqafypnmmua11dn-9x8xsjcebrymcsvle8wzptswuaymtxmnzocqxa9ofp.mp4';

const APPROVED_VIDEO_TESTIMONIAL = {
  _id: 'vtest-neha-kanabar',
  clientName: 'Neha Kanabar',
  title: 'Newborn & Family Experience',
  role: 'Newborn Session',
  quote:
    'Indira captured the purest moments of our baby’s first week. The session felt like home.',
  videoUrl: REAL_CLIENT_VIDEO_URL,
  thumbnailUrl:
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
  duration: '2:30',
  rating: 5,
  featured: true,
  order: 1,
};

export const DEFAULT_VIDEO_TESTIMONIALS = [APPROVED_VIDEO_TESTIMONIAL];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const items = await VideoTestimonial.find({})
          .sort({ order: 1, createdAt: -1 })
          .lean();

        if (items && items.length > 0) {
          return NextResponse.json(items);
        }
      } catch (dbErr) {
        console.warn('MongoDB error in video testimonials:', dbErr);
      }
    }
    return NextResponse.json(DEFAULT_VIDEO_TESTIMONIALS);
  } catch (error: any) {
    console.error('GET /api/video-testimonials error:', error);
    return NextResponse.json(DEFAULT_VIDEO_TESTIMONIALS);
  }
}

export async function POST(request: NextRequest) {
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
      triggerRevalidation();
      return NextResponse.json(created, { status: 201 });
    }
    triggerRevalidation();
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
      triggerRevalidation();
      return NextResponse.json(updated);
    }
    triggerRevalidation();
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
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Video testimonial deleted' });
  } catch (error: any) {
    console.error('DELETE /api/video-testimonials error:', error);
    return jsonError('Failed to delete video testimonial', 500);
  }
}
