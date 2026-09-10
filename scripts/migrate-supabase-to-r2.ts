/**
 * CLI Migration Script: Supabase Storage to Cloudflare R2
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
import { HeadObjectCommand } from '@aws-sdk/client-s3';

async function checkObjectExistsInR2(bucket: string, key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err: any) {
    return false;
  }
}

async function main() {
  console.log('=== Indira Thakur Photography: Supabase to Cloudflare R2 Migration ===\n');

  const config = getR2Config();
  console.log(`Target Bucket: ${config.bucketName}`);
  console.log(`Endpoint:      ${config.endpoint || '(not configured)'}`);
  console.log(`Public Domain: ${config.publicDomain || 'App streaming proxy (/api/media/*)'}`);
  console.log(`R2 Configured: ${isR2Configured() ? 'YES' : 'NO'}\n`);

  if (!isR2Configured()) {
    console.warn(
      'WARNING: Cloudflare R2 environment variables are missing.\n' +
      'Please ensure the following are set in Vercel or your local environment:\n' +
      '  - CLOUDFLARE_ACCOUNT_ID (8c0455df5bb293bd6d714f53966d4051)\n' +
      '  - R2_ACCESS_KEY_ID\n' +
      '  - R2_SECRET_ACCESS_KEY\n' +
      '  - R2_BUCKET_NAME (indira-thakur-media)\n'
    );
  } else {
    await ensureR2Bucket(config.bucketName);
  }

  console.log(`Auditing ${KNOWN_SUPABASE_ASSETS.length} known Supabase media assets...\n`);

  let alreadyExistsCount = 0;
  let blockedCount = 0;
  let migratedCount = 0;
  let failedCount = 0;

  for (const asset of KNOWN_SUPABASE_ASSETS) {
    process.stdout.write(`[${asset.folder}] ${asset.key} ... `);

    // 1. Idempotency Check: Skip if already exists in R2
    if (isR2Configured()) {
      const exists = await checkObjectExistsInR2(config.bucketName, asset.key);
      if (exists) {
        console.log('ALREADY IN R2 (Skipped)');
        alreadyExistsCount++;
        continue;
      }
    }

    // 2. Fetch and transfer with up to 2 retries
    let attempts = 0;
    let success = false;

    while (attempts < 2 && !success) {
      attempts++;
      try {
        const res = await fetch(asset.sourceUrl);
        if (res.status === 402) {
          console.log('BLOCKED (HTTP 402 exceed_cached_egress_quota)');
          blockedCount++;
          success = true; // Handled
          break;
        }

        if (!res.ok) {
          if (attempts < 2) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          console.log(`FAILED (HTTP ${res.status})`);
          failedCount++;
          break;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || 'image/jpeg';

        if (isR2Configured()) {
          const up = await uploadToR2(asset.key, buffer, contentType);
          console.log(`MIGRATED -> ${up.url}`);
          migratedCount++;
        } else {
          console.log(`DOWNLOADED (${buffer.length} bytes) - R2 not configured`);
        }
        success = true;
      } catch (err: any) {
        if (attempts < 2) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        console.log(`ERROR: ${err.message}`);
        failedCount++;
      }
    }
  }

  console.log('\n=== Final Migration Report ===');
  console.log(`Total Assets Audited:          ${KNOWN_SUPABASE_ASSETS.length}`);
  console.log(`Already Present in R2:         ${alreadyExistsCount}`);
  console.log(`Newly Migrated to R2:          ${migratedCount}`);
  console.log(`Blocked by Supabase HTTP 402:  ${blockedCount}`);
  console.log(`Other Network Failures:        ${failedCount}`);

  if (blockedCount > 0) {
    console.log('\nSupabase Egress Note:');
    console.log('Supabase project has exceeded its cached egress quota (HTTP 402).');
    console.log('The assets in Supabase storage remain preserved and uncorrupted.');
    console.log('Once credentials R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are added to Vercel,');
    console.log('all new uploads and media serving are handled directly through Cloudflare R2.');
  }
}

main().catch(console.error);
