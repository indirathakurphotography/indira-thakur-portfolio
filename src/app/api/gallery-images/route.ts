import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function triggerRevalidation() {
  try {
    revalidatePath('/');
    revalidatePath('/gallery');
    revalidatePath('/admin');
    revalidatePath('/admin/gallery');
    revalidateTag('gallery', 'default');
    revalidateTag('site-config', 'default');
  } catch (e) {
    console.warn('Gallery revalidate error:', e);
  }
}

const DEFAULT_SHOOT_GALLERY = [
  // Shoot 1: The Royal Maternity Collection
  { _id: 'mat-1', src: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1200', width: 1200, height: 1600, category: 'Maternity', shoot: 'The Royal Maternity Collection', title: 'Maternity Frame I — Royal Grace', alt: 'Maternity Photography', order: 1 },
  { _id: 'mat-2', src: 'https://images.unsplash.com/photo-1584297091602-803986927972?q=80&w=1200', width: 1200, height: 1600, category: 'Maternity', shoot: 'The Royal Maternity Collection', title: 'Maternity Frame II — Eternal Dawn', alt: 'Maternity Photography', order: 2 },
  { _id: 'mat-3', src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200', width: 1200, height: 1600, category: 'Maternity', shoot: 'The Royal Maternity Collection', title: 'Maternity Frame III — Quiet Anticipation', alt: 'Maternity Photography', order: 3 },
  { _id: 'mat-4', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200', width: 1200, height: 1600, category: 'Maternity', shoot: 'The Royal Maternity Collection', title: 'Maternity Frame IV — Divine Motherhood', alt: 'Maternity Photography', order: 4 },

  // Shoot 2: Serene Newborn Storytelling
  { _id: 'nb-1', src: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=1200', width: 1200, height: 1600, category: 'Newborn', shoot: 'Serene Newborn Storytelling', title: 'Newborn Frame I — Soft Slumber', alt: 'Newborn Photography', order: 5 },
  { _id: 'nb-2', src: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1200', width: 1200, height: 1600, category: 'Newborn', shoot: 'Serene Newborn Storytelling', title: 'Newborn Frame II — Tender Embrace', alt: 'Newborn Photography', order: 6 },
  { _id: 'nb-3', src: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200', width: 1200, height: 1600, category: 'Newborn', shoot: 'Serene Newborn Storytelling', title: 'Newborn Frame III — Pure Innocence', alt: 'Newborn Photography', order: 7 },
  { _id: 'nb-4', src: 'https://images.unsplash.com/photo-1510154221590-ff63e90a136f?q=80&w=1200', width: 1200, height: 1600, category: 'Newborn', shoot: 'Serene Newborn Storytelling', title: 'Newborn Frame IV — Gentle Beginnings', alt: 'Newborn Photography', order: 8 },

  // Shoot 3: Fine Art Editorial Portraiture
  { _id: 'por-1', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200', width: 1200, height: 1600, category: 'Portrait', shoot: 'Fine Art Editorial Portraiture', title: 'Portrait Frame I — Painterly Contour', alt: 'Portrait Photography', order: 9 },
  { _id: 'por-2', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200', width: 1200, height: 1600, category: 'Portrait', shoot: 'Fine Art Editorial Portraiture', title: 'Portrait Frame II — Chiaroscuro', alt: 'Portrait Photography', order: 10 },
  { _id: 'por-3', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200', width: 1200, height: 1600, category: 'Portrait', shoot: 'Fine Art Editorial Portraiture', title: 'Portrait Frame III — Classic Solitude', alt: 'Portrait Photography', order: 11 },
  { _id: 'por-4', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200', width: 1200, height: 1600, category: 'Portrait', shoot: 'Fine Art Editorial Portraiture', title: 'Portrait Frame IV — Timeless Expression', alt: 'Portrait Photography', order: 12 },

  // Shoot 4: Heritage Family Stories
  { _id: 'fam-1', src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200', width: 1200, height: 1600, category: 'Family', shoot: 'Heritage Family Stories', title: 'Family Frame I — Generations of Love', alt: 'Family Photography', order: 13 },
  { _id: 'fam-2', src: 'https://images.unsplash.com/photo-1609234656388-0ff363383899?q=80&w=1200', width: 1200, height: 1600, category: 'Family', shoot: 'Heritage Family Stories', title: 'Family Frame II — Laughter & Harmony', alt: 'Family Photography', order: 14 },
  { _id: 'fam-3', src: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=1200', width: 1200, height: 1600, category: 'Family', shoot: 'Heritage Family Stories', title: 'Family Frame III — Golden Light', alt: 'Family Photography', order: 15 },
  { _id: 'fam-4', src: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?q=80&w=1200', width: 1200, height: 1600, category: 'Family', shoot: 'Heritage Family Stories', title: 'Family Frame IV — Infinite Bond', alt: 'Family Photography', order: 16 },

  // Shoot 5: Filmcity & Event Celebrations
  { _id: 'evt-1', src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200', width: 1200, height: 1600, category: 'Events', shoot: 'Filmcity & Event Celebrations', title: 'Events Frame I — Gala Elegance', alt: 'Event Photography', order: 17 },
  { _id: 'evt-2', src: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200', width: 1200, height: 1600, category: 'Events', shoot: 'Filmcity & Event Celebrations', title: 'Events Frame II — Celebration Glow', alt: 'Event Photography', order: 18 },
  { _id: 'evt-3', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', width: 1200, height: 1600, category: 'Events', shoot: 'Filmcity & Event Celebrations', title: 'Events Frame III — Cinematic Vows', alt: 'Event Photography', order: 19 },
  { _id: 'evt-4', src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200', width: 1200, height: 1600, category: 'Events', shoot: 'Filmcity & Event Celebrations', title: 'Events Frame IV — Unscripted Joy', alt: 'Event Photography', order: 20 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let items: any[] = [];
    let total = 0;

    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();

        const filter: Record<string, unknown> = {};
        if (category && category.trim() && category.toLowerCase() !== 'all') {
          filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
        }
        if (featured === 'true') filter.featured = true;

        const [dbTotal, dbItems] = await Promise.all([
          GalleryImage.countDocuments(filter),
          GalleryImage.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ]);

        if (dbItems && dbItems.length > 0) {
          total = dbTotal;
          items = dbItems;
        }
      } catch (dbErr) {
        console.warn('MongoDB gallery fetch failed, using default gallery dataset:', dbErr);
      }
    }

    if (items.length === 0) {
      let filtered = DEFAULT_SHOOT_GALLERY;
      if (category && category.trim() && category.toLowerCase() !== 'all') {
        const catLower = category.toLowerCase().trim();
        filtered = filtered.filter((item) => item.category.toLowerCase().includes(catLower) || catLower.includes(item.category.toLowerCase()));
      }
      total = filtered.length;
      items = filtered.slice((page - 1) * limit, page * limit);
    }

    const mapped = items.map((item: any) => ({
      ...item,
      _id: item._id ? String(item._id) : item.id || `img-${Math.random().toString(36).substr(2, 9)}`,
      thumbnail: item.thumbnail || item.src,
      src: item.src,
      alt: item.alt || item.title || '',
      title: item.title || '',
      description: item.description || '',
      width: item.width || 800,
      height: item.height || 1000,
      category: item.category || 'Portrait',
      featured: !!item.featured,
      order: item.order ?? 0,
    }));

    return NextResponse.json({
      items: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('GalleryImage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    if (!body.src) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const item = await GalleryImage.create({
      src: body.src,
      publicId: body.publicId || '',
      alt: body.alt || body.title || '',
      title: body.title || '',
      description: body.description || '',
      width: body.width || 800,
      height: body.height || 1000,
      category: body.category || '',
      featured: !!body.featured,
      order: body.order ?? 0,
    });

    triggerRevalidation();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('GalleryImage POST error:', error);
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
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
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const item = await GalleryImage.findByIdAndUpdate(id, updateData, { new: true });
    if (!item) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }

    triggerRevalidation();

    return NextResponse.json(item);
  } catch (error) {
    console.error('GalleryImage PUT error:', error);
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
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
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const item = await GalleryImage.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }

    triggerRevalidation();

    return NextResponse.json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (error) {
    console.error('GalleryImage DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}
