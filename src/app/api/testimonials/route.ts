import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Testimonial from '@/models/Testimonial';
import SiteConfig from '@/models/SiteConfig';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export const DEFAULT_TESTIMONIALS = [
  {
    _id: 't-1',
    name: 'Aanya & Vikram Mehta',
    role: 'Maternity & Newborn Session',
    content:
      'Indira has an extraordinary gift. She made us feel so comfortable during our maternity shoot and handled our 8-day-old baby with such gentle warmth. The photographs belong in an art museum!',
    rating: 5,
    featured: true,
    order: 1,
    image:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
  },
  {
    _id: 't-2',
    name: 'Priya & Rohan Sharma',
    role: 'Newborn Storytelling',
    content:
      'The patience and care Indira showed during our newborn session was remarkable. The heirloom album we received is our family’s most cherished treasure.',
    rating: 5,
    featured: true,
    order: 2,
    image:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
  },
  {
    _id: 't-3',
    name: 'Kavita Iyer',
    role: 'Fine Art Portraiture',
    content:
      'Working with Indira was an empowering experience. Her use of lighting and artistic composition created portraits that feel deeply personal yet timeless.',
    rating: 5,
    featured: true,
    order: 3,
    image:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg',
  },
  {
    _id: 't-4',
    name: 'Ananya & Devraj Kapoor',
    role: 'Maternity Session',
    content:
      'Our maternity portraits are breathtaking. Indira guided us with patience and warmth, making us feel completely comfortable in front of the lens.',
    rating: 5,
    featured: true,
    order: 4,
    image:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
  },
  {
    _id: 't-5',
    name: 'Nikhil & Sunita Deshmukh',
    role: 'Heritage Family Storytelling',
    content:
      'The fine-art quality of the prints and album exceeded all expectations. She captured our family bond in the most graceful way possible.',
    rating: 5,
    featured: true,
    order: 5,
    image:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
  },
];

const APPROVED_NAMES = DEFAULT_TESTIMONIALS.map((t) => t.name);

export async function GET() {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const [siteConfigDoc, testimonialsDocs] = await Promise.all([
          SiteConfig.findOne().lean(),
          Testimonial.find({}).sort({ order: 1, createdAt: -1 }).lean().catch(() => []),
        ]);

        const merged: any[] = [];
        const seenKeys = new Set<string>();

        // 1. Add testimonials from SiteConfig (edited via /admin/testimonials-cms)
        const cmsItems = siteConfigDoc?.testimonials?.testimonials;
        if (Array.isArray(cmsItems) && cmsItems.length > 0) {
          cmsItems.forEach((item: any, idx: number) => {
            const quote = item.quote?.trim() || '';
            const author = item.author?.trim() || 'Valued Client';
            if (quote) {
              const key = `${author.toLowerCase()}::${quote.slice(0, 30).toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                merged.push({
                  _id: item._id ? String(item._id) : `cms-t-${idx}`,
                  name: author,
                  content: quote,
                  role: item.role || '',
                  rating: item.rating || 5,
                  image: item.avatar?.url || '',
                  featured: true,
                  order: idx + 1,
                });
              }
            }
          });
        }

        // 2. Add testimonials from standalone Testimonial collection
        if (Array.isArray(testimonialsDocs) && testimonialsDocs.length > 0) {
          testimonialsDocs.forEach((doc: any) => {
            const content = doc.content?.trim() || '';
            const name = doc.name?.trim() || 'Valued Client';
            if (content) {
              const key = `${name.toLowerCase()}::${content.slice(0, 30).toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                merged.push(doc);
              }
            }
          });
        }

        if (merged.length > 0) {
          return NextResponse.json(merged);
        }
      } catch (dbErr) {
        console.warn('MongoDB connection error in Testimonials route, returning defaults:', dbErr);
      }
    }
    return NextResponse.json(DEFAULT_TESTIMONIALS);
  } catch (error) {
    console.error('Testimonial GET error:', error);
    return NextResponse.json(DEFAULT_TESTIMONIALS);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    if (!body.name || !body.content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }
    const testimonial = await Testimonial.create({
      name: body.name,
      role: body.role || '',
      content: body.content,
      rating: body.rating || 5,
      featured: body.featured || false,
      order: body.order || 0,
      image: body.image || '',
      publicId: body.publicId || '',
    });
    triggerRevalidation();
    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error('Testimonial POST error:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }
    const testimonial = await Testimonial.findByIdAndUpdate(id, updateData, { new: true });
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    triggerRevalidation();
    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Testimonial PUT error:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
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
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }
    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Testimonial DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
