import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SERVICE_IMAGE_MAP: Record<string, string> = {
  'newborn photography': 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
  'maternity photography': 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784471853/indira-thakur/services/maternity-photography/y0emfs2l6egfuryv7yjl.jpg',
  'portraits': 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784626074/indira-thakur/services/portraits/z28rt42ozq72icajozdy.jpg',
  'wedding photography': 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784471924/indira-thakur/services/wedding-photography/rkvcp8yhix4shcweiofs.jpg',
  'events': 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784626151/indira-thakur/services/corporate-events/ts1tpbyil89cr2awkped.jpg',
  'brand collaboration': 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784793948/indira-thakur/gallery/kevyboqqog54wyte1zs2.jpg',
};

export async function GET() {
  try {
    await connectToDatabase();
    const services = await Service.find({}).sort({ order: 1, createdAt: -1 }).lean();
    const formatted = services.map((s: any) => {
      const lower = (s.title || '').toLowerCase().trim();
      const mappedImg = SERVICE_IMAGE_MAP[lower];
      if (mappedImg && (!s.heroImage || s.heroImage.includes('/storage/v1/object/public/images/services/'))) {
        return { ...s, heroImage: mappedImg };
      }
      return s;
    });
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Service GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
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

    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
