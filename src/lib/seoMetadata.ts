import type { Metadata } from 'next';
import { cache } from 'react';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import SEO from '@/models/SEO';
import BrandSettings from '@/models/BrandSettings';
import { getR2Object, isR2Configured } from '@/lib/r2';
import {
  SITE_METADATA,
  buildOpenGraphImageDescriptor,
  capSeoKeywords,
  inferImageMimeType,
  isLegacyMonochromeAssetUrl,
  readImageDimensionsFromBuffer,
  resolveBrandFaviconUrl,
  resolveCanonicalUrl,
  resolveSeoOgImage,
  resolveSiteAssetUrl,
  type ResolvedImageMeta,
} from '@/lib/seoConfig';

export interface AdminSeoRecord {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  favicon?: string;
  metaPixelId?: string;
  updatedAt?: string | Date;
}

export interface InspectedImageDetails {
  accessible: boolean;
  width?: number;
  height?: number;
  contentType: string;
}

interface CachedInspection {
  details: InspectedImageDetails;
  expiresAt: number;
}

const IMAGE_INSPECT_TTL_MS = 60 * 60 * 1000;
const IMAGE_INSPECT_RETRY_TTL_MS = 5 * 1000;
const imageInspectCache = new Map<string, CachedInspection>();

const SEO_RECORD_TTL_MS = 30 * 1000;
let cachedSeoRecord: { data: AdminSeoRecord; expiresAt: number } | null = null;
let lastKnownSeoRecord: AdminSeoRecord | null = null;
let cachedBrandLogo: { url: string; expiresAt: number } | null = null;
let lastKnownBrandLogoUrl = '';

export function invalidateSeoMetadataCache(): void {
  cachedSeoRecord = null;
  cachedBrandLogo = null;
  imageInspectCache.clear();
}

async function streamToBufferLimited(readable: any, maxBytes = 10 * 1024 * 1024): Promise<Buffer> {
  if (!readable) return Buffer.alloc(0);
  if (Buffer.isBuffer(readable)) return readable;
  if (typeof readable.transformToByteArray === 'function') {
    const bytes = await readable.transformToByteArray();
    return Buffer.from(bytes);
  }
  if (typeof readable.arrayBuffer === 'function') {
    const ab = await readable.arrayBuffer();
    return Buffer.from(ab);
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of readable) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) break;
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function extractBufferImageDetails(
  buffer: Buffer,
  fallbackMime: string
): Promise<InspectedImageDetails> {
  const headerDims = readImageDimensionsFromBuffer(buffer);
  if (headerDims) {
    return {
      accessible: true,
      contentType: headerDims.contentType || fallbackMime,
      width: headerDims.width,
      height: headerDims.height,
    };
  }

  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(buffer).metadata();
    const fmt = meta.format ? String(meta.format) : '';
    return {
      accessible: true,
      contentType: fmt ? `image/${fmt === 'jpg' ? 'jpeg' : fmt}` : fallbackMime,
      width: meta.width,
      height: meta.height,
    };
  } catch {
    return {
      accessible: true,
      contentType: fallbackMime,
    };
  }
}

function resolveLocalMediaFile(mediaKey: string): { buffer: Buffer; contentType: string } | null {
  const publicDir = path.resolve(process.cwd(), 'public');
  const lower = mediaKey.toLowerCase();

  if (
    lower.includes('indira_photography_logo') ||
    lower.includes('icon.jpeg') ||
    lower.includes('1786446225171') ||
    lower.includes('1785574467987') ||
    lower.includes('1786430147426')
  ) {
    const p = path.join(publicDir, 'icon.jpeg');
    if (fs.existsSync(p)) return { buffer: fs.readFileSync(p), contentType: 'image/jpeg' };
  }

  const base = path.basename(mediaKey);
  if (base && !base.includes('..') && !base.includes('/')) {
    const direct = path.join(publicDir, base);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
      return {
        buffer: fs.readFileSync(direct),
        contentType: inferImageMimeType(base),
      };
    }
  }

  return null;
}

function extractLocalMediaKey(url: string): string | null {
  try {
    const parsed = new URL(url, SITE_METADATA.baseUrl);
    if (parsed.pathname.startsWith('/api/media/')) {
      return decodeURIComponent(parsed.pathname.slice('/api/media/'.length)).replace(/^\/+/, '');
    }
  } catch {
    if (url.startsWith('/api/media/')) {
      return url.split('?')[0].slice('/api/media/'.length).replace(/^\/+/, '');
    }
  }
  return null;
}

