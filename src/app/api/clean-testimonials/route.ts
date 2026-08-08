import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APPROVED_TESTIMONIALS_CLEANUP = [
  {
    name: 'Heta Ganatra',
    role: 'Newborn & Family Photography',
    content:
      'We worked with Indira for a shoot to capture our newborn and a few family portraits with our older child. Despite a treacherous journey to Lonavla, Indira was calm and creative through the process. She had a soothing effect on a newborn and handled our baby so gently while ticking off most of our reference images. An absolute pleasure to work with. ♥️',
    rating: 5,
    featured: true,
    order: 1,
  },
  {
    name: 'Shalaka Amrute',
    role: 'Event Photography',
    content:
      'Indira is such a pleasure to work with. Not only is she talented and delivers great results; with her, you know the photography is well taken care of and there is one less thing to worry about in a busy event. She is very patient and professional, detail oriented, and really puts you at ease throughout the photoshoot. Highly recommended for any type of event!',
    rating: 5,
    featured: true,
    order: 2,
  },
  {
    name: 'Parag Shah',
    role: 'Photography',
    content:
      'We had an amazing experience working with Indira (Isha)! Her professionalism, creativity, and attention to detail truly set her apart. She made us feel comfortable throughout the session and captured stunning shots that exceeded our expectations. The lighting, composition, and emotions in every photo were just perfect. The final edits were delivered on time, and the quality was outstanding. Highly recommended!',
    rating: 5,
    featured: true,
    order: 3,
  },
  {
    name: 'Antara Acharya',
    role: 'Event Photography',
    content:
      "Indira's approach to photography is very creative. I saw some of her work at a recent event and would recommend her services as a photographer. ❤️",
    rating: 5,
    featured: true,
    order: 4,
  },
  {
    name: 'Kiran Kumar Shetty',
    role: 'Portraits, Events & Commercial Photography',
    content:
      "I had the pleasure of working with Indira, and I can confidently say she is an incredibly talented and professional photographer. Her ability to capture moments with creativity, precision, and attention to detail is truly outstanding. Whether it's portraits, events, or commercial shoots, Indira has a unique eye for composition that makes every shot stand out.",
    rating: 5,
    featured: true,
    order: 5,
  },
  {
    name: 'Vishal Gupta',
    role: 'Birth & Newborn Photography',
    content:
      "I recently had the pleasure of working with Indira Thakur for a birth/delivery photoshoot and newborn photoshoot of my baby girl, and I couldn't be more thrilled with the results. Indira's talent and passion for photography truly shine through in every shot. She captured beautiful and tender moments that we will cherish forever. Her professionalism, attention to detail, genuine care, and kindness made the entire experience smooth and enjoyable. She was exceptionally caring towards my baby girl and my wife throughout the entire process. Highly recommended!",
    rating: 5,
    featured: true,
    order: 6,
  },
  {
    name: 'Martina Pandia',
    role: 'Family Photography',
    content:
      'Indira was an excellent photographer. She was on time and had all the props and accessories ready for the shoot. My kids were unsettled due to the humid day, but Indira patiently waited with a smile while I settled them. It was fun to shoot with her. I strongly recommend her photography. Thank you for capturing our family’s beautiful memories to cherish! ❤️',
    rating: 5,
    featured: true,
    order: 7,
  },
  {
    name: 'Poonam Tiwari',
    role: 'Wedding & Event Photography',
    content:
      'I highly recommend Indira as a photographer for any event. Whether it’s a wedding or any other special occasion, she consistently delivers outstanding results. She has a great team who know how to capture the essence of any event. Working with Indira is a pleasure; she makes you feel so comfortable. We trust her and always choose her for our family’s photography needs. ❤️❤️',
    rating: 5,
    featured: true,
    order: 8,
  },
  {
    name: 'Nileja Thorat',
    role: 'Photography',
    content:
      'I couldn’t stop looking at the images you sent us – they’re so good. I appreciate your efforts in capturing such powerful emotions. You bring your positive energy to every picture you take. Your photos tell the story in a way that words can’t. You’re a talented photographer, and we’re thrilled with the results. We appreciate your patience and professionalism during the photography session. You also offered excellent services, and we’ll recommend you to others. A big thank you! ❤️❤️🙌🏻',
    rating: 5,
    featured: true,
    order: 9,
  },
];

async function handleCleanup(request: NextRequest) {
  const user = getAuthUser(request);
  const secretKey = request.headers.get('x-migration-key') || request.nextUrl.searchParams.get('key');
  const validSecret = process.env.MIGRATION_KEY || 'indira-clean-2026';

  if (!user && secretKey !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const Testimonial = (await import('@/models/Testimonial')).default;
  const SiteConfig = (await import('@/models/SiteConfig')).default;

  // 1. Purge and re-seed standalone Testimonial collection with exactly 9 approved reviews
  await Testimonial.deleteMany({});
  const insertedTestimonials = await Testimonial.insertMany(APPROVED_TESTIMONIALS_CLEANUP);

  // 2. Purge and re-seed embedded SiteConfig testimonials across all SiteConfig documents with exactly 9 approved reviews
  const formattedSiteConfigTestimonials = APPROVED_TESTIMONIALS_CLEANUP.map((t) => ({
    quote: t.content,
    author: t.name,
    role: t.role,
    rating: t.rating,
    avatar: { url: '', alt: t.name, caption: '' },
  }));

  await SiteConfig.updateMany(
    {},
    {
      $set: {
        'testimonials.testimonials': formattedSiteConfigTestimonials,
      },
    }
  );

  triggerRevalidation();

  const countTestimonials = await Testimonial.countDocuments();
  const siteConfigRefreshed = await SiteConfig.findOne().lean();
  const countSiteConfigTestimonials = siteConfigRefreshed?.testimonials?.testimonials?.length || 0;

  return NextResponse.json({
    success: true,
    message: 'Testimonials cleaned up successfully in MongoDB',
    countTestimonialsCollection: countTestimonials,
    countSiteConfigTestimonials,
    insertedCount: insertedTestimonials.length,
  });
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}
