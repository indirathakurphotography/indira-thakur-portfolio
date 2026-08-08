import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { uploadFile } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const BATCH_SIZE = 3;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAuthorized(request: NextRequest): boolean {
  // Regular auth via cookie
  const user = getAuthUser(request);
  if (user) return true;
  // Fallback: migration key or Vercel OIDC token passed as header or query param
  const migrationKey = process.env.MIGRATION_KEY || '';
  const oidcToken = process.env.VERCEL_OIDC_TOKEN || '';
  const headerKey = request.headers.get('x-migration-key') || request.headers.get('authorization')?.replace('Bearer ', '') || '';
  const queryKey = request.nextUrl.searchParams.get('key') || '';
  const validKeys = [migrationKey, oidcToken].filter(Boolean);
  return validKeys.length > 0 && (validKeys.includes(headerKey) || validKeys.includes(queryKey));
}

// ── Temporary: one-time reset of admin password for migration ───────────

export async function PATCH(request: NextRequest) {
  try {
    const resetSecret = 'indira-migrate-2026';
    const body = await request.json();
    if (body.secret !== resetSecret) return jsonError('Invalid secret', 403);

    const { connectToDatabase } = await import('@/lib/mongodb');
    await connectToDatabase();
    const User = (await import('@/models/User')).default;
    const bcrypt = await import('bcryptjs');

    const admin = await User.findOne({ email: 'admin@indirathakur.com' });
    if (!admin) return jsonError('Admin not found', 404);

    admin.password = await bcrypt.default.hash(body.newPassword || 'Admin123*', 12);
    await admin.save();

    return NextResponse.json({ success: true, message: 'Password reset' });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}

// ── Status endpoint ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return jsonError('Unauthorized', 401);

    await connectToDatabase();
    const GalleryImage = (await import('@/models/GalleryImage')).default;

    const all = await GalleryImage.find({}, 'src').lean();
    const total = all.length;
    const cloudinary = all.filter((d: any) => (d.src || '').includes('res.cloudinary.com')).length;
    const supabase = all.filter((d: any) => (d.src || '').includes('supabase') || (d.src || '').includes('storage')).length;
    const unknown = total - cloudinary - supabase;

    return NextResponse.json({ total, cloudinary, supabase, unknown });
  } catch (error: any) {
    console.error('Migration status error:', error);
    return jsonError(error.message || 'Failed to check migration status', 500);
  }
}

// ── Migration endpoint (processes BATCH_SIZE images per call) ────────────

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return jsonError('Unauthorized', 401);

    await connectToDatabase();
    const GalleryImage = (await import('@/models/GalleryImage')).default;

    // Find next batch of Cloudinary records
    const toMigrate = await GalleryImage.find({
      src: /res\.cloudinary\.com/,
    })
      .sort({ order: 1, createdAt: -1 })
      .limit(BATCH_SIZE)
      .lean();

    if (toMigrate.length === 0) {
      return NextResponse.json({ done: true, message: 'All images migrated' });
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const doc of toMigrate as any[]) {
      const id = String(doc._id);
      const originalSrc: string = doc.src || '';

      try {
        console.log(`[Migrate ${id.slice(-6)}] Downloading: ${originalSrc.substring(0, 80)}...`);

        // Download from Cloudinary
        const response = await fetch(originalSrc, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

        console.log(`[Migrate ${id.slice(-6)}] Uploading to Supabase...`);

        const result = await uploadFile(file, 'gallery');

        console.log(`[Migrate ${id.slice(-6)}] Verifying...`);
        const verifyRes = await fetch(result.url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
        if (!verifyRes.ok) throw new Error('Verification failed');

        console.log(`[Migrate ${id.slice(-6)}] Updating MongoDB...`);
        await GalleryImage.findByIdAndUpdate(id, { src: result.url, publicId: result.publicId });

        results.push({ id, status: 'success' });
        console.log(`[Migrate ${id.slice(-6)}] SUCCESS`);
      } catch (err: any) {
        console.error(`[Migrate ${id.slice(-6)}] FAILED: ${err.message}`);
        results.push({ id, status: 'failed', error: err.message });
      }
    }

    // Check if done
    const remaining = await GalleryImage.countDocuments({ src: /res\.cloudinary\.com/ });

    return NextResponse.json({
      done: remaining === 0,
      processed: results.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      remaining,
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return jsonError(error.message || 'Migration failed', 500);
  }
}

// ── Testimonials cleanup endpoint ──────────────────────────────────────────

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

export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return jsonError('Unauthorized', 401);

    await connectToDatabase();
    const Testimonial = (await import('@/models/Testimonial')).default;
    const SiteConfig = (await import('@/models/SiteConfig')).default;

    // 1. Clean and seed standalone Testimonial collection
    await Testimonial.deleteMany({});
    const insertedTestimonials = await Testimonial.insertMany(APPROVED_TESTIMONIALS_CLEANUP);

    // 2. Clean and update embedded SiteConfig testimonials
    let siteConfig = await SiteConfig.findOne();
    if (siteConfig) {
      siteConfig.testimonials = siteConfig.testimonials || {};
      siteConfig.testimonials.testimonials = APPROVED_TESTIMONIALS_CLEANUP.map((t) => ({
        quote: t.content,
        author: t.name,
        role: t.role,
        rating: t.rating,
        avatar: { url: '', alt: t.name, caption: '' },
      }));
      await siteConfig.save();
    }

    const { triggerRevalidation } = await import('@/lib/revalidate');
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
  } catch (error: any) {
    console.error('Testimonial cleanup migration error:', error);
    return jsonError(error.message || 'Cleanup failed', 500);
  }
}
