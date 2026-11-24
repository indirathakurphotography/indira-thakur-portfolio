import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  OG_MEDIA_DELIVERY_REVISION,
  buildOpenGraphImageDescriptor,
  capSeoKeywords,
  ensureJfifApp0Header,
  inferImageMimeType,
  isLegacyMonochromeAssetUrl,
  isProgressiveJpegBuffer,
  parseByteRangeHeader,
  readImageDimensionsFromBuffer,
  resolveBrandFaviconUrl,
  resolveCanonicalUrl,
  resolveSeoOgImage,
  resolveSiteAssetUrl,
} from './seoConfig';

test('resolveSeoOgImage returns empty string when rawUrl is empty (no favicon or static fallback)', () => {
  assert.equal(resolveSeoOgImage(''), '');
  assert.equal(resolveSeoOgImage(undefined), '');
  assert.equal(resolveSeoOgImage(null), '');
  assert.equal(resolveSeoOgImage('   '), '');
});

test('resolveSeoOgImage resolves relative Admin media URL onto canonical HTTPS origin with cache buster', () => {
  const updatedAt = '2026-09-28T14:23:48.812Z';
  const expectedTs = new Date(updatedAt).getTime();
  const resolved = resolveSeoOgImage(
    '/api/media/brand/1786446225171-Indira_Photography_logo.jpeg',
    updatedAt
  );
  assert.equal(
    resolved,
    `https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=${expectedTs}-${OG_MEDIA_DELIVERY_REVISION}`
  );
  assert.equal(
    resolveSeoOgImage('/api/media/brand/1786446225171-Indira_Photography_logo.jpeg'),
    `https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=${OG_MEDIA_DELIVERY_REVISION}`
  );
});

test('resolveSeoOgImage preserves query strings and external HTTPS CDN URLs without duplicating query params', () => {
  const external = 'https://res.cloudinary.com/demo/image/upload/v1/brand/logo.jpg?quality=auto';
  assert.equal(resolveSeoOgImage(external, '2026-09-28T14:23:48.812Z'), external);
});

test('resolveSiteAssetUrl upgrades http://indirathakur.com links to https://', () => {
  assert.equal(
    resolveSiteAssetUrl('http://www.indirathakur.com/api/media/brand/logo.jpeg'),
    'https://www.indirathakur.com/api/media/brand/logo.jpeg'
  );
});

test('inferImageMimeType detects JPEG, PNG, WEBP, and AVIF accurately', () => {
  assert.equal(
    inferImageMimeType('https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg'),
    'image/jpeg'
  );
  assert.equal(inferImageMimeType('https://example.com/photo.png?v=123'), 'image/png');
  assert.equal(inferImageMimeType('https://example.com/photo.webp'), 'image/webp');
  assert.equal(inferImageMimeType('https://example.com/file', 'image/jpg; charset=utf-8'), 'image/jpeg');
});

test('buildOpenGraphImageDescriptor produces complete OG descriptor with secureUrl, type, and exact dimensions', () => {
  const desc = buildOpenGraphImageDescriptor({
    url: 'https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=1790605428812-bl3',
    alt: 'Indira Thakur Photography Studio Mumbai',
    type: 'image/jpeg',
    width: 1046,
    height: 1000,
  });

  assert.deepEqual(desc, {
    url: 'https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=1790605428812-bl3',
    secureUrl:
      'https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=1790605428812-bl3',
    type: 'image/jpeg',
    width: 1046,
    height: 1000,
    alt: 'Indira Thakur Photography Studio Mumbai',
  });
});

test('readImageDimensionsFromBuffer parses progressive JPEG dimensions and detects SOF2 vs SOF0', async () => {
  const buf = fs.readFileSync(path.resolve(process.cwd(), 'public/icon.jpeg'));
  const dims = readImageDimensionsFromBuffer(buf);
  assert.deepEqual(dims, {
    width: 1046,
    height: 1000,
    contentType: 'image/jpeg',
  });
  assert.equal(isProgressiveJpegBuffer(buf), true);

  const sharp = (await import('sharp')).default;
  const rawBaselineBuf = await sharp(buf)
    .jpeg({ quality: 92, progressive: false, chromaSubsampling: '4:2:0', mozjpeg: false })
    .toBuffer();
  assert.equal(rawBaselineBuf[2], 0xff);
  assert.equal(rawBaselineBuf[3], 0xdb); // Sharp omits JFIF APP0

  const jfifResult = ensureJfifApp0Header(rawBaselineBuf);
  assert.equal(jfifResult.modified, true);
  assert.equal(jfifResult.buffer[2], 0xff);
  assert.equal(jfifResult.buffer[3], 0xe0); // JFIF APP0 injected
  assert.equal(jfifResult.buffer.toString('ascii', 6, 10), 'JFIF');
  assert.equal(isProgressiveJpegBuffer(jfifResult.buffer), false);
  assert.deepEqual(readImageDimensionsFromBuffer(jfifResult.buffer), {
    width: 1046,
    height: 1000,
    contentType: 'image/jpeg',
  });

  // Calling again is idempotent
  const secondPass = ensureJfifApp0Header(jfifResult.buffer);
  assert.equal(secondPass.modified, false);
  assert.equal(secondPass.buffer.length, jfifResult.buffer.length);
});

