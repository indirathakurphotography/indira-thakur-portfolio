#!/usr/bin/env node
/**
 * Script to audit and restore the 17 gallery images that were previously linked to Google Drive
 * and ensure they are properly mapped to their corresponding Cloudflare R2 uploaded files.
 *
 * Usage:
 *   node scripts/restore-17-gallery-records.mjs
 *   BASE_URL=http://localhost:3000 node scripts/restore-17-gallery-records.mjs
 */

const BASE_URL = process.env.BASE_URL || 'https://www.indirathakur.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@indirathakur.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345678';

const RESTORE_ITEMS = [
  { cat: "events", order: 74, key: "gallery/1785145560816-IMG_1996.jpg", filename: "IMG_1996.jpg" },
  { cat: "events", order: 75, key: "gallery/1785145867568-IMG_1999.jpg", filename: "IMG_1999.jpg" },
  { cat: "portrait", order: 74, key: "gallery/1785146038536-IMG_2091__1_.jpg", filename: "IMG_2091__1_.jpg" },
  { cat: "portrait", order: 77, key: "gallery/1785146087537-IMG_2122__1_.jpg", filename: "IMG_2122__1_.jpg" },
  { cat: "portrait", order: 78, key: "gallery/1785146100810-IMG_2137__1_.jpg", filename: "IMG_2137__1_.jpg" },
  { cat: "maternity", order: 78, key: "gallery/1785160171037-17.jpg", filename: "17.jpg" },
  { cat: "maternity", order: 79, key: "gallery/1785146255500-IMG_7295_bw_copy.jpg", filename: "IMG_7295_bw_copy.jpg" },
  { cat: "maternity", order: 79, key: "gallery/1785146694508-IMG_8445_copy_bw.jpg", filename: "IMG_8445_copy_bw.jpg" },
  { cat: "newborn", order: 80, key: "gallery/1785142577860-20240801104123_IMG_8530.jpg", filename: "20240801104123_IMG_8530.jpg" },
  { cat: "newborn", order: 81, key: "gallery/1785142611133-20240801104732_IMG_8549.jpg", filename: "20240801104732_IMG_8549.jpg" },
  { cat: "weddings", order: 83, key: "gallery/1785146118165-IMG_6335_copy.jpg", filename: "IMG_6335_copy.jpg" },
  { cat: "weddings", order: 84, key: "gallery/1785146210271-IMG_7214_copy.jpg", filename: "IMG_7214_copy.jpg" },
  { cat: "weddings", order: 85, key: "gallery/1785146223597-IMG_7217_copy.jpg", filename: "IMG_7217_copy.jpg" },
  { cat: "weddings", order: 86, key: "gallery/1785146237950-IMG_7246_copy.jpg", filename: "IMG_7246_copy.jpg" },
  { cat: "weddings", order: 87, key: "gallery/1785146307746-IMG_7502_copy.jpg", filename: "IMG_7502_copy.jpg" },
  { cat: "weddings", order: 89, key: "gallery/1785146351341-IMG_7506_copy.jpg", filename: "IMG_7506_copy.jpg" },
  { cat: "weddings", order: 89, key: "gallery/1785146365550-IMG_7537_copy.jpg", filename: "IMG_7537_copy.jpg" },
  { cat: "weddings", order: 91, key: "gallery/1785146395717-IMG_7708_copy.jpg", filename: "IMG_7708_copy.jpg" }
];

async function getAdminToken() {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const data = await loginRes.json();
  return data.token;
}

async function run() {
  console.log('Fetching current gallery images...');
  const res = await fetch(`${BASE_URL}/api/gallery-images?limit=1000`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  const data = await res.json();
  const existingItems = data.items || [];
  const existingSrcs = new Set(existingItems.map((i) => i.src));

  let missing = [];
  for (const item of RESTORE_ITEMS) {
    const src = '/api/media/' + item.key;
    if (!existingSrcs.has(src)) {
      missing.push(item);
    }
  }

  console.log(`Total gallery images: ${existingItems.length}`);
  console.log(`Missing restored items: ${missing.length}`);

  if (missing.length === 0) {
    console.log('✅ All 17 items are already present in the gallery database.');
    return;
  }

  const token = await getAdminToken();
  for (const it of missing) {
    const src = '/api/media/' + it.key;
    const payload = {
      src,
      thumbnail: src,
      publicId: it.key,
      category: it.cat,
      title: '',
      alt: '',
      description: '',
      width: 800,
      height: 1000,
      featured: false,
      order: it.order,
    };

    const createRes = await fetch(`${BASE_URL}/api/gallery-images`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (createRes.ok) {
      const doc = await createRes.json();
      console.log(`✓ Restored ${it.cat} (${it.filename}) with ID: ${doc._id}`);
    } else {
      console.error(`✗ Failed to restore ${it.filename}:`, createRes.status, await createRes.text());
    }
  }
}

run().catch(console.error);
