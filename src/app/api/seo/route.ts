import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SEO from '@/models/SEO';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db || mongoose.connection.readyState !== 1) {
      return NextResponse.json({});
    }
    const seo = await SEO.findOne().lean().catch(() => null);
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

    const db = await connectToDatabase();
    if (!db || mongoose.connection.readyState !== 1) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }
    const body = await request.json();

    const seo = await (SEO as any).findOneAndUpdate({}, body, { new: true, upsert: true });
    triggerRevalidation();
    return NextResponse.json(seo);
  } catch (error) {
    console.error('SEO PUT error:', error);
    return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
  }
}
