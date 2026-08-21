import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { items } = body; // Array of { id: string, order: number }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const bulkOps = items.map((item: { id: string; order: number }) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    await GalleryImage.bulkWrite(bulkOps);

    triggerRevalidation();

    return NextResponse.json({ success: true, message: `Successfully updated order for ${items.length} items.` });
  } catch (error: any) {
    console.error('Gallery Reorder POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to reorder gallery images' }, { status });
  }
}