async function fetchRemoteImageBuffer(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    const buffer = Buffer.from(arr);
    if (buffer.length === 0) return null;
    return {
      buffer,
      contentType: inferImageMimeType(url, res.headers.get('content-type')),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function inspectSeoImage(url: string): Promise<InspectedImageDetails> {
  if (!url) {
    return { accessible: false, contentType: 'image/jpeg' };
  }

  const cacheKey = url.split('?')[0];
  const cached = imageInspectCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.details;
  }

  const fallbackMime = inferImageMimeType(url);
  let result: InspectedImageDetails = { accessible: false, contentType: fallbackMime };

  try {
    const mediaKey = extractLocalMediaKey(url);

    if (mediaKey) {
      let buffer: Buffer | null = null;
      let contentType = fallbackMime;

      if (isR2Configured()) {
        const candidates = mediaKey.startsWith('images/')
          ? [mediaKey, mediaKey.replace(/^images\//, '')]
          : [mediaKey, `images/${mediaKey}`];
        for (const candidate of candidates) {
          try {
            const obj = await Promise.race([
              getR2Object(candidate),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('R2 inspect timeout')), 1500)
              ),
            ]);
            contentType = inferImageMimeType(candidate, obj.contentType);
            buffer = await streamToBufferLimited(obj.body);
            if (buffer.length > 0) break;
          } catch {
            // Try next candidate or local fallback
          }
        }
      }

      if (!buffer || buffer.length === 0) {
        const local = resolveLocalMediaFile(mediaKey);
        if (local) {
          buffer = local.buffer;
          contentType = local.contentType;
        }
      }

      if ((!buffer || buffer.length === 0) && url.startsWith('https://')) {
        const fetched = await fetchRemoteImageBuffer(url);
        if (fetched) {
          buffer = fetched.buffer;
          contentType = fetched.contentType;
        }
      }

      if (buffer && buffer.length > 0) {
        result = await extractBufferImageDetails(buffer, contentType);
      }
    } else if (url.startsWith(`${SITE_METADATA.baseUrl}/`) && !url.includes('/api/')) {
      const parsed = new URL(url);
      const rel = parsed.pathname.replace(/^\/+/, '');
      const publicRoot = path.resolve(process.cwd(), 'public');
      const localPath = path.resolve(publicRoot, rel);
      if (localPath.startsWith(publicRoot) && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        const buffer = fs.readFileSync(localPath);
        result = await extractBufferImageDetails(buffer, fallbackMime);
      } else {
        const fetched = await fetchRemoteImageBuffer(url);
        if (fetched) {
          result = await extractBufferImageDetails(fetched.buffer, fetched.contentType);
        }
      }
    } else if (url.startsWith('https://') || url.startsWith('http://')) {
      const fetched = await fetchRemoteImageBuffer(url);
      if (fetched) {
        result = await extractBufferImageDetails(fetched.buffer, fetched.contentType);
      }
    }
  } catch (err) {
    console.error('[SEO] Failed to inspect Admin Panel OG image:', url, err);
  }

  imageInspectCache.set(cacheKey, {
    details: result,
    expiresAt: Date.now() + (result.accessible && result.width ? IMAGE_INSPECT_TTL_MS : IMAGE_INSPECT_RETRY_TTL_MS),
  });

  return result;
}

async function queryAdminSeoFromDb(): Promise<AdminSeoRecord | null> {
  if (!process.env.MONGODB_URI) return null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const db = await connectToDatabase({ bypassCooldown: attempt > 0 });
      if (db && mongoose.connection.readyState === 1) {
        const seo = await (SEO as any).findOne().lean().catch(() => null);
        if (seo) {
          return seo as AdminSeoRecord;
        }
      }
    } catch (err) {
      if (attempt === 2) {
        console.warn('[SEO] Database unavailable while loading SEO settings:', err);
      }
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }

  return null;
}

export const fetchAdminSeoRecord = cache(async (): Promise<AdminSeoRecord | null> => {
  if (cachedSeoRecord && Date.now() < cachedSeoRecord.expiresAt) {
    return cachedSeoRecord.data;
  }

  const fresh = await queryAdminSeoFromDb();
  if (fresh) {
    cachedSeoRecord = { data: fresh, expiresAt: Date.now() + SEO_RECORD_TTL_MS };
    lastKnownSeoRecord = fresh;
    return fresh;
  }

  return lastKnownSeoRecord;
});

export const fetchResolvedBrandLogoUrl = cache(async (): Promise<string> => {
  if (cachedBrandLogo && Date.now() < cachedBrandLogo.expiresAt) {
    return cachedBrandLogo.url;
  }
  if (!process.env.MONGODB_URI) return '';
  try {
    const db = await connectToDatabase();
    if (!db || mongoose.connection.readyState !== 1) return lastKnownBrandLogoUrl;
    const brand = (await BrandSettings.findOne().lean().catch(() => null)) as any;
    const raw = brand?.logo?.url || '';
    const resolved = resolveSiteAssetUrl(raw);
    if (resolved) {
      cachedBrandLogo = { url: resolved, expiresAt: Date.now() + SEO_RECORD_TTL_MS };
      lastKnownBrandLogoUrl = resolved;
    }
    return resolved || lastKnownBrandLogoUrl;
  } catch {
    return lastKnownBrandLogoUrl;
  }
});

export interface DynamicPageMetadataOptions {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article' | 'profile' | 'video.other';
  twitterTitle?: string;
  twitterDescription?: string;
  imageAlt?: string;
  useDbMetaOverrides?: boolean;
}

