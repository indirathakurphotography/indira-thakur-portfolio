import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const config = await SiteConfig.findOne();
    return NextResponse.json(config || {});
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
