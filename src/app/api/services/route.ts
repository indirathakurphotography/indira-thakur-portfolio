import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import SiteConfig from '@/models/SiteConfig';
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
    const [dbServices, siteConfigDoc] = await Promise.all([
      Service.find({}).sort({ order: 1, createdAt: -1 }).lean().catch(() => []),
      SiteConfig.findOne().lean().catch(() => null),
    ]);

    const cmsServices = siteConfigDoc?.services?.services || [];

    if (dbServices && dbServices.length > 0) {
      const sanitized = dbServices.map((svc: any) => {
        let img = svc.image || svc.imageUrl || '';
        if (typeof img === 'object' && img.url) img = img.url;

        if (!img || img.includes('placeholder')) {
          const matchTitle = (svc.title || '').toLowerCase().trim();
          const cmsMatch = cmsServices.find((cs: any) => (cs.title || '').toLowerCase().trim() === matchTitle);
          if (cmsMatch && cmsMatch.image?.url) {
            img = cmsMatch.image.url;
          } else {
            const defMatch = DEFAULT_APPROVED_SERVICES.find((ds) => ds.title.toLowerCase().trim() === matchTitle);
            if (defMatch) img = defMatch.image;
          }
        }
        return { ...svc, image: img };
      });
      return NextResponse.json(sanitized, { headers: CACHE_HEADERS });
    }

    if (Array.isArray(cmsServices) && cmsServices.length > 0) {
      const cmsMapped = cmsServices.map((cs: any, idx: number) => ({
        _id: `cms-s-${idx}`,
        title: cs.title || 'Photography Service',
        slug: (cs.title || 'service').toLowerCase().replace(/\s+/g, '-'),
        tagline: cs.subtitle || '',
        description: cs.description || '',
        image: cs.image?.url || DEFAULT_APPROVED_SERVICES[idx % DEFAULT_APPROVED_SERVICES.length]?.image || '',
        order: idx + 1,
      }));
      return NextResponse.json(cmsMapped, { headers: CACHE_HEADERS });
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