test('parseByteRangeHeader detects full-object crawler ranges vs strict sub-ranges', () => {
  assert.deepEqual(parseByteRangeHeader('bytes=0-524287', 83222), {
    start: 0,
    end: 83221,
    coversWhole: true,
  });
  assert.deepEqual(parseByteRangeHeader('bytes=0-', 83222), {
    start: 0,
    end: 83221,
    coversWhole: true,
  });
  assert.deepEqual(parseByteRangeHeader('bytes=0-1023', 83222), {
    start: 0,
    end: 1023,
    coversWhole: false,
  });
  assert.equal(parseByteRangeHeader('bytes=999999-1000000', 83222), null);
  assert.equal(parseByteRangeHeader(undefined, 83222), null);
});

test('resolveCanonicalUrl rejects stale off-origin canonicalUrl and keeps og:url on https://www.indirathakur.com', () => {
  assert.equal(
    resolveCanonicalUrl('https://indirathakurphotography.com', '/'),
    'https://www.indirathakur.com'
  );
  assert.equal(
    resolveCanonicalUrl('http://indirathakur.com', '/'),
    'https://www.indirathakur.com'
  );
  assert.equal(
    resolveCanonicalUrl('https://indirathakurphotography.com', '/services'),
    'https://www.indirathakur.com/services'
  );
  assert.equal(
    resolveCanonicalUrl(null, '/gallery?category=newborn'),
    'https://www.indirathakur.com/gallery?category=newborn'
  );
});

test('isLegacyMonochromeAssetUrl flags deleted monochrome and placeholder filenames', () => {
  assert.equal(isLegacyMonochromeAssetUrl('/icon.png'), true);
  assert.equal(isLegacyMonochromeAssetUrl('/favicon.ico'), true);
  assert.equal(isLegacyMonochromeAssetUrl('https://www.indirathakur.com/apple-touch-icon.png?v=1'), true);
  assert.equal(isLegacyMonochromeAssetUrl('/logo.png'), true);
  assert.equal(isLegacyMonochromeAssetUrl('/og-image.jpg'), true);
  assert.equal(isLegacyMonochromeAssetUrl('/og-image-v2.jpg'), true);
  assert.equal(isLegacyMonochromeAssetUrl('/api/media/brand/1786446225171-Indira_Photography_logo.jpeg'), false);
  assert.equal(isLegacyMonochromeAssetUrl('/icon.jpeg'), false);
});

test('resolveBrandFaviconUrl skips legacy monochrome icons and resolves Admin full-colour logo', () => {
  const resolved = resolveBrandFaviconUrl({
    seoFavicon: '/favicon.ico',
    brandFaviconUrl: '/icon.png',
    brandLogoUrl: '/api/media/brand/1786446225171-Indira_Photography_logo.jpeg',
    seoOgImage: '/api/media/brand/1786446225171-Indira_Photography_logo.jpeg',
    updatedAt: '2026-09-28T14:23:48.812Z',
  });
  assert.equal(resolved.type, 'image/jpeg');
  assert.match(resolved.url, /^https:\/\/www\.indirathakur\.com\/api\/media\/brand\/1786446225171-Indira_Photography_logo\.jpeg\?v=/);

  const fallback = resolveBrandFaviconUrl({
    seoFavicon: '/favicon.ico',
    brandLogoUrl: '',
    seoOgImage: '',
  });
  assert.deepEqual(fallback, {
    url: 'https://www.indirathakur.com/icon.jpeg',
    type: 'image/jpeg',
  });
});

test('capSeoKeywords deduplicates and caps keyword list length to keep head metadata compact', () => {
  const input = Array.from({ length: 30 }, (_, i) => `Keyword ${i}`);
  input.push('Keyword 0', '  ', 'Keyword 1');
  const result = capSeoKeywords(input, 12);
  assert.equal(result?.length, 12);
  assert.equal(result?.[0], 'Keyword 0');
  assert.equal(capSeoKeywords('', 12), undefined);
});
