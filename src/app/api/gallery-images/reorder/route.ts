import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
import { reorderGalleryImages } from '@/lib/galleryStorage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const items = body.items || body.orders;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items or orders array is required' }, { status: 400 });
    }

    await reorderGalleryImages(items);

    triggerRevalidation();

    return NextResponse.json({
      success: true,
      message: `Successfully updated order for ${items.length} items.`,
    });
  } catch (error: any) {
    console.error('Gallery Reorder POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to reorder gallery images' }, { status });
  }
}
