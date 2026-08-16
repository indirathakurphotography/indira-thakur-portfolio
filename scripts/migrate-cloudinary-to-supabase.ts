/**
 * Migration script: downloads each image from Cloudinary,
 * uploads to Supabase, verifies success, updates MongoDB.
 *
 * Idempotent — safe to run multiple times. Supports resume via a state file.
 *
 * Usage:
 *   npx tsx scripts/migrate-cloudinary-to-supabase.ts
 *
 * Environment variables required (in .env.local or process env):
 *   MONGODB_URI, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import { fileURLToPath } from 'node:url';

// ── Config ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '.migrate-state.json');
const BATCH_SIZE = 5;         // concurrent uploads
const RETRY_LIMIT = 3;
const TIMEOUT_MS = 60_000;

// ── Bootstrap env ──────────────────────────────────────────────────────────

function loadEnv(): void {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!MONGODB_URI) throw new Error('MONGODB_URI is required');
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars required');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = 'images';

// ── State management ───────────────────────────────────────────────────────

interface MigrationState {
  completed: string[];    // MongoDB _ids that succeeded
  failed: Array<{ id: string; error: string }>;
  skipped: string[];      // already on Supabase
  inProgress: string[];   // _ids currently being processed
}

function readState(): MigrationState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { completed: [], failed: [], skipped: [], inProgress: [] };
  }
}

function saveState(state: MigrationState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// ── GalleryImage schema (inline, no path aliases) ─────────────────────────

const galleryImageSchema = new mongoose.Schema({
  src: String,
  publicId: String,
  alt: String,
  title: String,
  description: String,
  width: Number,
  height: Number,
  category: String,
  featured: Boolean,
  order: Number,
}, { timestamps: true });

const GalleryImage = mongoose.models.GalleryImage
  || mongoose.model('GalleryImage', galleryImageSchema);

// ── Helpers ────────────────────────────────────────────────────────────────

function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase') || url.includes('storage');
}

function extractFilenameFromCloudinaryUrl(url: string): string {
  try {
    const parts = url.split('/');
    const last = parts[parts.length - 1] || 'image';
    return last.split('?')[0];
  } catch {
    return `cloudinary-${Date.now()}.jpg`;
  }
}

async function downloadImage(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return { buffer, contentType };
}

async function uploadToSupabase(
  buffer: ArrayBuffer,
  filename: string,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const timestamp = Date.now();
  const ext = filename.split('.').pop() || 'jpg';
  const base = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
  const path = `${folder}/${timestamp}-${base}.${ext}`;

  const blob = new Blob([buffer], { type: 'image/jpeg' });

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, publicId: data.path };
}

async function verifyUpload(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15_000) });
    return res.ok;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Migrate one record ────────────────────────────────────────────────────

async function migrateRecord(
  doc: Record<string, unknown>,
  retries: number = RETRY_LIMIT,
): Promise<void> {
  const id = String(doc._id);
  const originalSrc = String(doc.src || '');

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  [${id.slice(-6)}] Downloading: ${originalSrc.substring(0, 100)}...`);
      const { buffer } = await downloadImage(originalSrc);

      const filename = extractFilenameFromCloudinaryUrl(originalSrc);
      console.log(`  [${id.slice(-6)}] Uploading to Supabase...`);
      const { url, publicId } = await uploadToSupabase(buffer, filename, 'gallery');

      console.log(`  [${id.slice(-6)}] Verifying upload...`);
      const verified = await verifyUpload(url);
      if (!verified) throw new Error('Upload verification failed — URL not accessible');

      console.log(`  [${id.slice(-6)}] Updating MongoDB...`);
      await GalleryImage.findByIdAndUpdate(id, {
        src: url,
        publicId,
      });

      console.log(`  [${id.slice(-6)}] SUCCESS → ${url.substring(0, 80)}...`);
      return;
    } catch (err: any) {
      lastError = err;
      console.error(`  [${id.slice(-6)}] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await sleep(2000 * attempt);
    }
  }

  throw lastError || new Error('Migration failed after retries');
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('Connected.');

  const state = readState();
  const processed = new Set([...state.completed, ...state.skipped]);

  const allRecords = await GalleryImage.find({}).sort({ order: 1, createdAt: -1 }).lean();
  console.log(`\nTotal records: ${allRecords.length}`);

  const toMigrate = allRecords.filter((doc: any) => {
    const src = String(doc.src || '');
    if (!src) return false;
    if (!isCloudinaryUrl(src)) return false;
    if (processed.has(String(doc._id))) return false;
    return true;
  });

  const alreadySupabase = allRecords.filter((doc: any) => isSupabaseUrl(String(doc.src || '')));
  const alreadyCloudinary = allRecords.filter((doc: any) => isCloudinaryUrl(String(doc.src || '')));

  console.log(`Already on Supabase: ${alreadySupabase.length}`);
  console.log(`Still on Cloudinary: ${alreadyCloudinary.length}`);
  console.log(`Already processed (from state): ${processed.size}`);
  console.log(`To migrate this run: ${toMigrate.length}`);

  if (toMigrate.length === 0) {
    console.log('\nNothing to migrate. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // Add in-progress markers
  for (const doc of toMigrate) {
    const id = String(doc._id);
    if (!state.inProgress.includes(id)) state.inProgress.push(id);
  }
  saveState(state);

  // Process in batches
  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = toMigrate.slice(i, i + BATCH_SIZE);
    console.log(`\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toMigrate.length / BATCH_SIZE)} ---`);

    const results = await Promise.allSettled(
      batch.map((doc) => migrateRecord(doc as any))
    );

    for (let j = 0; j < batch.length; j++) {
      const doc = batch[j];
      const id = String(doc._id);
      const result = results[j];

      // Remove from in-progress
      const idx = state.inProgress.indexOf(id);
      if (idx !== -1) state.inProgress.splice(idx, 1);

      if (result.status === 'fulfilled') {
        state.completed.push(id);
        migrated++;
      } else {
        state.failed.push({ id, error: result.reason?.message || 'Unknown error' });
        failed++;
      }
    }

    saveState(state);
    console.log(`Progress: ${migrated} succeeded, ${failed} failed, ${toMigrate.length - migrated - failed} remaining`);

    if (i + BATCH_SIZE < toMigrate.length) {
      console.log('Waiting 2 seconds before next batch...');
      await sleep(2000);
    }
  }

  // Mark in-progress items that weren't completed as failed
  for (const id of state.inProgress) {
    state.failed.push({ id, error: 'Interrupted before completion' });
  }
  state.inProgress = [];
  saveState(state);

  console.log('\n========================================');
  console.log('Migration complete!');
  console.log(`  Total records: ${allRecords.length}`);
  console.log(`  Already on Supabase: ${alreadySupabase.length}`);
  console.log(`  Migrated this run: ${migrated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total Supabase: ${alreadySupabase.length + state.completed.length}`);
  console.log(`  State file: ${STATE_FILE}`);
  console.log('========================================');
  console.log('\nTo retry failures, fix the issues and re-run the script.');
  console.log('It will skip already-completed and already-Supabase records.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
