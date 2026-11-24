import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildOpenGraphImageDescriptor,
  inferImageMimeType,
  readImageDimensionsFromBuffer,
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
    `https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=${expectedTs}`
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
    url: 'https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=1790605428812',
    alt: 'Indira Thakur Photography Studio Mumbai',
    type: 'image/jpeg',
    width: 1046,
    height: 1000,
  });

  assert.deepEqual(desc, {
    url: 'https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=1790605428812',
    secureUrl:
      'https://www.indirathakur.com/api/media/brand/1786446225171-Indira_Photography_logo.jpeg?v=1790605428812',
    type: 'image/jpeg',
    width: 1046,
    height: 1000,
    alt: 'Indira Thakur Photography Studio Mumbai',
  });
});

test('readImageDimensionsFromBuffer parses progressive JPEG dimensions without sharp', () => {
  const buf = fs.readFileSync(path.resolve(process.cwd(), 'public/icon.jpeg'));
  const dims = readImageDimensionsFromBuffer(buf);
  assert.deepEqual(dims, {
    width: 1046,
    height: 1000,
    contentType: 'image/jpeg',
  });
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
});
