import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
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
    const fallbackBrands = await fetchAllBrands(false);
    return NextResponse.json(fallbackBrands);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name || !body.logo || !body.logo.url) {
      return NextResponse.json(
        { error: 'Brand name and logo URL are required' },
        { status: 400 }
      );
    }

    const brand = await createNewBrand(body);
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (Array.isArray(body)) {
      const updatedBrands = await reorderAllBrands(body);
      return NextResponse.json(updatedBrands);
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error updating brands reorder:', error);
    return NextResponse.json({ error: 'Failed to reorder brands' }, { status: 500 });
  }
}
