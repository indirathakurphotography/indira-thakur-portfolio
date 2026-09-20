#!/usr/bin/env node

/**
 * Gallery Image Health Audit & Cleanup Tool
 * 
 * Audits all gallery images to verify:
 * 1. HTTP 200 response
 * 2. Proper image content-type (image/jpeg, image/webp, etc.)
 * 3. Identifies non-image responses (e.g. Google Drive sign-in HTML pages, 404s)
 * 
 * Usage:
 *   node scripts/audit-and-clean-gallery.mjs
 *   node scripts/audit-and-clean-gallery.mjs --clean
 *   BASE_URL=http://localhost:3000 node scripts/audit-and-clean-gallery.mjs
 */

import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.indirathakur.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@indirathakur.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345678';
const shouldClean = process.argv.includes('--clean');

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

async function auditGallery() {
  console.log(`\n========================================`);
  console.log(`🔍 Auditing Gallery Images on ${BASE_URL}`);
  console.log(`========================================\n`);

  const galleryRes = await fetch(`${BASE_URL}/api/gallery-images?limit=1000`, {
    headers: { 'Cache-Control': 'no-cache' },
  });

  if (!galleryRes.ok) {
    throw new Error(`Failed to fetch gallery images: ${galleryRes.status}`);
  }

  const { items = [] } = await galleryRes.json();
  console.log(`Found ${items.length} public gallery items to inspect...\n`);

  const results = [];
  const chunkSize = 15;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (item, idx) => {
        const rawSrc = item.src || '';
        const fullUrl = rawSrc.startsWith('http')
          ? rawSrc
          : `${BASE_URL}${rawSrc.startsWith('/') ? '' : '/'}${rawSrc}`;

        let status = 0;
        let contentType = '';
        let ok = false;
        let error = null;

        try {
          const res = await fetch(fullUrl, { method: 'HEAD', redirect: 'follow' });
          status = res.status;
          contentType = res.headers.get('content-type') || '';
          ok = res.ok && contentType.startsWith('image/');
        } catch (e) {
          error = e.message;
        }

        return {
          id: item._id || item.id,
          category: item.category,
          title: item.title,
          src: rawSrc,
          status,
          contentType,
          ok,
          error,
        };
      })
    );
    results.push(...chunkResults);
    process.stdout.write(`Checked ${results.length}/${items.length} images...\r`);
  }

  console.log(`\n\nAudit Results Summary:`);
  console.log(`----------------------------------------`);
  const healthy = results.filter((r) => r.ok);
  const broken = results.filter((r) => !r.ok);

  console.log(`✅ Healthy images: ${healthy.length} (${((healthy.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Broken images:  ${broken.length}`);

  if (broken.length > 0) {
    console.log(`\nBroken Images Detail:`);
    broken.forEach((b, i) => {
      console.log(`  [${i + 1}] ID: ${b.id} | Cat: ${b.category} | HTTP: ${b.status} | Type: ${b.contentType} | Src: ${b.src}`);
    });

    if (shouldClean) {
      console.log(`\n🧹 Cleaning up ${broken.length} broken images...`);
      const token = await getAdminToken();
      let deleted = 0;

      for (const b of broken) {
        const delRes = await fetch(`${BASE_URL}/api/gallery-images?id=${b.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (delRes.ok) {
          deleted++;
          console.log(`  ✓ Removed [${b.id}] (${b.category})`);
        } else {
          console.error(`  ✗ Failed to delete [${b.id}]`);
        }
      }

      console.log(`\n✅ Cleaned ${deleted} of ${broken.length} broken records.`);
    } else {
      console.log(`\n💡 Run with --clean to automatically remove broken records from the database.`);
    }
  } else {
    console.log(`\n🎉 All gallery images are healthy and serving valid image data.`);
  }
}

auditGallery().catch(console.error);
