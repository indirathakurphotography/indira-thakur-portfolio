import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BrandSettings from '@/models/BrandSettings';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export async function GET() {
  try {
    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      let brand = await BrandSettings.findOne();
      if (!brand) {
        brand = await BrandSettings.create({});
      }
      return NextResponse.json(brand, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
        },
      });
    }
    return NextResponse.json({}, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Brand GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();
    const brand = await BrandSettings.findOneAndUpdate({}, body, { new: true, upsert: true });
    triggerRevalidation();
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json({ error: 'Failed to update brand settings' }, { status: 500 });
  }
}
