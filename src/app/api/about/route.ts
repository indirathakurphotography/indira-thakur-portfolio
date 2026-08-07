import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import About from '@/models/About';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export const DEFAULT_ABOUT = {
  eyebrow: 'THE ARTIST & STORYTELLER',
  heading: 'Indira Thakur',
  subheading: 'Lifestyle Stills & Films',
  story: "Hello!\nI am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2014, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.",
  storyContinued: "I am a certified newborn photographer and specialise in child photography, maternity, birth photography and portrait photography.\nPhotography, for me, is much more than taking pictures.\nIt is about preserving emotions, celebrating life, documenting milestones, and creating timeless memories that people will treasure for generations.",
  philosophy: "I believe every family is unique, and every session deserves infinite patience, warmth, creative styling, and artistic care.",
  philosophyContinued: "From hand-selecting organic newborn wraps to guiding expectant mothers through effortless poses, every detail is handled with masterly intention.",
  journey: "One of the proudest milestones in my journey was creating a film for Dadasaheb Phalke Chitranagri (Filmcity), Goregaon, which premiered at the Chitrapataka Film Festival.",
  journeyContinued: "Over the past decade, I have had the honor of documenting over 500 family stories across India and internationally.",
  welcomeMessage: "I warmly invite you to become a part of the Indira Thakur Photography family. Let us create something timeless together.",
  signature: 'Indira Thakur',
  specializations: ['Newborn Photography', 'Maternity Photography', 'Portraits', 'Wedding Photography', 'Events', 'Brand Collaboration'],
  achievements: [
    { title: 'Filmcity Premiere', description: 'Documentary film created for Dadasaheb Phalke Chitranagri premiered at Chitrapataka Film Festival.', year: '2021' },
    { title: 'Master Newborn Specialist', description: 'Certified newborn art specialist with over 500+ infant sessions conducted.', year: '2019' },
    { title: 'Journalism & PR Excellence', description: 'Transformed storycraft from media journalism into high-end portrait photography.', year: '2014' },
  ],
  stats: [
    { label: 'Years of Experience', value: '11+' },
    { label: 'Families Documented', value: '500+' },
    { label: 'Publications & Festivals', value: '15+' },
    { label: 'Satisfaction Rating', value: '100%' },
  ],
  values: [
    { title: 'Safety & Comfort First', description: 'Infant safety certified with climate-controlled, ultra-hygienic studio settings.' },
    { title: 'Timeless Aesthetic', description: 'Soft, natural tones and painterly lighting that never go out of style.' },
    { title: 'Heirloom Quality', description: 'Museum-grade fine art prints and handcrafted leather albums built for lifetimes.' },
  ],
  ctaText: 'Explore My Work',
  ctaLink: '/gallery',
  images: {
    founderPortrait: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Indira Thakur Portrait' },
    journeyImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Wedding & Family Portraits' },
    storyImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Maternity Photography in Nature' },
    achievementImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/films/1785569204452-thumbnail.jpg', alt: 'Filmcity Premiere Film' },
    behindTheScenes: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg', alt: 'Studio Fine Art Session' },
    welcomeImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Newborn & Family Session' },
    editorial1: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg', alt: 'Naming Ceremony Celebration' },
    editorial2: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg', alt: 'Newborn Storytelling' },
  },
};

let cachedAboutResponse: any = null;
let lastAboutFetchTime = 0;
const CACHE_TTL_MS = 60000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedAboutResponse && (now - lastAboutFetchTime) < CACHE_TTL_MS) {
      return NextResponse.json(cachedAboutResponse, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
        },
      });
    }

    let responseData: any = DEFAULT_ABOUT;
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const about = await About.findOne().lean();
        if (about) {
          responseData = about;
        }
      } catch (dbErr) {
        console.warn('MongoDB error in About route, using defaults:', dbErr);
      }
    }

    // Ensure founder portrait URL is Indira's photo
    const currentPortrait = responseData?.images?.founderPortrait?.url;
    if (!currentPortrait || currentPortrait.includes('z28rt42ozq72icajozdy') || currentPortrait.includes('services/portraits')) {
      if (!responseData.images) responseData.images = {};
      responseData.images.founderPortrait = {
        url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg',
        alt: 'Indira Thakur Portrait',
      };
    }

    cachedAboutResponse = responseData;
    lastAboutFetchTime = Date.now();

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('About GET error:', error);
    return NextResponse.json(DEFAULT_ABOUT, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const about = await About.findOneAndUpdate({}, body, { new: true, upsert: true });
    cachedAboutResponse = null;
    triggerRevalidation();
    return NextResponse.json(about);
  } catch (error) {
    console.error('About PUT error:', error);
    return NextResponse.json({ error: 'Failed to update About content' }, { status: 500 });
  }
}
