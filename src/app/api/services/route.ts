import { NextResponse } from 'next/server';
import {
  fetchAllServices,
  createNewService,
  updateExistingService,
  deleteExistingService,
} from '@/lib/servicesStorage';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const services = await fetchAllServices();
    return NextResponse.json(services, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Service GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = body.slug?.trim() || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `service-${Date.now()}`;
    const service = await createNewService({ ...body, slug });
    triggerRevalidation();
    return NextResponse.json(service, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Service POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create service' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await updateExistingService(targetId, updateData);
    triggerRevalidation();
    return NextResponse.json(service, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Service PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update service' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    await deleteExistingService(id);
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Service deleted successfully' }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Service DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete service' }, { status, headers: NO_CACHE_HEADERS });
  }
}
