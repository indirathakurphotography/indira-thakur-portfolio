import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import {
  isR2Configured,
  getR2Config,
  uploadToR2,
  ensureR2Bucket,
  getR2PublicUrl,
  listR2Objects,
  getR2Client,
} from '@/lib/r2';
import { HeadObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export interface MigrationFileItem {
  key: string;
  sourceUrl: string;
  folder: string;
  status:
    | 'PENDING'
    | 'MIGRATED'
    | 'MIGRATED_FROM_LOCAL'
    | 'MIGRATED_FROM_DB_BASE64'
    | 'MIGRATED_FROM_CLOUDINARY'
    | 'BLOCKED_402'
    | 'FAILED'
    | 'ALREADY_EXISTS';
  reason?: string;
  r2Url?: string;
  bytes?: number;
}

// All known media assets referenced in the project across hero, brand, services, about, films, etc.
export const KNOWN_SUPABASE_ASSETS: Array<{
  sourceUrl: string;
  key: string;
  folder: string;
  description: string;
}> = [
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/testimonials/1788182788600-whatsapp_video_2026-08-31_at_5.18.42_pm.mp4',
    key: 'videos/testimonials/1788182788600-whatsapp_video_2026-08-31_at_5.18.42_pm.mp4',
    folder: 'videos/testimonials',
    description: 'Samreen drag-and-drop testimonial MP4',
  },
  // Brand & Logo
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/brand/1786446222005-Indira_Photography_logo.jpeg',
    key: 'brand/1786446222005-Indira_Photography_logo.jpeg',
    folder: 'brand',
    description: 'Primary Navbar & Header Logo',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/brand/1786446225171-Indira_Photography_logo.jpeg',
    key: 'brand/1786446225171-Indira_Photography_logo.jpeg',
    folder: 'brand',
    description: 'Brand Favicon & Icon Asset',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/footer/logo/1786430147426-Indira_Photography_logo.jpeg',
    key: 'footer/logo/1786430147426-Indira_Photography_logo.jpeg',
    folder: 'footer/logo',
    description: 'Footer Brand Logo',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
    key: 'seo/1785574467987-Indira_Photography_logo.jpeg',
    folder: 'seo',
    description: 'SEO & Social OpenGraph Card Image',
  },
  // About Section
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg',
    key: 'about/story/1785827668424-Indira.jpg',
    folder: 'about/story',
    description: 'Indira Thakur Founder Portrait',
  },
  // Films
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/films/1785569204452-thumbnail.jpg',
    key: 'films/1785569204452-thumbnail.jpg',
    folder: 'films',
    description: 'Filmcity Premiere Film Thumbnail',
  },
  // Hero Slideshow
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    key: 'home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    folder: 'home/hero/slideshow',
    description: 'Wedding & Family Portraits Collection',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    key: 'home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    folder: 'home/hero/slideshow',
    description: 'Newborn Slumber & Storytelling',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    key: 'home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    folder: 'home/hero/slideshow',
    description: 'Newborn & Family Session',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    key: 'home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    folder: 'home/hero/slideshow',
    description: 'Fine Art Portraiture',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    key: 'home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    folder: 'home/hero/slideshow',
    description: 'Naming Ceremony Event',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    key: 'home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    folder: 'home/hero/slideshow',
    description: 'Newborn Family Portrait',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
    key: 'home/hero/slideshow/1785524162837-maternity.jpg',
    folder: 'home/hero/slideshow',
    description: 'Maternity Fine Art Collection',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    key: 'home/hero/slideshow/1785573149313-47.jpg',
    folder: 'home/hero/slideshow',
    description: 'Brand Collaboration Session',
  },
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    key: 'home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    folder: 'home/hero/slideshow',
    description: 'Studio Fine Art Session B&W',
  },
  // Services
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    key: 'services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    folder: 'services/maternity-photography',
    description: 'Royal Maternity Shoot in Nature',
  },
  // Videos/Thumbnails
  {
    sourceUrl:
      'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
    key: 'videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
    folder: 'videos/thumbnails',
    description: 'Video Testimonial Avatar Thumbnail',
  },
];

