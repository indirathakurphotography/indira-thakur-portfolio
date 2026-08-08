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
  {
    _id: 't-6',
    name: 'Heta Ganatra',
    role: 'Newborn & Family Photography',
    content:
      'We worked with Indira for a shoot to capture our newborn and a few family portraits with our older child. Despite a treacherous journey to Lonavla, Indira was calm and creative through the process. She had a soothing effect on a newborn and handled our baby so gently while ticking off most of our reference images. An absolute pleasure to work with. ♥️',
    rating: 5,
    featured: true,
    order: 6,
  },
  {
    _id: 't-7',
    name: 'Shalaka Amrute',
    role: 'Event Photography',
    content:
      'Indira is such a pleasure to work with. Not only is she talented and delivers great results; with her, you know the photography is well taken care of and there is one less thing to worry about in a busy event. She is very patient and professional, detail oriented, and really puts you at ease throughout the photoshoot. Highly recommended for any type of event!',
    rating: 5,
    featured: true,
    order: 7,
  },
  {
    _id: 't-8',
    name: 'Parag Shah',
    role: 'Photography',
    content:
      'We had an amazing experience working with Indira (Isha)! Her professionalism, creativity, and attention to detail truly set her apart. She made us feel comfortable throughout the session and captured stunning shots that exceeded our expectations. The lighting, composition, and emotions in every photo were just perfect. The final edits were delivered on time, and the quality was outstanding. Highly recommended!',
    rating: 5,
    featured: true,
    order: 8,
  },
  {
    _id: 't-9',
    name: 'Antara Acharya',
    role: 'Event Photography',
    content:
      "Indira's approach to photography is very creative. I saw some of her work at a recent event and would recommend her services as a photographer. ❤️",
    rating: 5,
    featured: true,
    order: 9,
  },
  {
    _id: 't-10',
    name: 'Kiran Kumar Shetty',
    role: 'Portraits, Events & Commercial Photography',
    content:
      "I had the pleasure of working with Indira, and I can confidently say she is an incredibly talented and professional photographer. Her ability to capture moments with creativity, precision, and attention to detail is truly outstanding. Whether it's portraits, events, or commercial shoots, Indira has a unique eye for composition that makes every shot stand out.",
    rating: 5,
    featured: true,
    order: 10,
  },
  {
    _id: 't-11',
    name: 'Vishal Gupta',
    role: 'Birth & Newborn Photography',
    content:
      "I recently had the pleasure of working with Indira Thakur for a birth/delivery photoshoot and newborn photoshoot of my baby girl, and I couldn't be more thrilled with the results. Indira's talent and passion for photography truly shine through in every shot. She captured beautiful and tender moments that we will cherish forever. Her professionalism, attention to detail, genuine care, and kindness made the entire experience smooth and enjoyable. She was exceptionally caring towards my baby girl and my wife throughout the entire process. Highly recommended!",
    rating: 5,
    featured: true,
    order: 11,
  },
  {
    _id: 't-12',
    name: 'Martina Pandia',
    role: 'Family Photography',
    content:
      'Indira was an excellent photographer. She was on time and had all the props and accessories ready for the shoot. My kids were unsettled due to the humid day, but Indira patiently waited with a smile while I settled them. It was fun to shoot with her. I strongly recommend her photography. Thank you for capturing our family’s beautiful memories to cherish! ❤️',
    rating: 5,
    featured: true,
    order: 12,
  },
  {
    _id: 't-13',
    name: 'Poonam Tiwari',
    role: 'Wedding & Event Photography',
    content:
      'I highly recommend Indira as a photographer for any event. Whether it’s a wedding or any other special occasion, she consistently delivers outstanding results. She has a great team who know how to capture the essence of any event. Working with Indira is a pleasure; she makes you feel so comfortable. We trust her and always choose her for our family’s photography needs. ❤️❤️',
    rating: 5,
    featured: true,
    order: 13,
  },
  {
    _id: 't-14',
    name: 'Nileja Thorat',
    role: 'Photography',
    content:
      'I couldn’t stop looking at the images you sent us – they’re so good. I appreciate your efforts in capturing such powerful emotions. You bring your positive energy to every picture you take. Your photos tell the story in a way that words can’t. You’re a talented photographer, and we’re thrilled with the results. We appreciate your patience and professionalism during the photography session. You also offered excellent services, and we’ll recommend you to others. A big thank you! ❤️❤️🙌🏻',
    rating: 5,
    featured: true,
    order: 14,
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
