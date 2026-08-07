import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export const DEFAULT_FAQS = [
  {
    question: 'When should we book you for birth photography?',
    answer: 'Please book us in your second trimester as it helps us to plan things ahead of time.',
    category: 'Booking',
    order: 1,
  },
  {
    question: 'When is the best time for newborn shoot?',
    answer: "The best time to do a newborn shoot is within the first 15 days of the baby's birth.",
    category: 'Newborn',
    order: 2,
  },
  {
    question: 'What is the best time for maternity shoot?',
    answer: 'The best time for maternity shoot is between 24 and 28 weeks.',
    category: 'Maternity',
    order: 3,
  },
  {
    question: "Do you provide outfits for maternity shoot?",
    answer: "No, we don't provide outfits for maternity shoot. However, we can connect you to a reliable vendor.",
    category: 'Maternity',
    order: 4,
  },
  {
    question: 'Can you arrange for a MUA and hair stylist for the shoot?',
    answer: 'Yes, we can provide a MUA and a hair stylist.',
    category: 'Services',
    order: 5,
  },
  {
    question: 'When can we expect the photos to be delivered?',
    answer: 'The final photos are shared within 2 weeks after the shoot.',
    category: 'Delivery',
    order: 6,
  },
  {
    question: 'Do you have the option of photo prints or albums?',
    answer: 'Yes.',
    category: 'Products',
    order: 7,
  },
  {
    question: 'What are your charges?',
    answer: "As we provide a range of photography and videography services, the charges vary. Please fill up the contact form so we can provide you a quote that's tailored to your needs.",
    category: 'Pricing',
    order: 8,
  },
  {
    question: 'Do you provide raw pictures?',
    answer: "We don't provide raw pictures.",
    category: 'Policies',
    order: 9,
  },
  {
    question: 'Do you travel for shoots?',
    answer: 'Yes, we do travel for shoots.',
    category: 'Travel',
    order: 10,
  },
];

export async function GET() {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const faqs = await FAQ.find({}).sort({ order: 1, createdAt: -1 }).lean();
        if (faqs && faqs.length > 0) {
          return NextResponse.json(faqs);
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed for FAQs, using default list:', dbErr);
      }
    }
    return NextResponse.json(DEFAULT_FAQS);
  } catch (error) {
    console.error('FAQ GET error:', error);
    return NextResponse.json(DEFAULT_FAQS);
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
