import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import {
  isR2Configured,
  getR2Config,
  uploadToR2,
  ensureR2Bucket,
  getR2PublicUrl,
} from '@/lib/r2';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export interface MigrationFileItem {
  key: string;
  sourceUrl: string;
  folder: string;
  status: 'PENDING' | 'MIGRATED' | 'BLOCKED_402' | 'FAILED' | 'ALREADY_EXISTS';
  reason?: string;
  r2Url?: string;
  bytes?: number;
}

// All known media assets referenced in the project
export const KNOWN_SUPABASE_ASSETS: Array<{ sourceUrl: string; key: string; folder: string; description: string }> = [
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg',
    key: 'about/story/1785827668424-Indira.jpg',
    folder: 'about/story',
    description: 'Indira Thakur Founder Portrait',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/films/1785569204452-thumbnail.jpg',
    key: 'films/1785569204452-thumbnail.jpg',
    folder: 'films',
    description: 'Filmcity Premiere Film Thumbnail',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    key: 'home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    folder: 'home/hero/slideshow',
    description: 'Wedding & Family Portraits Collection',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    key: 'home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    folder: 'home/hero/slideshow',
    description: 'Newborn Slumber & Storytelling',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    key: 'home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    folder: 'home/hero/slideshow',
    description: 'Newborn & Family Session',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    key: 'home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    folder: 'home/hero/slideshow',
    description: 'Fine Art Portraiture',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    key: 'home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    folder: 'home/hero/slideshow',
    description: 'Naming Ceremony Event',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    key: 'home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    folder: 'home/hero/slideshow',
    description: 'Newborn Family Portrait',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
    key: 'home/hero/slideshow/1785524162837-maternity.jpg',
    folder: 'home/hero/slideshow',
    description: 'Maternity Fine Art Collection',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    key: 'home/hero/slideshow/1785573149313-47.jpg',
    folder: 'home/hero/slideshow',
    description: 'Brand Collaboration Session',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    key: 'home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    folder: 'home/hero/slideshow',
    description: 'Studio Fine Art Session B&W',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
    key: 'seo/1785574467987-Indira_Photography_logo.jpeg',
    folder: 'seo',
    description: 'Indira Photography Brand Logo & Social Card',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    key: 'services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    folder: 'services/maternity-photography',
    description: 'Royal Maternity Shoot in Nature',
  },
  {
    sourceUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
    key: 'videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
    folder: 'videos/thumbnails',
    description: 'Video Testimonial Avatar Thumbnail',
  },
];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r2Ready = isR2Configured();
  const config = getR2Config();

  // Audit current state of each asset
  const statusList: MigrationFileItem[] = [];

  for (const asset of KNOWN_SUPABASE_ASSETS) {
    let status: MigrationFileItem['status'] = 'PENDING';
    let reason: string | undefined;

    // Check if already in R2
    if (r2Ready) {
      try {
        const client = getR2Client();
        await client.send(
          new HeadObjectCommand({
            Bucket: config.bucketName,
            Key: asset.key,
          })
        );
        status = 'ALREADY_EXISTS';
        reason = 'Object already exists in Cloudflare R2 bucket.';
      } catch (err: any) {
        // Not in R2, verify if Supabase has it
      }
    }

    if (status === 'PENDING') {
      try {
        const res = await fetch(asset.sourceUrl, { method: 'HEAD' });
        if (res.status === 402) {
          status = 'BLOCKED_402';
          reason = 'HTTP 402 - exceed_cached_egress_quota: Supabase project egress quota exceeded and service is locked.';
        } else if (!res.ok) {
          status = 'FAILED';
          reason = `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (err: any) {
        status = 'FAILED';
        reason = err.message || 'Fetch failed';
      }
    }

    statusList.push({
      key: asset.key,
      sourceUrl: asset.sourceUrl,
      folder: asset.folder,
      status,
      reason,
      r2Url: getR2PublicUrl(asset.key),
    });
  }

  return NextResponse.json({
    r2Configured: r2Ready,
    r2Bucket: config.bucketName,
    r2Endpoint: config.endpoint,
    r2PublicDomain: config.publicDomain || 'App streaming proxy (/api/media/*)',
    totalKnownAssets: KNOWN_SUPABASE_ASSETS.length,
    assets: statusList,
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r2Ready = isR2Configured();
  if (!r2Ready) {
    return NextResponse.json(
      {
        error:
          'Cloudflare R2 is not configured. Please set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.',
        success: false,
      },
      { status: 400 }
    );
  }

  const config = getR2Config();
  await ensureR2Bucket(config.bucketName);

  const results: MigrationFileItem[] = [];
  let migratedCount = 0;
  let blockedCount = 0;
  let alreadyExistsCount = 0;
  let failedCount = 0;

  for (const asset of KNOWN_SUPABASE_ASSETS) {
    // 1. Check if already in R2
    try {
      const client = getR2Client();
      await client.send(
        new HeadObjectCommand({
          Bucket: config.bucketName,
          Key: asset.key,
        })
      );
      results.push({
        key: asset.key,
        sourceUrl: asset.sourceUrl,
        folder: asset.folder,
        status: 'ALREADY_EXISTS',
        r2Url: getR2PublicUrl(asset.key),
        reason: 'Asset already exists in Cloudflare R2 bucket.',
      });
      alreadyExistsCount++;
      continue;
    } catch {
      // Not yet in R2, proceed to download from Supabase
    }

    // 2. Download from Supabase
    try {
      const fetchRes = await fetch(asset.sourceUrl);
      if (fetchRes.status === 402) {
        results.push({
          key: asset.key,
          sourceUrl: asset.sourceUrl,
          folder: asset.folder,
          status: 'BLOCKED_402',
          reason:
            'HTTP 402 exceed_cached_egress_quota: Supabase bandwidth limit reached. File cannot be downloaded via Supabase public URL until quota cap is lifted or upgraded.',
        });
        blockedCount++;
        continue;
      }

      if (!fetchRes.ok) {
        results.push({
          key: asset.key,
          sourceUrl: asset.sourceUrl,
          folder: asset.folder,
          status: 'FAILED',
          reason: `HTTP ${fetchRes.status}: ${fetchRes.statusText}`,
        });
        failedCount++;
        continue;
      }

      const buffer = Buffer.from(await fetchRes.arrayBuffer());
      const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';

      const uploadResult = await uploadToR2(asset.key, buffer, contentType, {
        originalUrl: asset.sourceUrl,
        migratedAt: new Date().toISOString(),
      });

      results.push({
        key: asset.key,
        sourceUrl: asset.sourceUrl,
        folder: asset.folder,
        status: 'MIGRATED',
        r2Url: uploadResult.url,
        bytes: uploadResult.size,
      });
      migratedCount++;
    } catch (err: any) {
      results.push({
        key: asset.key,
        sourceUrl: asset.sourceUrl,
        folder: asset.folder,
        status: 'FAILED',
        reason: err.message || 'Unknown network error',
      });
      failedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: KNOWN_SUPABASE_ASSETS.length,
      migrated: migratedCount,
      blockedBySupabase402: blockedCount,
      alreadyExists: alreadyExistsCount,
      failed: failedCount,
    },
    results,
  });
}
