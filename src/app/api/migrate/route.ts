import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/cmsDatabase';
import { verifyAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { uploadFile } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const BATCH_SIZE = 3;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function guard(request: NextRequest) {
  try {
    const { assertIpNotBlocked } = await import('@/lib/security');
    await assertIpNotBlocked(request);

    // Gallery editors can already manage these same assets in the CMS. Allow
    // them to run the idempotent CDN conversion without granting site-wide
    // admin privileges.
    const user = await verifyAuthUser(request);
    if (!user) throw new ApiError('Unauthorized', 401);
    if (user.role !== 'admin' && user.role !== 'editor') {
      throw new ApiError('Forbidden', 403);
    }
    return null;
  } catch (err: any) {
    return jsonError(err?.message || 'Unauthorized', err?.status || 401);
  }
}

// ── Status endpoint ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const denied = await guard(request);
    if (denied) return denied;

    await connectToDatabase();
    const GalleryImage = (await import('@/models/GalleryImage')).default;

    const all = await GalleryImage.find({}, 'src').lean();
    const total = all.length;
    const cloudinary = all.filter((d: any) => (d.src || '').includes('res.cloudinary.com')).length;
    const supabase = all.filter((d: any) => (d.src || '').includes('supabase') || (d.src || '').includes('storage')).length;
    const unknown = total - cloudinary - supabase;

    return NextResponse.json({ total, cloudinary, supabase, unknown });
  } catch (error: any) {
    console.error('Migration status error:', error);
    return jsonError(error.message || 'Failed to check migration status', 500);
  }
}

// ── Migration endpoint (processes BATCH_SIZE images per call) ────────────

export async function POST(request: NextRequest) {
  try {
    const denied = await guard(request);
    if (denied) return denied;

    await connectToDatabase();
    const GalleryImage = (await import('@/models/GalleryImage')).default;

    // Move legacy remote and inline base64 records to Supabase CDN storage.
    // Inline image data makes every gallery navigation download megabytes of JSON.
    const toMigrate = await GalleryImage.find({
      $or: [
        { src: /res\.cloudinary\.com/ },
        { src: /^data:image\// },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .limit(BATCH_SIZE)
      .lean();

    if (toMigrate.length === 0) {
      return NextResponse.json({ done: true, message: 'All images migrated' });
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const doc of toMigrate as any[]) {
      const id = String(doc._id);
      const originalSrc: string = doc.src || '';

      try {
        console.log(`[Migrate ${id.slice(-6)}] Downloading: ${originalSrc.substring(0, 80)}...`);

        let file: File;
        if (originalSrc.startsWith('data:image/')) {
          const match = originalSrc.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
          if (!match) throw new Error('Invalid inline image data');
          const mimeType = match[1];
          const extension = mimeType.split('/')[1].replace('jpeg', 'jpg') || 'jpg';
          const bytes = Buffer.from(match[2], 'base64');
          file = new File([bytes], `gallery-${id}.${extension}`, { type: mimeType });
        } else {
          const response = await fetch(originalSrc, { signal: AbortSignal.timeout(30_000) });
          if (!response.ok) throw new Error(`Download failed: ${response.status}`);
          const blob = await response.blob();
          file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
        }

        console.log(`[Migrate ${id.slice(-6)}] Uploading to Supabase...`);

        const result = await uploadFile(file, 'gallery');

        console.log(`[Migrate ${id.slice(-6)}] Verifying...`);
        const verifyRes = await fetch(result.url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
        if (!verifyRes.ok) throw new Error('Verification failed');

        console.log(`[Migrate ${id.slice(-6)}] Updating MongoDB...`);
        await GalleryImage.findByIdAndUpdate(id, { src: result.url, publicId: result.publicId });

        results.push({ id, status: 'success' });
        console.log(`[Migrate ${id.slice(-6)}] SUCCESS`);
      } catch (err: any) {
        console.error(`[Migrate ${id.slice(-6)}] FAILED: ${err.message}`);
        results.push({ id, status: 'failed', error: err.message });
      }
    }

    // Check if done
    const remaining = await GalleryImage.countDocuments({
      $or: [
        { src: /res\.cloudinary\.com/ },
        { src: /^data:image\// },
      ],
    });

    return NextResponse.json({
      done: remaining === 0,
      processed: results.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      remaining,
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return jsonError(error.message || 'Migration failed', 500);
  }
}
