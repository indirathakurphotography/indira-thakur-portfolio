import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import About from '@/models/About';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const about = await About.findOne();
    return NextResponse.json(about || {});
  } catch (error) {
    console.error('About GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch About content' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const about = await About.findOneAndUpdate({}, body, { new: true, upsert: true });
    return NextResponse.json(about);
  } catch (error) {
    console.error('About PUT error:', error);
    return NextResponse.json({ error: 'Failed to update About content' }, { status: 500 });
  }
}
