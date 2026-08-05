import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Brand from '@/models/Brand';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const brands = await Brand.find({ isActive: { $ne: false } }).sort({ displayOrder: 1, createdAt: -1 });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}
