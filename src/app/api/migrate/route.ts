import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { uploadFile } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const BATCH_SIZE = 3;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAuthorized(request: NextRequest): boolean {
  // Regular auth via cookie
  const user = getAuthUser(request);
  if (user) return true;
  // Fallback: migration key or Vercel OIDC token passed as header or query param
  const migrationKey = process.env.MIGRATION_KEY || '';
  const oidcToken = process.env.VERCEL_OIDC_TOKEN || '';
  const headerKey = request.headers.get('x-migration-key') || request.headers.get('authorization')?.replace('Bearer ', '') || '';
  const queryKey = request.nextUrl.searchParams.get('key') || '';
  const validKeys = [migrationKey, oidcToken].filter(Boolean);
  return validKeys.length > 0 && (validKeys.includes(headerKey) || validKeys.includes(queryKey));
}

// ── Temporary: one-time reset of admin password for migration ───────────

export async function PATCH(request: NextRequest) {
  try {
    const resetSecret = 'indira-migrate-2026';
    const body = await request.json();
    if (body.secret !== resetSecret) return jsonError('Invalid secret', 403);

    const { connectToDatabase } = await import('@/lib/mongodb');
    await connectToDatabase();
    const User = (await import('@/models/User')).default;
    const bcrypt = await import('bcryptjs');

    const admin = await User.findOne({ email: 'admin@indirathakur.com' });
    if (!admin) return jsonError('Admin not found', 404);

    admin.password = await bcrypt.default.hash(body.newPassword || 'Admin123*', 12);
    await admin.save();

    return NextResponse.json({ success: true, message: 'Password reset' });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}

// ── Status endpoint ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return jsonError('Unauthorized', 401);

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
    if (!isAuthorized(request)) return jsonError('Unauthorized', 401);

    await connectToDatabase();
    const GalleryImage = (await import('@/models/GalleryImage')).default;

    // Find next batch of Cloudinary records
    const toMigrate = await GalleryImage.find({
      src: /res\.cloudinary\.com/,
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

        // Download from Cloudinary
        const response = await fetch(originalSrc, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

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
    const remaining = await GalleryImage.countDocuments({ src: /res\.cloudinary\.com/ });

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
