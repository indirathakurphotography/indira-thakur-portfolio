import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import About from '@/models/About';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const WORKING_FOUNDER_PORTRAIT = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200';

export async function GET() {
  try {
    await connectToDatabase();
    const about = await About.findOne().lean();
    if (!about) return NextResponse.json({});

    const formatted = { ...about };
    if (formatted.images?.founderPortrait?.url && formatted.images.founderPortrait.url.includes('1785569204452-indira-portrait.jpg')) {
      formatted.images.founderPortrait.url = WORKING_FOUNDER_PORTRAIT;
    } else if (!formatted.images?.founderPortrait?.url) {
      if (!formatted.images) formatted.images = {};
      formatted.images.founderPortrait = {
        url: WORKING_FOUNDER_PORTRAIT,
        alt: 'Indira Thakur Founder Portrait'
      };
    }

    if (formatted.images?.editorial2?.url && formatted.images.editorial2.url.includes('photo-1584297091602-803986927972')) {
      formatted.images.editorial2.url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200';
    }

    return NextResponse.json(formatted);
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
