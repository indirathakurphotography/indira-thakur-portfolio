import { NextResponse } from 'next/server';
import ThemeSettings from '@/models/ThemeSettings';
import { requireAdmin, connectDb } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { triggerRevalidation } from '@/lib/revalidate';

const ThemeSettingsModel = ThemeSettings as any;

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    await connectDb();
    const theme: any = await ThemeSettings.findOne().lean();
    if (!theme) {
      return NextResponse.json({}, { headers: NO_CACHE_HEADERS });
    }

    if (theme.primaryColor === '#C2186A') {
      const migrated = await ThemeSettingsModel.findByIdAndUpdate(
        theme._id,
        {
          $set: {
            primaryColor: '#C39E96',
            secondaryColor: '#A88179',
            accentColor: '#E2C3BC',
            backgroundColor: '#FAF6F3',
            textColor: '#2B2625',
            mutedTextColor: '#7C706D',
            cardBorder: '#F4ECE8',
            navBackground: '#FAF6F3',
            navTextColor: '#2B2625',
            footerBackground: '#2B2625',
            footerTextColor: '#FAF6F3',
          },
        },
        { new: true }
      ).lean();
      return NextResponse.json(migrated || theme, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(theme, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Theme GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch theme settings' }, { status: 503, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const body = await request.json();
    assertNoProhibitedLanguage(body);
    const { _id, id, __v, createdAt, updatedAt, ...updateData } = body;

    const theme: any = await ThemeSettingsModel.findOneAndUpdate({}, { $set: updateData }, { new: true, upsert: true }).lean();
    if (!theme) {
      return NextResponse.json({ error: 'Failed to persist theme settings' }, { status: 500 });
    }

    // Read-after-write verification
    const fresh = await ThemeSettings.findOne().lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: theme settings were not found in MongoDB.' }, { status: 500 });
    }

    triggerRevalidation();
    return NextResponse.json(fresh, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Theme PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update theme settings' }, { status, headers: NO_CACHE_HEADERS });
  }
}
