import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { updateExistingBrand, deleteExistingBrand } from '@/lib/brandStorage';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    const brand = await updateExistingBrand(id, body);
    return NextResponse.json(brand);
  } catch (error: any) {
    console.error('Error updating brand:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update brand' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    await deleteExistingBrand(id);
    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete brand' }, { status });
  }
}
