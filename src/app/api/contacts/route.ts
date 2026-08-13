import { NextResponse } from 'next/server';
import Contact from '@/models/Contact';
import { requireAdmin, connectDb, parseObjectId, serializeDoc } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(serializeDoc(contacts), { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Contact GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch contacts' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const body = await request.json();
    const { id, _id, ...updateData } = body;

    const targetId = id || _id;
    if (!targetId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const objectId = parseObjectId(targetId);
    const contact: any = await Contact.findByIdAndUpdate(objectId, { $set: updateData }, { new: true }).lean();
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Read-after-write verification
    const fresh = await Contact.findById(objectId).lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: contact was not found in MongoDB.' }, { status: 500 });
    }

    return NextResponse.json(serializeDoc(fresh), { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Contact PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update contact status' }, { status, headers: NO_CACHE_HEADERS });
  }
}
