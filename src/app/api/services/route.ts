import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export const DEFAULT_APPROVED_SERVICES = [
  {
    _id: 'srv-newborn',
    title: 'Newborn Photography',
    slug: 'newborn-photography',
    tagline: 'Gentle & Safe First Slumbers',
    description: 'Safety-certified, peaceful infant art focusing on delicate details, organic textures, and pure family connection in a climate-controlled studio.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    order: 1
  },
  {
    _id: 'srv-maternity',
    title: 'Maternity Photography',
    slug: 'maternity-photography',
    tagline: 'Graceful & Timeless Pregnancy Art',
    description: 'Celebrate the extraordinary beauty of motherhood with couture studio gowns, artistic drapery, and romantic golden-hour lighting designed to highlight your strength and glow.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    order: 2
  },
  {
    _id: 'srv-portraits',
    title: 'Portraits',
    slug: 'portraits',
    tagline: 'Timeless Heirloom Portraiture',
    description: 'Masterfully lit studio and outdoor portraiture capturing multi-generational grace, quiet intimacy, and authentic personal expression.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    order: 3
  },
  {
    _id: 'srv-wedding',
    title: 'Wedding Photography',
    slug: 'wedding-photography',
    tagline: 'Editorial Wedding Stories',
    description: 'Cinematic, documentary-style wedding coverage capturing sacred rituals, raw emotions, and grand celebrations with artistic flair.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    order: 4
  },
  {
    _id: 'srv-events',
    title: 'Events',
    slug: 'events',
    tagline: 'Milestone & Celebration Documentaries',
    description: 'Seamless event photography for family milestones, naming ceremonies, anniversaries, and high-profile gatherings.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    order: 5
  },
  {
    _id: 'srv-brand',
    title: 'Brand Collaboration',
    slug: 'brand-collaboration',
    tagline: 'Couture Brand & Editorial Storycraft',
    description: 'High-end editorial imagery, brand campaigns, and bespoke event documentaries crafted with journalistic precision and artistic flair.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    order: 6
  }
];

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET() {
  try {
    await connectToDatabase();
    const services = await Service.find({}).sort({ order: 1, createdAt: -1 }).lean();
    if (services && services.length > 0) {
      const approvedTitles = [
        'newborn photography',
        'maternity photography',
        'portraits',
        'wedding photography',
        'events',
        'brand collaboration'
      ];
      const filtered = services.filter((s: any) => approvedTitles.includes((s.title || '').toLowerCase().trim()));
      if (filtered.length === 6) {
        return NextResponse.json(filtered, { headers: CACHE_HEADERS });
      }
    }
    return NextResponse.json(DEFAULT_APPROVED_SERVICES, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Service GET error:', error);
    return NextResponse.json(DEFAULT_APPROVED_SERVICES, { headers: CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    const service = await Service.create(body);
    triggerRevalidation();
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Service POST error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
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
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await Service.findByIdAndUpdate(id, updateData, { new: true });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json(service);
  } catch (error) {
    console.error('Service PUT error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
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
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
