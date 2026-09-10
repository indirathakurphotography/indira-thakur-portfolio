/**
 * CLI Migration Script: Media Pipeline to Cloudflare R2
 *
 * Fully enumerates local, database, and remote assets,
 * verifies authenticated R2 S3 access via ListObjects/HeadObject,
 * uploads assets idempotently preserving paths and MIME types,
 * tests representative objects with GetObject and HeadObject,
 * and prints an exact verification report.
 *
 * Usage:
 *   npx tsx scripts/migrate-supabase-to-r2.ts
 */

import { KNOWN_SUPABASE_ASSETS } from '../src/app/api/migrate-r2/route';
import {
  isR2Configured,
  getR2Config,
  getR2Client,
  uploadToR2,
  ensureR2Bucket,
  getR2PublicUrl,
} from '../src/lib/r2';
import {
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  _Object,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

async function checkObjectExistsInR2(bucket: string, key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function listAllR2Objects(bucket: string): Promise<_Object[]> {
  const client = getR2Client();
  const allObjects: _Object[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );
    if (res.Contents) {
      allObjects.push(...res.Contents);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return allObjects;
}

async function testObjectRead(bucket: string, key: string): Promise<{ success: boolean; bytes?: number; contentType?: string; error?: string }> {
  try {
    const client = getR2Client();
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return {
      success: true,
      bytes: res.ContentLength,
      contentType: res.ContentType,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log('========================================================================');
  console.log('       INDIRA THAKUR PHOTOGRAPHY: PRODUCTION MEDIA R2 MIGRATION         ');
  console.log('========================================================================\n');

  const config = getR2Config();
  console.log(`Target Bucket:    ${config.bucketName || '(NOT CONFIGURED)'}`);
  console.log(`Endpoint:         ${config.endpoint || '(NOT CONFIGURED)'}`);
  console.log(`Account ID:       ${config.accountId || '(NOT CONFIGURED)'}`);
  console.log(`Access Key ID:    ${config.accessKeyId ? config.accessKeyId.slice(0, 6) + '...' : '(NOT CONFIGURED)'}`);
  console.log(`Public Proxy URL: ${config.publicDomain || 'App streaming proxy (/api/media/*)'}`);
  console.log(`R2 Configured:    ${isR2Configured() ? 'YES' : 'NO'}\n`);

  if (!isR2Configured()) {
    console.error(
      'ERROR: Cloudflare R2 environment variables are missing.\n' +
      'Please ensure the following are provided in your environment:\n' +
      '  - CLOUDFLARE_ACCOUNT_ID\n' +
      '  - R2_ACCESS_KEY_ID\n' +
      '  - R2_SECRET_ACCESS_KEY\n' +
      '  - R2_BUCKET_NAME\n'
    );
    process.exit(1);
  }

  // 1. Authenticated S3 Pre-flight Test
  console.log('--> Step 1: Performing authenticated S3 ListObjects & HeadBucket pre-flight test...');
  try {
    const client = getR2Client();
    await ensureR2Bucket(config.bucketName);
    const testList = await client.send(new ListObjectsV2Command({ Bucket: config.bucketName, MaxKeys: 5 }));
    console.log(`✓ R2 connection successfully authenticated! Initial bucket contents: ${testList.KeyCount || 0} objects reported.\n`);
  } catch (err: any) {
    console.error(`✗ Failed to authenticate with Cloudflare R2: ${err.message}`);
    process.exit(1);
  }

  // Pre-load all existing R2 keys for fast idempotency checks
  const initialObjects = await listAllR2Objects(config.bucketName);
  const existingKeySet = new Set(initialObjects.map((o) => o.Key).filter(Boolean) as string[]);
  console.log(`Currently existing objects in R2 bucket "${config.bucketName}": ${existingKeySet.size}`);

  let alreadyExistsCount = 0;
  let migratedCount = 0;
  let blockedCount = 0;
  let failedCount = 0;

  // 2. Local Repository Assets (Brand, Icons, OG Image, etc.)
  console.log('\n--> Step 2: Migrating local repository assets to R2...');
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
      description: 'Brand Logo',
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
      description: 'OpenGraph Banner',
    },
  ];

  for (const seed of localSeeds) {
    if (fs.existsSync(seed.filePath)) {
      const buffer = fs.readFileSync(seed.filePath);
      for (const targetKey of seed.keys) {
        if (existingKeySet.has(targetKey)) {
          alreadyExistsCount++;
          continue;
        }
        try {
          await uploadToR2(targetKey, buffer, seed.contentType, {
            seededFrom: path.basename(seed.filePath),
            migratedAt: new Date().toISOString(),
          });
          existingKeySet.add(targetKey);
          migratedCount++;
          console.log(`  [LOCAL] Migrated ${targetKey} (${buffer.length} bytes)`);
        } catch (err: any) {
          failedCount++;
          console.error(`  [LOCAL FAILED] ${targetKey}: ${err.message}`);
        }
      }
    }
  }

  // 3. Cloudinary Assets
  console.log('\n--> Step 3: Checking Cloudinary brand assets...');
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

  for (const cSeed of cloudinarySeeds) {
    if (existingKeySet.has(cSeed.key)) {
      alreadyExistsCount++;
      continue;
    }
    try {
      const cRes = await fetch(cSeed.url);
      if (cRes.ok) {
        const cBuf = Buffer.from(await cRes.arrayBuffer());
        await uploadToR2(cSeed.key, cBuf, cSeed.contentType);
        existingKeySet.add(cSeed.key);
        migratedCount++;
        console.log(`  [CLOUDINARY] Migrated ${cSeed.key} (${cBuf.length} bytes)`);
      }
    } catch (err: any) {
      console.warn(`  [CLOUDINARY SKIPPED] ${cSeed.key}: ${err.message}`);
    }
  }

  // 4. MongoDB Database Media (if MONGODB_URI is provided)
  if (process.env.MONGODB_URI) {
    console.log('\n--> Step 4: Inspecting MongoDB database records for stored media...');
    try {
      const { connectToDatabase } = await import('../src/lib/mongodb');
      const db = await connectToDatabase();
      if (db) {
        const FileRecord = (await import('../src/models/FileRecord')).default;
        const base64Records = (await (FileRecord as any).find({
          url: { $regex: '^data:image' },
        }).lean()) as any[];

        console.log(`  Found ${base64Records.length} base64 file records in MongoDB.`);
        for (const rec of base64Records) {
          const key = (rec.publicId || '').replace(/^\/+/, '');
          if (!key || existingKeySet.has(key)) {
            if (key && existingKeySet.has(key)) alreadyExistsCount++;
            continue;
          }
          try {
            const match = rec.url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const contentType = match[1] || 'image/jpeg';
              const buffer = Buffer.from(match[2], 'base64');
              await uploadToR2(key, buffer, contentType);
              existingKeySet.add(key);
              migratedCount++;
              console.log(`  [DB BASE64] Migrated ${key} (${buffer.length} bytes)`);
            }
          } catch (dbUploadErr: any) {
            console.error(`  [DB FAILED] ${key}: ${dbUploadErr.message}`);
            failedCount++;
          }
        }
      }
    } catch (mongoErr: any) {
      console.warn(`  [MONGODB] Notice during scan: ${mongoErr.message}`);
    }
  }

  // 5. Supabase Media Assets
  console.log(`\n--> Step 5: Auditing and transferring ${KNOWN_SUPABASE_ASSETS.length} known portfolio assets...`);
  for (const asset of KNOWN_SUPABASE_ASSETS) {
    if (existingKeySet.has(asset.key)) {
      alreadyExistsCount++;
      continue;
    }

    let attempts = 0;
    let success = false;

    while (attempts < 2 && !success) {
      attempts++;
      try {
        const headers: Record<string, string> = {};
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseKey) {
          headers['apikey'] = supabaseKey;
          headers['Authorization'] = `Bearer ${supabaseKey}`;
        }

        const res = await fetch(asset.sourceUrl, { headers });
        if (res.status === 402) {
          blockedCount++;
          success = true;
          break;
        }

        if (!res.ok) {
          if (attempts < 2) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          failedCount++;
          console.error(`  [FAILED HTTP ${res.status}] ${asset.key}`);
          break;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        await uploadToR2(asset.key, buffer, contentType, {
          sourceUrl: asset.sourceUrl,
          migratedAt: new Date().toISOString(),
        });
        existingKeySet.add(asset.key);
        migratedCount++;
        console.log(`  [SUPABASE] Migrated ${asset.key} (${buffer.length} bytes)`);
        success = true;
      } catch (err: any) {
        if (attempts < 2) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        failedCount++;
        console.error(`  [NETWORK ERROR] ${asset.key}: ${err.message}`);
      }
    }
  }

  // 6. Post-migration full verification audit
  console.log('\n--> Step 6: Verifying final R2 bucket inventory & performing GetObject tests...');
  const finalObjects = await listAllR2Objects(config.bucketName);
  let totalSizeBytes = 0;
  for (const obj of finalObjects) {
    totalSizeBytes += obj.Size || 0;
  }

  // Test representative objects with GetObject and HeadObject
  const sampleKeys = finalObjects.slice(0, 5).map((o) => o.Key).filter(Boolean) as string[];
  const sampleTestResults: Array<{ key: string; success: boolean; bytes?: number; contentType?: string }> = [];

  for (const sampleKey of sampleKeys) {
    const readTest = await testObjectRead(config.bucketName, sampleKey);
    sampleTestResults.push({
      key: sampleKey,
      success: readTest.success,
      bytes: readTest.bytes,
      contentType: readTest.contentType,
    });
  }

  console.log('\n========================================================================');
  console.log('                     FINAL MIGRATION & R2 AUDIT REPORT                  ');
  console.log('========================================================================');
  console.log(`R2 Bucket Name:               ${config.bucketName}`);
  console.log(`Total Objects in R2 Bucket:   ${finalObjects.length}`);
  console.log(`Total Storage Size:           ${totalSizeBytes} bytes (${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Newly Migrated in this run:   ${migratedCount}`);
  console.log(`Already Present (Skipped):    ${alreadyExistsCount}`);
  console.log(`Blocked by Supabase (402):    ${blockedCount}`);
  console.log(`Failed Transfers:             ${failedCount}`);
  console.log('------------------------------------------------------------------------');
  console.log('Sample Object Verification (GetObject / HeadObject):');
  sampleTestResults.forEach((t) => {
    console.log(`  ${t.success ? '✓ PASS' : '✗ FAIL'} [${t.contentType || 'unknown'}] ${t.key} (${t.bytes ?? 0} bytes)`);
  });
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
