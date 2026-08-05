import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import DynamicSections from '@/models/DynamicSections';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageKey = searchParams.get('pageKey');

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey query parameter is required' }, { status: 400 });
    }

    await connectToDatabase();
    const doc = await DynamicSections.findOne({ pageKey });
    return NextResponse.json(doc || { pageKey, sections: [] });
  } catch (error) {
    console.error('DynamicSections GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dynamic sections' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { pageKey, sections } = body;

    if (!pageKey) {
      return NextResponse.json({ error: 'pageKey is required' }, { status: 400 });
    }

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: 'sections must be an array' }, { status: 400 });
    }

    const doc = await DynamicSections.findOneAndUpdate(
      { pageKey },
      { pageKey, sections },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(doc);
  } catch (error) {
    console.error('DynamicSections PUT error:', error);
    return NextResponse.json({ error: 'Failed to update dynamic sections' }, { status: 500 });
  }
}
