import type { Metadata } from 'next';
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
  inferImageMimeType,
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

const IMAGE_INSPECT_TTL_MS = 10 * 60 * 1000;
const imageInspectCache = new Map<string, CachedInspection>();

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

function resolveLocalMediaFile(mediaKey: string): { buffer: Buffer; contentType: string } | null {
  const publicDir = path.resolve('./public');
  const lower = mediaKey.toLowerCase();

  if (
    lower.includes('indira_photography_logo') ||
    lower.includes('icon.jpeg') ||
    lower.includes('1786446225171') ||
    lower.includes('1785574467987')
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
    const sharp = (await import('sharp')).default;
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
            const obj = await getR2Object(candidate);
            contentType = inferImageMimeType(candidate, obj.contentType);
            buffer = await streamToBufferLimited(obj.body);
            if (buffer.length > 0) break;
          } catch {
            // Try next candidate
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

      if (buffer && buffer.length > 0) {
        const meta = await sharp(buffer).metadata();
        const fmt = meta.format ? String(meta.format) : '';
        result = {
          accessible: true,
          contentType: fmt ? `image/${fmt === 'jpg' ? 'jpeg' : fmt}` : contentType,
          width: meta.width,
          height: meta.height,
        };
      }
    } else if (url.startsWith(`${SITE_METADATA.baseUrl}/`) && !url.includes('/api/')) {
      const parsed = new URL(url);
      const rel = parsed.pathname.replace(/^\/+/, '');
      const localPath = path.resolve('./public', rel);
      const publicRoot = path.resolve('./public');
      if (localPath.startsWith(publicRoot) && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        const buffer = fs.readFileSync(localPath);
        const meta = await sharp(buffer).metadata();
        const fmt = meta.format ? String(meta.format) : '';
        result = {
          accessible: true,
          contentType: fmt ? `image/${fmt === 'jpg' ? 'jpeg' : fmt}` : fallbackMime,
          width: meta.width,
          height: meta.height,
        };
      }
    } else if (url.startsWith('https://') || url.startsWith('http://')) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(url, { method: 'GET', signal: controller.signal, cache: 'no-store' });
        if (res.ok) {
          const arr = await res.arrayBuffer();
          const buffer = Buffer.from(arr);
          const meta = await sharp(buffer).metadata();
          result = {
            accessible: true,
            contentType: inferImageMimeType(url, res.headers.get('content-type')),
            width: meta.width,
            height: meta.height,
          };
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch (err) {
    console.error('[SEO] Failed to inspect Admin Panel OG image:', url, err);
  }

  imageInspectCache.set(cacheKey, {
    details: result,
    expiresAt: Date.now() + IMAGE_INSPECT_TTL_MS,
  });

  return result;
}

export async function fetchAdminSeoRecord(): Promise<AdminSeoRecord | null> {
  if (!process.env.MONGODB_URI) return null;
  try {
    const db = await connectToDatabase();
    if (!db || mongoose.connection.readyState !== 1) return null;
    const seo = await (SEO as any).findOne().lean().catch(() => null);
    return (seo as AdminSeoRecord) || null;
  } catch (err) {
    console.warn('[SEO] Database unavailable while loading SEO settings:', err);
    return null;
  }
}

export async function fetchResolvedBrandLogoUrl(): Promise<string> {
  if (!process.env.MONGODB_URI) return '';
  try {
    const db = await connectToDatabase();
    if (!db || mongoose.connection.readyState !== 1) return '';
    const brand = (await BrandSettings.findOne().lean().catch(() => null)) as any;
    const raw = brand?.logo?.url || '';
    return resolveSiteAssetUrl(raw);
  } catch {
    return '';
  }
}

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

export async function resolveAdminSocialImages(
  seo: AdminSeoRecord | null,
  imageAlt: string
): Promise<{
  ogImage: ResolvedImageMeta | null;
  twitterImage: ResolvedImageMeta | null;
  twitterCard: string;
}> {
  if (!seo) {
    return { ogImage: null, twitterImage: null, twitterCard: 'summary_large_image' };
  }

  const rawOgUrl = resolveSeoOgImage(seo.ogImage, seo.updatedAt);
  const rawTwitterUrl = resolveSeoOgImage(seo.twitterImage || seo.ogImage, seo.updatedAt);

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

export async function buildDynamicPageMetadata(
  options: DynamicPageMetadataOptions
): Promise<Metadata> {
  const seo = await fetchAdminSeoRecord();

  const resolvedTitle =
    options.useDbMetaOverrides && seo?.metaTitle ? seo.metaTitle : options.title;
  const resolvedDescription =
    options.useDbMetaOverrides && seo?.metaDescription ? seo.metaDescription : options.description;

  const resolvedKeywords =
    options.useDbMetaOverrides && seo?.keywords
      ? seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : options.keywords;

  const canonicalUrl =
    options.useDbMetaOverrides && options.canonicalPath === '/' && seo?.canonicalUrl
      ? seo.canonicalUrl
      : `${SITE_METADATA.baseUrl}${options.canonicalPath === '/' ? '' : options.canonicalPath}`;

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
