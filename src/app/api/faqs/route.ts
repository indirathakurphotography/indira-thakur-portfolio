import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let faqs: any[] = [];
    try {
      await connectToDatabase();
      faqs = await FAQ.find({}).sort({ order: 1, createdAt: -1 });
    } catch (dbErr) {
      console.warn('MongoDB connection error in FAQs route:', dbErr);
      return NextResponse.json([]);
    }

    // Deduplicate by question
    const uniqueFaqs: any[] = [];
    const seen = new Set<string>();
    for (const f of faqs) {
      const q = (f.question || '').trim().toLowerCase();
      if (q && !seen.has(q)) {
        seen.add(q);
        uniqueFaqs.push(f);
      }
    }

    return NextResponse.json(uniqueFaqs);
  } catch (error) {
    console.error('FAQ GET error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    if (!body.question || !body.answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const faq = await FAQ.create({
      question: body.question,
      answer: body.answer,
      category: body.category || 'General',
      order: body.order || 0,
    });

    triggerRevalidation();
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error('FAQ POST error:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    const body = await request.json();
    const targetId = body.id || body._id || queryId;

    if (!targetId) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const faq = await FAQ.findByIdAndUpdate(targetId, updateData, { new: true, runValidators: true });
    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json(faq);
  } catch (error) {
    console.error('FAQ PUT error:', error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('FAQ DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