export const resolveAdminSocialImages = cache(
  async (
    seo: AdminSeoRecord | null,
    imageAlt: string
  ): Promise<{
    ogImage: ResolvedImageMeta | null;
    twitterImage: ResolvedImageMeta | null;
    twitterCard: string;
  }> => {
    if (!seo) {
      return { ogImage: null, twitterImage: null, twitterCard: 'summary_large_image' };
    }

    const sanitizedOgInput =
      seo.ogImage && !isLegacyMonochromeAssetUrl(seo.ogImage) ? seo.ogImage : '';
    const sanitizedTwInput =
      seo.twitterImage && !isLegacyMonochromeAssetUrl(seo.twitterImage)
        ? seo.twitterImage
        : sanitizedOgInput;

    const rawOgUrl = resolveSeoOgImage(sanitizedOgInput, seo.updatedAt);
    const rawTwitterUrl = resolveSeoOgImage(sanitizedTwInput, seo.updatedAt);

    if (!rawOgUrl) {
      console.error(
        '[SEO] Admin Panel SEO.ogImage is empty. Configure an Open Graph image in Admin > SEO (no favicon or fallback image substituted).'
      );
    }

    const [ogInspect, twInspect] = await Promise.all([
      rawOgUrl ? inspectSeoImage(rawOgUrl) : Promise.resolve(null),
      rawTwitterUrl
        ? rawTwitterUrl === rawOgUrl && rawOgUrl
          ? Promise.resolve(null)
          : inspectSeoImage(rawTwitterUrl)
        : Promise.resolve(null),
    ]);

    if (rawOgUrl && ogInspect && !ogInspect.accessible) {
      console.error('[SEO] Admin Panel OG image URL failed accessibility verification:', rawOgUrl);
    }

    const ogImage = rawOgUrl
      ? buildOpenGraphImageDescriptor({
          url: rawOgUrl,
          alt: imageAlt,
          type: ogInspect?.contentType,
          width: ogInspect?.width,
          height: ogInspect?.height,
        })
      : null;

    const effectiveTwInspect = rawTwitterUrl === rawOgUrl ? ogInspect : twInspect;
    const twitterImage = rawTwitterUrl
      ? buildOpenGraphImageDescriptor({
          url: rawTwitterUrl,
          alt: imageAlt,
          type: effectiveTwInspect?.contentType,
          width: effectiveTwInspect?.width,
          height: effectiveTwInspect?.height,
        })
      : null;

    return {
      ogImage,
      twitterImage,
      twitterCard: seo.twitterCard || 'summary_large_image',
    };
  }
);

export const resolveAdminBrandIcons = cache(
  async (seo: AdminSeoRecord | null, brandLogoUrl?: string | null) => {
    const icon = resolveBrandFaviconUrl({
      seoFavicon: seo?.favicon,
      brandLogoUrl,
      seoOgImage: seo?.ogImage,
      updatedAt: seo?.updatedAt,
    });

    return {
      icon: [{ url: icon.url, type: icon.type }],
      shortcut: icon.url,
      apple: [{ url: icon.url, type: icon.type }],
    };
  }
);

export async function buildDynamicPageMetadata(
  options: DynamicPageMetadataOptions
): Promise<Metadata> {
  const seo = await fetchAdminSeoRecord();

  const resolvedTitle =
    options.useDbMetaOverrides && seo?.metaTitle ? seo.metaTitle : options.title;
  const resolvedDescription =
    options.useDbMetaOverrides && seo?.metaDescription ? seo.metaDescription : options.description;

  const resolvedKeywords = capSeoKeywords(
    options.useDbMetaOverrides && seo?.keywords ? seo.keywords : options.keywords,
    12
  );

  const canonicalUrl = resolveCanonicalUrl(
    options.useDbMetaOverrides && options.canonicalPath === '/' ? seo?.canonicalUrl : null,
    options.canonicalPath
  );

  const ogTitle =
    options.useDbMetaOverrides && seo?.ogTitle
      ? seo.ogTitle
      : options.ogTitle || resolvedTitle;
  const ogDescription =
    options.useDbMetaOverrides && seo?.ogDescription
      ? seo.ogDescription
      : options.ogDescription || resolvedDescription;

  const twitterTitle =
    options.useDbMetaOverrides && seo?.twitterTitle
      ? seo.twitterTitle
      : options.twitterTitle || ogTitle;
  const twitterDescription =
    options.useDbMetaOverrides && seo?.twitterDescription
      ? seo.twitterDescription
      : options.twitterDescription || ogDescription;

  const imageAlt = options.imageAlt || ogTitle || SITE_METADATA.siteName;
  const { ogImage, twitterImage, twitterCard } = await resolveAdminSocialImages(seo, imageAlt);

  return {
    metadataBase: new URL(SITE_METADATA.baseUrl),
    title: resolvedTitle,
    description: resolvedDescription,
    ...(resolvedKeywords ? { keywords: resolvedKeywords } : {}),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: SITE_METADATA.siteName,
      locale: 'en_IN',
      type: options.ogType || 'website',
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: (twitterCard as any) || 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      creator: SITE_METADATA.twitterHandle,
      ...(twitterImage ? { images: [{ url: twitterImage.url, alt: twitterImage.alt }] } : {}),
    },
  };
}
