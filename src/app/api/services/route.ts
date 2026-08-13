import { NextResponse } from 'next/server';
import {
  fetchAllServices,
  createNewService,
  updateExistingService,
  deleteExistingService,
} from '@/lib/servicesStorage';
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
    const fallbackServices = await fetchAllServices();
    return NextResponse.json(fallbackServices, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    const service = await createNewService(body);
    triggerRevalidation();
    return NextResponse.json(service, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Service POST error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await updateExistingService(targetId, updateData);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    triggerRevalidation();
    return NextResponse.json(service, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Service PUT error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    await deleteExistingService(id);
    triggerRevalidation();
    return NextResponse.json({ success: true, message: 'Service deleted successfully' }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
