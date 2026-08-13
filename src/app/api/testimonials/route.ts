import { NextResponse } from 'next/server';
import {
  fetchAllTestimonials,
  createNewTestimonial,
  updateExistingTestimonial,
  deleteExistingTestimonial,
} from '@/lib/testimonialsStorage';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const items = await fetchAllTestimonials();
    return NextResponse.json(items, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Testimonial GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    if (!body.name || !body.content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }
    const created = await createNewTestimonial(body);
    triggerRevalidation();
    return NextResponse.json(created, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Testimonial POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create testimonial' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }

    const updated = await updateExistingTestimonial(targetId, updateData);
    triggerRevalidation();
    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Testimonial PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update testimonial' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }

    await deleteExistingTestimonial(id);
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Testimonial DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete testimonial' }, { status, headers: NO_CACHE_HEADERS });
  }
}
