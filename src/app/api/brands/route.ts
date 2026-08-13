import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { fetchAllBrands, createNewBrand, reorderAllBrands } from '@/lib/brandStorage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    const brands = await fetchAllBrands(includeAll);
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    if (!body.name || !body.logo || !body.logo.url) {
      return NextResponse.json(
        { error: 'Brand name and logo URL are required' },
        { status: 400 }
      );
    }

    const brand = await createNewBrand(body);
    return NextResponse.json(brand, { status: 201 });
  } catch (error: any) {
    console.error('Error creating brand:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create brand' }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    if (Array.isArray(body)) {
      const updatedBrands = await reorderAllBrands(body);
      return NextResponse.json(updatedBrands);
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating brands reorder:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to reorder brands' }, { status });
  }
}
