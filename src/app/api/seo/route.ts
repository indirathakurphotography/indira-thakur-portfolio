import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SEO from '@/models/SEO';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const seo = await SEO.findOne();
    return NextResponse.json(seo || {});
  } catch (error) {
    console.error('SEO GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const seo = await SEO.findOneAndUpdate({}, body, { new: true, upsert: true });
    return NextResponse.json(seo);
  } catch (error) {
    console.error('SEO PUT error:', error);
    return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
  }
}
