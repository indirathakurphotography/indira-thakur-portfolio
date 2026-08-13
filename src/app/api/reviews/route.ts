import { NextResponse } from 'next/server';
import {
  fetchAllTestimonials,
  createNewTestimonial,
  updateExistingTestimonial,
  deleteExistingTestimonial,
} from '@/lib/testimonialsStorage';

import { requireAuth } from '@/lib/auth';
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
    console.error('Review GET error:', error);
    const fallback = await fetchAllTestimonials();
    return NextResponse.json(fallback, { headers: NO_CACHE_HEADERS });

  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const body = await request.json();

    if (!body.name || !body.content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const review = await createNewTestimonial({
      name: body.name,
      rating: body.rating || 5,
      content: body.content,
      role: body.source || body.role || 'website',
      featured: body.featured || false,
    });

    triggerRevalidation();
    return NextResponse.json(review, { status: 201, headers: NO_CACHE_HEADERS });

  } catch (error) {
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const review = await updateExistingTestimonial(targetId, updateData);

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json(review, { headers: NO_CACHE_HEADERS });

  } catch (error) {
    console.error('Review PUT error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    await deleteExistingTestimonial(id);

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Review deleted successfully' }, { headers: NO_CACHE_HEADERS });

  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
