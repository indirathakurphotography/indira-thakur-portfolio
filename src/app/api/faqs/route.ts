import { NextResponse } from 'next/server';
import {
  fetchAllFAQs,
  createNewFAQ,
  updateExistingFAQ,
  deleteExistingFAQ,
} from '@/lib/faqsStorage';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const items = await fetchAllFAQs();
    return NextResponse.json(items, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('FAQ GET error:', error);
    const fallback = await fetchAllFAQs();
    return NextResponse.json(fallback, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.question || !body.answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }
    const created = await createNewFAQ(body);
    triggerRevalidation();
    return NextResponse.json(created, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('FAQ POST error:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    const body = await request.json();
    const targetId = body.id || body._id || queryId;

    if (!targetId) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const updated = await updateExistingFAQ(targetId, body);
    if (!updated) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('FAQ PUT error:', error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    await deleteExistingFAQ(id);
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'FAQ deleted successfully' }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('FAQ DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