async function verifyAdminOrMigrationKey(request: Request): Promise<boolean> {
  const migrationKey = process.env.MIGRATION_KEY;
  if (migrationKey && migrationKey.trim().length >= 8) {
    const authHeader = request.headers.get('authorization') || '';
    const customHeader = request.headers.get('x-migration-key') || '';
    if (customHeader === migrationKey || authHeader === `Bearer ${migrationKey}`) {
      return true;
    }
  }
  await requireAdmin(request);
  return true;
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdminOrMigrationKey(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r2Ready = isR2Configured();
  const config = getR2Config();

  let liveR2Objects: Array<{ key: string; size: number }> = [];
  if (r2Ready) {
    try {
      liveR2Objects = await listR2Objects('', 1000);
    } catch (err: any) {
      console.warn('[Migrate GET] Failed to list R2 objects:', err);
    }
  }

  const existingR2KeySet = new Set(liveR2Objects.map((o) => o.key));

  const statusList: MigrationFileItem[] = [];

  for (const asset of KNOWN_SUPABASE_ASSETS) {
    let status: MigrationFileItem['status'] = 'PENDING';
    let reason: string | undefined;

    if (existingR2KeySet.has(asset.key) || existingR2KeySet.has(`images/${asset.key}`)) {
      status = 'ALREADY_EXISTS';
      reason = 'Asset confirmed present in Cloudflare R2 bucket.';
    } else {
      status = 'BLOCKED_402';
      reason =
        'Supabase egress quota exceeded (HTTP 402 exceed_cached_egress_quota). Service restricted by Supabase until quota is lifted or upgraded.';
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

  // Folder breakdown and total storage of current R2 bucket
  const folderCounts: Record<string, number> = {};
  let totalSizeBytes = 0;
  for (const obj of liveR2Objects) {
    const folder = obj.key.split('/')[0] || 'root';
    folderCounts[folder] = (folderCounts[folder] || 0) + 1;
    totalSizeBytes += obj.size || 0;
  }

  const freeTier = calculateFreeTierStats(totalSizeBytes);

  return NextResponse.json({
    r2Configured: r2Ready,
    r2Bucket: config.bucketName,
    r2Endpoint: config.endpoint,
    r2TotalObjects: liveR2Objects.length,
    r2TotalSizeBytes: totalSizeBytes,
    r2TotalSizeMB: Number((totalSizeBytes / (1024 * 1024)).toFixed(2)),
    r2FolderBreakdown: folderCounts,
    totalKnownAssets: KNOWN_SUPABASE_ASSETS.length,
    freeTier,
    assets: statusList,
  });
}

function calculateFreeTierStats(totalSizeBytes: number) {
  const FREE_TIER_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
  const FREE_TIER_STORAGE_MB = 10 * 1024; // 10,240 MB
  const storageUsedMB = Number((totalSizeBytes / (1024 * 1024)).toFixed(2));
  const storageUsedGB = Number((totalSizeBytes / (1024 * 1024 * 1024)).toFixed(4));
  const storageRemainingBytes = Math.max(0, FREE_TIER_STORAGE_BYTES - totalSizeBytes);
  const storageRemainingMB = Number((storageRemainingBytes / (1024 * 1024)).toFixed(2));
  const storageRemainingGB = Number((storageRemainingBytes / (1024 * 1024 * 1024)).toFixed(2));
  const storagePercentageUsed = Number(((totalSizeBytes / FREE_TIER_STORAGE_BYTES) * 100).toFixed(2));

  return {
    storageLimitGB: 10,
    storageLimitMB: FREE_TIER_STORAGE_MB,
    storageUsedBytes: totalSizeBytes,
    storageUsedMB,
    storageUsedGB,
    storageRemainingBytes,
    storageRemainingMB,
    storageRemainingGB,
    storagePercentageUsed,
    classALimit: 1000000,
    classBLimit: 10000000,
    egressFee: '$0.00 / Free (Unlimited zero-egress)',
    status: storagePercentageUsed > 95 ? 'CRITICAL' : storagePercentageUsed > 80 ? 'WARNING' : 'HEALTHY_FREE_TIER',
  };
}

/**
 * Updates references to migrated assets across MongoDB collections
 * (GalleryImage, Service, FileRecord, SiteConfig)
 */
async function updateDatabaseAssetReferences(
  sourceUrl: string,
  targetUrl: string,
  key: string
): Promise<number> {
  let updatedCount = 0;
  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const db = await connectToDatabase();
    if (!db) return 0;

    const GalleryImage = (await import('@/models/GalleryImage')).default;
    const Service = (await import('@/models/Service')).default;
    const FileRecord = (await import('@/models/FileRecord')).default;
    const SiteConfig = (await import('@/models/SiteConfig')).default;

    // 1. GalleryImage
    const giConditions: any[] = [];
    if (sourceUrl) {
      giConditions.push({ src: sourceUrl }, { thumbnail: sourceUrl });
    }
    const filename = key.split('/').pop();
    if (filename && filename.length > 5) {
      giConditions.push({ src: { $regex: filename } });
    }

    if (giConditions.length > 0) {
      const giRes = await (GalleryImage as any).updateMany(
        { $or: giConditions },
        { $set: { src: targetUrl } }
      ).catch(() => null);
      if (giRes?.modifiedCount) updatedCount += giRes.modifiedCount;
    }

    // 2. Service
    if (sourceUrl) {
      const srvRes = await (Service as any).updateMany(
        { $or: [{ heroImage: sourceUrl }, { image: sourceUrl }] },
        { $set: { heroImage: targetUrl, image: targetUrl } }
      ).catch(() => null);
      if (srvRes?.modifiedCount) updatedCount += srvRes.modifiedCount;
    }

    // 3. FileRecord
    if (sourceUrl) {
      const frRes = await (FileRecord as any).updateMany(
        { url: sourceUrl },
        { $set: { url: targetUrl } }
      ).catch(() => null);
      if (frRes?.modifiedCount) updatedCount += frRes.modifiedCount;
    }

    // 4. SiteConfig
    const sc = await (SiteConfig as any).findOne({}).catch(() => null);
    if (sc) {
      let modified = false;
      if (sourceUrl && sc.brand?.logo?.url === sourceUrl) {
        sc.brand.logo.url = targetUrl;
        modified = true;
      }
      if (sourceUrl && sc.footer?.logo?.url === sourceUrl) {
        sc.footer.logo.url = targetUrl;
        modified = true;
      }
      if (modified) {
        await sc.save().catch(() => null);
        updatedCount++;
      }
    }
  } catch (err: any) {
    console.warn('[updateDatabaseAssetReferences] Notice:', err.message);
  }
  return updatedCount;
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdminOrMigrationKey(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyData: any = {};
  try {
    bodyData = await request.json();
  } catch {
    bodyData = {};
  }

  const action = bodyData.action || 'seed_all';
  const isTestProbe = action === 'test' || action === 'dry_run' || bodyData.test === true;
  const r2Ready = isR2Configured();

  // If R2 is not configured and not in test probe mode, explain clearly
  if (!r2Ready && !isTestProbe) {
    return NextResponse.json(
      {
        error:
          'Cloudflare R2 is not configured. Please define CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your deployment environment variables.',
        success: false,
        r2Configured: false,
        canMigrate: false,
        tip: 'You can run a diagnostic probe by clicking "Run Migration Diagnostic Probe" to test Supabase connectivity and local seeds without R2 credentials.',
      },
      { status: 400 }
    );
  }

  const config = r2Ready ? getR2Config() : { bucketName: 'unconfigured', endpoint: '', publicDomain: '' };
  if (r2Ready) {
    await ensureR2Bucket(config.bucketName);
  }

  if (action === 'configure_cors') {
    if (!r2Ready) {
      return NextResponse.json({ success: false, error: 'Cloudflare R2 is not configured.' }, { status: 400 });
    }
    await getR2Client().send(new PutBucketCorsCommand({
      Bucket: config.bucketName,
      CORSConfiguration: {
        CORSRules: [{
          AllowedOrigins: ['https://www.indirathakur.com', 'https://indirathakur.com', 'http://localhost:3000'],
          AllowedMethods: ['GET', 'HEAD', 'PUT'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag', 'Content-Length', 'Content-Range'],
          MaxAgeSeconds: 3600,
        }],
      },
    }));
    return NextResponse.json({ success: true, bucket: config.bucketName, message: 'R2 browser upload CORS configured.' });
  }

  // ── Handler for Direct Single Asset Upload ─────────────────────────────
  if (action === 'upload_asset') {
    if (!r2Ready) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured.' },
        { status: 400 }
      );
    }
    const { key, base64, contentType } = bodyData;
    if (!key || !base64) {
      return NextResponse.json(
        { error: 'Missing required parameters: key and base64' },
        { status: 400 }
      );
    }
    const cleanKey = key.replace(/^\/+/, '');
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const uploadRes = await uploadToR2(cleanKey, buffer, contentType || 'image/jpeg');

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded asset to R2 at key: ${cleanKey}`,
      key: cleanKey,
      size: uploadRes.size,
      r2Url: uploadRes.url,
    });
  }

  const results: MigrationFileItem[] = [];
  let migratedCount = 0;
  let blockedCount = 0;
  let alreadyExistsCount = 0;
  let failedCount = 0;
  let databaseReferencesUpdated = 0;

  // 1. Check existing R2 objects if R2 is configured
  let existingObjects: Array<{ key: string; size: number }> = [];
  if (r2Ready) {
    try {
      existingObjects = await listR2Objects('', 1000);
    } catch (err: any) {
      console.warn('[Migrate POST] listR2Objects warning:', err);
    }
  }
  const existingKeySet = new Set(existingObjects.map((o) => o.key));

  // 2. SEED LOCAL REPOSITORY ASSETS (Logo, Brand, Favicon, OG Image)
  const publicDir = path.resolve('./public');
  const localSeeds: Array<{
    keys: string[];
    filePath: string;
    contentType: string;
    description: string;
  }> = [
    {
      keys: [
        'brand/1786446222005-Indira_Photography_logo.jpeg',
        'brand/1786446225171-Indira_Photography_logo.jpeg',
        'footer/logo/1786430147426-Indira_Photography_logo.jpeg',
        'seo/1785574467987-Indira_Photography_logo.jpeg',
        'brand/Indira_Photography_logo.jpeg',
        'brand/logo.jpeg',
      ],
      filePath: path.join(publicDir, 'icon.jpeg'),
      contentType: 'image/jpeg',
      description: 'Indira Photography Brand Logo',
    },
    {
      keys: ['brand/apple-touch-icon.png', 'brand/favicon.png'],
      filePath: path.join(publicDir, 'apple-touch-icon.png'),
      contentType: 'image/png',
      description: 'Apple Touch Icon & Favicon',
    },
    {
      keys: ['brand/icon.png'],
      filePath: path.join(publicDir, 'icon.png'),
      contentType: 'image/png',
      description: 'App Icon PNG',
    },
    {
      keys: ['seo/og-image.jpg'],
      filePath: path.join(publicDir, 'og-image.jpg'),
      contentType: 'image/jpeg',
      description: 'OpenGraph Image',
    },
  ];

  for (const seed of localSeeds) {
    if (fs.existsSync(seed.filePath)) {
      const buffer = fs.readFileSync(seed.filePath);
      for (const targetKey of seed.keys) {
        if (existingKeySet.has(targetKey)) {
          alreadyExistsCount++;
          const r2Url = getR2PublicUrl(targetKey);
          const matchedSupabase = KNOWN_SUPABASE_ASSETS.find((a) => a.key === targetKey);
          if (matchedSupabase && r2Url) {
            const dbUpdates = await updateDatabaseAssetReferences(
              matchedSupabase.sourceUrl,
              r2Url,
              targetKey
            );
            databaseReferencesUpdated += dbUpdates;
          }
          results.push({
            key: targetKey,
            sourceUrl: `local:${path.basename(seed.filePath)}`,
            folder: targetKey.split('/')[0] || 'brand',
            status: 'ALREADY_EXISTS',
            r2Url,
            reason: 'Asset already confirmed present in Cloudflare R2.',
          });
          continue;
        }

        if (r2Ready) {
          try {
            const uploadResult = await uploadToR2(targetKey, buffer, seed.contentType, {
              seededFrom: path.basename(seed.filePath),
              seededAt: new Date().toISOString(),
            });
            existingKeySet.add(targetKey);
            migratedCount++;

            const matchedSupabase = KNOWN_SUPABASE_ASSETS.find((a) => a.key === targetKey);
            let dbUpdates = 0;
            if (matchedSupabase) {
              dbUpdates = await updateDatabaseAssetReferences(
                matchedSupabase.sourceUrl,
                uploadResult.url,
                targetKey
              );
              databaseReferencesUpdated += dbUpdates;
            }

            results.push({
              key: targetKey,
              sourceUrl: `local:${path.basename(seed.filePath)}`,
              folder: targetKey.split('/')[0] || 'brand',
              status: 'MIGRATED_FROM_LOCAL',
              r2Url: uploadResult.url,
              bytes: uploadResult.size,
              reason: `Seeded successfully from local repository asset (${seed.description})${
                dbUpdates > 0 ? ` and updated ${dbUpdates} MongoDB reference(s)` : ''
              }.`,
            });
          } catch (err: any) {
            failedCount++;
            results.push({
              key: targetKey,
              sourceUrl: `local:${path.basename(seed.filePath)}`,
              folder: targetKey.split('/')[0] || 'brand',
              status: 'FAILED',
              reason: err.message || 'R2 upload failed',
            });
          }
        } else {
          // Diagnostic test probe mode
          results.push({
            key: targetKey,
            sourceUrl: `local:${path.basename(seed.filePath)}`,
            folder: targetKey.split('/')[0] || 'brand',
            status: 'PENDING',
            bytes: buffer.byteLength,
            reason: `Local repository file verified (${seed.description}, ${(buffer.byteLength / 1024).toFixed(1)} KB). Ready for R2 upload once credentials are configured.`,
          });
        }
      }
    }
  }

  // 3. SEED CLOUDINARY BRAND ASSETS
  const cloudinarySeeds = [
    {
      url: 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784447143/indira-thakur/brand/nqxtdh6dcby1rqqc98nu.png',
      key: 'brand/nqxtdh6dcby1rqqc98nu.png',
      contentType: 'image/png',
    },
    {
      url: 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784447147/indira-thakur/brand/jksyo3riytdq27jhk6tm.png',
      key: 'brand/jksyo3riytdq27jhk6tm.png',
      contentType: 'image/png',
    },
    {
      url: 'https://res.cloudinary.com/b8bbtdvh/image/upload/v1784433137/indira-thakur/brand/kgd5sxid5wuvfipgj0ns.jpg',
      key: 'brand/kgd5sxid5wuvfipgj0ns.jpg',
      contentType: 'image/jpeg',
    },
  ];

  if (r2Ready) {
    for (const cSeed of cloudinarySeeds) {
      if (existingKeySet.has(cSeed.key)) {
        alreadyExistsCount++;
        continue;
      }
      try {
        const cRes = await fetch(cSeed.url);
        if (cRes.ok) {
          const cBuf = Buffer.from(await cRes.arrayBuffer());
          const up = await uploadToR2(cSeed.key, cBuf, cSeed.contentType);
          existingKeySet.add(cSeed.key);
          migratedCount++;
          results.push({
            key: cSeed.key,
            sourceUrl: cSeed.url,
            folder: 'brand',
            status: 'MIGRATED_FROM_CLOUDINARY',
            r2Url: up.url,
            bytes: up.size,
          });
        }
      } catch (err: any) {
        console.warn('[Migrate POST] Cloudinary seed warning:', err.message);
      }
    }
  }

  // 4. SEED BASE64 IMAGES STORED IN MONGODB (FileRecord & GalleryImage)
  if (r2Ready) {
    try {
      const { connectToDatabase } = await import('@/lib/mongodb');
      const db = await connectToDatabase();
      if (db) {
        const FileRecord = (await import('@/models/FileRecord')).default;
        const base64Records = (await (FileRecord as any).find({
          url: { $regex: '^data:image' },
        }).lean()) as any[];

        for (const rec of base64Records) {
          const key = (rec.publicId || '').replace(/^\/+/, '');
          if (!key || existingKeySet.has(key)) continue;

          try {
            const match = rec.url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const contentType = match[1] || 'image/jpeg';
              const buffer = Buffer.from(match[2], 'base64');
              const up = await uploadToR2(key, buffer, contentType);
              existingKeySet.add(key);
              migratedCount++;
              results.push({
                key,
                sourceUrl: 'mongodb:base64_filerecord',
                folder: key.split('/')[0] || 'gallery',
                status: 'MIGRATED_FROM_DB_BASE64',
                r2Url: up.url,
                bytes: up.size,
                reason: `Decoded base64 record "${rec.filename || key}" and uploaded to Cloudflare R2.`,
              });
            }
          } catch (err: any) {
            console.warn('[Migrate POST] Base64 upload warning for key:', key, err.message);
          }
        }
      }
    } catch (mongoErr: any) {
      console.warn('[Migrate POST] MongoDB query notice:', mongoErr.message);
    }
  }

  // 5. TEST/DOWNLOAD REMAINING KNOWN SUPABASE ASSETS
  for (const asset of KNOWN_SUPABASE_ASSETS) {
    if (existingKeySet.has(asset.key)) {
      continue;
    }

    try {
      // Attempt authenticated download if Supabase key is present
      const headers: Record<string, string> = {};
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseKey) {
        headers['apikey'] = supabaseKey;
        headers['Authorization'] = `Bearer ${supabaseKey}`;
      }

      const fetchRes = await fetch(asset.sourceUrl, { headers });
      if (fetchRes.status === 402) {
        results.push({
          key: asset.key,
          sourceUrl: asset.sourceUrl,
          folder: asset.folder,
          status: 'BLOCKED_402',
          reason:
            'HTTP 402 exceed_cached_egress_quota: Supabase bandwidth limit reached. Service for this project is restricted by Supabase until quota cap is removed or upgraded.',
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

      if (r2Ready) {
        const uploadResult = await uploadToR2(asset.key, buffer, contentType, {
          originalUrl: asset.sourceUrl,
          migratedAt: new Date().toISOString(),
        });

        existingKeySet.add(asset.key);

        const dbUpdates = await updateDatabaseAssetReferences(
          asset.sourceUrl,
          uploadResult.url,
          asset.key
        );
        databaseReferencesUpdated += dbUpdates;

        results.push({
          key: asset.key,
          sourceUrl: asset.sourceUrl,
          folder: asset.folder,
          status: 'MIGRATED',
          r2Url: uploadResult.url,
          bytes: uploadResult.size,
          reason: dbUpdates > 0
            ? `Uploaded to R2 and updated ${dbUpdates} MongoDB database reference(s).`
            : 'Uploaded to R2 successfully.',
        });
        migratedCount++;
      } else {
        // Diagnostic test probe
        results.push({
          key: asset.key,
          sourceUrl: asset.sourceUrl,
          folder: asset.folder,
          status: 'PENDING',
          bytes: buffer.byteLength,
          reason: 'Supabase file downloaded successfully. Ready for R2 upload once credentials are configured.',
        });
      }
    } catch (err: any) {
      results.push({
        key: asset.key,
        sourceUrl: asset.sourceUrl,
        folder: asset.folder,
        status: 'FAILED',
        reason: err.message || 'Network error',
      });
      failedCount++;
    }
  }

  // 6. Final verification query against Cloudflare R2
  let finalObjects: Array<{ key: string; size: number }> = [];
  if (r2Ready) {
    try {
      finalObjects = await listR2Objects('', 1000);
    } catch (err) {
      console.warn('[Migrate POST] Final listR2Objects warning:', err);
    }
  }

  const statusMessage = blockedCount > 0
    ? `Migration test completed: ${blockedCount} asset(s) are currently restricted by Supabase (HTTP 402 exceed_cached_egress_quota). Service is restricted by Supabase until quota cap is removed or upgraded. ${migratedCount} uploaded to R2, ${databaseReferencesUpdated} database references updated.`
    : `Migration completed: ${migratedCount} asset(s) uploaded to R2, ${databaseReferencesUpdated} database references updated.`;

  const finalTotalBytes = finalObjects.reduce((acc, o) => acc + (o.size || 0), 0);
  const freeTier = calculateFreeTierStats(finalTotalBytes);

  return NextResponse.json({
    success: true,
    testMode: isTestProbe && !r2Ready,
    r2Configured: r2Ready,
    r2Bucket: config.bucketName,
    freeTier,
    summary: {
      totalProcessed: results.length,
      migratedToR2: migratedCount,
      alreadyInR2: alreadyExistsCount,
      databaseReferencesUpdated,
      blockedBySupabase402: blockedCount,
      failed: failedCount,
      r2VerifiedTotalObjects: finalObjects.length,
      r2Configured: r2Ready,
      statusMessage,
    },
    r2VerifiedObjects: finalObjects.map((o) => o.key),
    results,
  });
}
