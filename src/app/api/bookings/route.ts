import { NextResponse } from 'next/server';
import Booking from '@/models/Booking';
import { requireAdmin, connectDb, parseObjectId, serializeDoc } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(serializeDoc(bookings), { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Booking GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch bookings' }, { status, headers: NO_CACHE_HEADERS });
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
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const objectId = parseObjectId(targetId);
    const booking: any = await Booking.findByIdAndUpdate(objectId, { $set: updateData }, { new: true }).lean();
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Read-after-write verification
    const fresh = await Booking.findById(objectId).lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: booking was not found in MongoDB.' }, { status: 500 });
    }

    return NextResponse.json(serializeDoc(fresh), { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Booking PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update booking status' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    await connectDb();
    const objectId = parseObjectId(id);
    const booking = await Booking.deleteOne({ _id: objectId });
    if (booking.deletedCount !== 1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete verification
    const check = await Booking.findById(objectId).lean();
    if (check) {
      return NextResponse.json({ error: 'Delete verification failed: booking still exists in MongoDB.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Booking DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete booking' }, { status, headers: NO_CACHE_HEADERS });
  }
}
