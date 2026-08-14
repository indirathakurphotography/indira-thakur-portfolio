import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdmin(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, publicId, fileName, originalName, size, type, folder = 'general' } = body;

    if (!url || !publicId) {
      return NextResponse.json({ error: 'url and publicId are required' }, { status: 400 });
    }

    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      if (!db) {
        return NextResponse.json({ error: 'Database connection unavailable. Upload was not recorded.' }, { status: 503 });
      }

      const FileRecord = (await import('@/models/FileRecord')).default;
      await FileRecord.create({
        url,
        publicId,
        filename: (fileName || publicId).replace(/[^a-zA-Z0-9.-]/g, '_'),
        originalName: originalName || fileName || publicId,
        size: size || 0,
        type: type || 'application/octet-stream',
        folder,
      });
    }

    return NextResponse.json({ success: true, url, publicId });
  } catch (err: any) {
    console.error('[Upload Complete Error]', err);
    return NextResponse.json({ error: err.message || 'Failed to record upload' }, { status: 500 });
  }
}
