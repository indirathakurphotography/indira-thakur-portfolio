import { NextRequest, NextResponse } from 'next/server';
import { getR2Object, isR2Configured, uploadToR2 } from '@/lib/r2';
import { isProgressiveJpegBuffer } from '@/lib/seoConfig';
import { Readable } from 'stream';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isSocialOrBrandKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.startsWith('brand/') ||
    lower.startsWith('images/brand/') ||
    lower.startsWith('seo/') ||
    lower.startsWith('images/seo/') ||
    lower.startsWith('footer/logo/') ||
    lower.startsWith('images/footer/logo/') ||
    lower.includes('indira_photography_logo')
  );
}

async function normalizeProgressiveJpegToBaseline(
  rawBuffer: Buffer,
  contentType: string,
  cacheKey: string
): Promise<{ buffer: Buffer; etag: string | null; converted: boolean }> {
  if (contentType !== 'image/jpeg' || rawBuffer.length === 0) {
    return { buffer: rawBuffer, etag: null, converted: false };
  }
  if (!isProgressiveJpegBuffer(rawBuffer)) {
    return { buffer: rawBuffer, etag: null, converted: false };
  }

  const cached = thumbnailCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 24 * 60 * 60 * 1000) {
    return { buffer: cached.buffer, etag: cached.etag, converted: true };
  }

  try {
    const jpeg = (await import('jpeg-js')).default || (await import('jpeg-js'));
    const decoded = jpeg.decode(rawBuffer, {
      useTArray: true,
      maxMemoryUsageInMB: 256,
      maxResolutionInMP: 64,
    });
    const encoded = jpeg.encode(decoded, 94);
    const baselineBuffer = Buffer.from(encoded.data);

    const hash = crypto.createHash('sha1').update(baselineBuffer).digest('hex').slice(0, 20);
    const baselineEtag = `"${hash}-bl"`;

    if (thumbnailCache.size > 500) {
      const firstKey = thumbnailCache.keys().next().value;
      if (firstKey) thumbnailCache.delete(firstKey);
    }
    thumbnailCache.set(cacheKey, {
      buffer: baselineBuffer,
      contentType: 'image/jpeg',
      etag: baselineEtag,
      createdAt: Date.now(),
    });

    return { buffer: baselineBuffer, etag: baselineEtag, converted: true };
  } catch (err) {
    try {
      const sharp = (await import('sharp')).default;
      const baselineBuffer = await sharp(rawBuffer)
        .jpeg({ quality: 95, progressive: false, chromaSubsampling: '4:2:0', mozjpeg: false })
        .toBuffer();

      const hash = crypto.createHash('sha1').update(baselineBuffer).digest('hex').slice(0, 20);
      const baselineEtag = `"${hash}-bl"`;
      thumbnailCache.set(cacheKey, {
        buffer: baselineBuffer,
        contentType: 'image/jpeg',
        etag: baselineEtag,
        createdAt: Date.now(),
      });
      return { buffer: baselineBuffer, etag: baselineEtag, converted: true };
    } catch {
      console.warn('[API /media] Baseline JPEG normalization notice, serving raw buffer:', err);
      return { buffer: rawBuffer, etag: null, converted: false };
    }
  }
}

async function resolveLocalOrDatabaseAsset(
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const publicDir = path.resolve('./public');
    const lower = key.toLowerCase();

    // 1. Authoritative full-colour Admin brand / SEO logo asset
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

    // 2. Exact filename match in public directory
    const base = path.basename(key);
    const direct = path.join(publicDir, base);
    if (fs.existsSync(direct)) {
      const ext = path.extname(base).toLowerCase();
      const contentType =
        ext === '.png'
          ? 'image/png'
          : ext === '.svg'
          ? 'image/svg+xml'
          : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';
      return { buffer: fs.readFileSync(direct), contentType };
    }

    // 5. Check MongoDB for base64 encoded media (e.g. Gallery items in FileRecord or GalleryImage)
    if (key.startsWith('gallery/') || key.startsWith('images/gallery/')) {
      try {
        const { connectToDatabase } = await import('@/lib/mongodb');
        const db = await connectToDatabase();
        if (db) {
          const FileRecord = (await import('@/models/FileRecord')).default;
          const rec = (await (FileRecord as any).findOne({
            $or: [{ publicId: key }, { publicId: key.replace(/^images\//, '') }],
          }).lean()) as any;
          const fileDataUrl = rec?.url?.startsWith('data:image/') ? rec.url : null;

          let dataUrl = fileDataUrl;
          if (!dataUrl) {
            const GalleryImage = (await import('@/models/GalleryImage')).default;
            const gRec = (await (GalleryImage as any).findOne({
              $or: [
                { publicId: key },
                { publicId: key.replace(/^images\//, '') },
                { src: `/api/media/${key}` },
                { src: `/api/media/${key.replace(/^images\//, '')}` },
                { src: key },
              ],
            }).lean()) as any;
            dataUrl =
              (gRec?.src?.startsWith('data:image/') && gRec.src) ||
              (gRec?.thumbnail?.startsWith('data:image/') && gRec.thumbnail) ||
              (gRec?.url?.startsWith('data:image/') && gRec.url) ||
              null;
          }

          if (dataUrl) {
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const contentType = match[1] || 'image/jpeg';
              const buffer = Buffer.from(match[2], 'base64');
              return { buffer, contentType };
            }
          }
        }
      } catch (dbErr) {
        console.warn('[API /media] MongoDB media lookup notice:', dbErr);
      }
    }
  } catch (err) {
    console.error('[API /media] Error resolving local/database asset:', err);
  }
  return null;
}

function sanitizeKey(rawKey: string): string | null {
  if (!rawKey) return null;
  // Decode URL components
  let decoded = rawKey;
  try {
    decoded = decodeURIComponent(rawKey);
  } catch {
    // Keep rawKey if decode fails
  }

  // Prevent path traversal and control characters
  if (
    decoded.includes('..') ||
    decoded.includes('\\') ||
    decoded.includes('\0') ||
    decoded.startsWith('/')
  ) {
    return null;
  }

  return decoded.replace(/^\/+/, '');
}

// In-memory cache for resized thumbnails (max 300 entries, 24h TTL)
interface ThumbnailCacheEntry {
  buffer: Buffer;
  contentType: string;
  etag: string;
  createdAt: number;
}
const thumbnailCache = new Map<string, ThumbnailCacheEntry>();

async function streamToBuffer(readable: any): Promise<Buffer> {
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
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function inferContentType(key: string, providedType?: string): string {
  if (
    providedType &&
    providedType !== 'application/octet-stream' &&
    providedType !== 'binary/octet-stream'
  ) {
    return providedType;
  }
  const lower = key.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.avif')) return 'image/avif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return providedType || 'application/octet-stream';
}

async function handleMediaRequest(
  request: NextRequest,
  path: string[],
  isHeadRequest: boolean = false
) {
  const rawKey = (path || []).join('/');
  const key = sanitizeKey(rawKey);

  if (!key) {
    return new NextResponse('Bad Request: Invalid media path', { status: 400 });
  }

  const range = request.headers.get('range') || undefined;
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  const { searchParams } = new URL(request.url);
  const widthParam = searchParams.get('w');
  const qualityParam = searchParams.get('q');
  const targetWidth = widthParam ? Math.min(2560, Math.max(16, parseInt(widthParam, 10))) : null;
  const targetQuality = qualityParam ? Math.min(100, Math.max(10, parseInt(qualityParam, 10))) : 80;
  const shouldNormalizeBaseline =
    !targetWidth &&
    !range &&
    (isSocialOrBrandKey(key) ||
      searchParams.get('baseline') === '1' ||
      String(searchParams.get('v') || '').includes('-bl'));

  // Fast cache check for already-normalized baseline JPEGs
  if (shouldNormalizeBaseline) {
    const baselineCacheKey = `${key}:baseline-sof0`;
    const cachedBaseline = thumbnailCache.get(baselineCacheKey);
    if (cachedBaseline && Date.now() - cachedBaseline.createdAt < 24 * 60 * 60 * 1000) {
      if (ifNoneMatch && ifNoneMatch === cachedBaseline.etag) {
        return new NextResponse(null, { status: 304 });
      }
      const headers = new Headers();
      const safeFilename = (key.split('/').pop() || 'media').replace(/["\r\n]/g, '') || 'media';
      headers.set('Content-Type', cachedBaseline.contentType);
      headers.set('Content-Length', cachedBaseline.buffer.length.toString());
      headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('ETag', cachedBaseline.etag);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

      if (isHeadRequest) {
        return new NextResponse(null, { status: 200, headers });
      }
      return new NextResponse(new Uint8Array(cachedBaseline.buffer), { status: 200, headers });
    }
  }

  // Check thumbnail cache if resize was requested
  const cacheKey = `${key}:w${targetWidth || 'orig'}:q${targetQuality}`;
  if (targetWidth) {
    const cachedThumb = thumbnailCache.get(cacheKey);
    if (cachedThumb && Date.now() - cachedThumb.createdAt < 24 * 60 * 60 * 1000) {
      if (ifNoneMatch && ifNoneMatch === cachedThumb.etag) {
        return new NextResponse(null, { status: 304 });
      }
      const headers = new Headers();
      headers.set('Content-Type', cachedThumb.contentType);
      headers.set('Content-Length', cachedThumb.buffer.length.toString());
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('ETag', cachedThumb.etag);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

      if (isHeadRequest) {
        return new NextResponse(null, { status: 200, headers });
      }
      return new NextResponse(new Uint8Array(cachedThumb.buffer), { status: 200, headers });
    }
  }

  // 1. Try R2 if configured
  if (isR2Configured()) {
    const candidateKeys = [key];
    if (key.startsWith('images/')) {
      candidateKeys.push(key.replace(/^images\//, ''));
    } else {
      candidateKeys.push(`images/${key}`);
    }

    for (const lookupKey of candidateKeys) {
      try {
        const { body, contentType, contentLength, contentRange, etag, lastModified } =
          await getR2Object(lookupKey, range);

        const resolvedContentType = inferContentType(lookupKey, contentType);

        // Handle partial range requests (e.g. video/audio streaming)
        if (contentRange || range) {
          const headers = new Headers();
          headers.set('Content-Type', resolvedContentType);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('X-Content-Type-Options', 'nosniff');
          headers.set('Accept-Ranges', 'bytes');
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
          if (contentLength !== undefined) headers.set('Content-Length', contentLength.toString());
          if (etag) headers.set('ETag', etag);
          if (lastModified) headers.set('Last-Modified', lastModified.toUTCString());
          if (contentRange) headers.set('Content-Range', contentRange);

          if (isHeadRequest) return new NextResponse(null, { status: 206, headers });

          let responseBody: any = body;
          if (body instanceof Readable) {
            responseBody = Readable.toWeb(body);
          }
          return new NextResponse(responseBody, { status: 206, headers });
        }

        // For non-range image/media requests, buffer the bytes safely
        const rawBuffer = await streamToBuffer(body);

        // If resize requested and image is raster, optimize with sharp
        const isRasterImage =
          resolvedContentType === 'image/jpeg' ||
          resolvedContentType === 'image/png' ||
          resolvedContentType === 'image/webp' ||
          resolvedContentType === 'image/avif';

        if (targetWidth && isRasterImage && rawBuffer.length > 0) {
          try {
            const sharp = (await import('sharp')).default;
            const resizedBuffer = await sharp(rawBuffer)
              .resize({ width: targetWidth, withoutEnlargement: true })
              .webp({ quality: targetQuality })
              .toBuffer();

            const thumbEtag = `"${Buffer.from(cacheKey).toString('base64').slice(0, 12)}-${resizedBuffer.length.toString(16)}"`;
            if (thumbnailCache.size > 500) {
              const firstKey = thumbnailCache.keys().next().value;
              if (firstKey) thumbnailCache.delete(firstKey);
            }
            thumbnailCache.set(cacheKey, {
              buffer: resizedBuffer,
              contentType: 'image/webp',
              etag: thumbEtag,
              createdAt: Date.now(),
            });

            if (ifNoneMatch && ifNoneMatch === thumbEtag) {
              return new NextResponse(null, { status: 304 });
            }

            const headers = new Headers();
            headers.set('Content-Type', 'image/webp');
            headers.set('Content-Length', resizedBuffer.length.toString());
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            headers.set('ETag', thumbEtag);
            headers.set('X-Content-Type-Options', 'nosniff');
            headers.set('Accept-Ranges', 'bytes');
            headers.set('Access-Control-Allow-Origin', '*');
            headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

            if (isHeadRequest) return new NextResponse(null, { status: 200, headers });
            return new NextResponse(new Uint8Array(resizedBuffer), { status: 200, headers });
          } catch (sharpErr) {
            console.warn('[API /media] Sharp resize notice, falling back to original buffer:', sharpErr);
          }
        }

        // Convert progressive SOF2 JPEGs in brand/SEO assets to Baseline SOF0 JPEG
        // while keeping exact original pixel content, colour, and dimensions
        let servedBuffer = rawBuffer;
        let effectiveEtag = etag;
        if (shouldNormalizeBaseline) {
          const normalized = await normalizeProgressiveJpegToBaseline(
            rawBuffer,
            resolvedContentType,
            `${key}:baseline-sof0`
          );
          servedBuffer = normalized.buffer;
          if (normalized.converted && normalized.etag) {
            effectiveEtag = normalized.etag;
          }
        }

        if (effectiveEtag && ifNoneMatch === effectiveEtag) {
          return new NextResponse(null, { status: 304 });
        }

        if (lastModified && ifModifiedSince) {
          const sinceDate = new Date(ifModifiedSince);
          if (!isNaN(sinceDate.getTime()) && lastModified <= sinceDate && (!ifNoneMatch || ifNoneMatch === effectiveEtag)) {
            return new NextResponse(null, { status: 304 });
          }
        }

        const headers = new Headers();
        const safeFilename = (lookupKey.split('/').pop() || 'media').replace(/["\r\n]/g, '') || 'media';
        headers.set('Content-Type', resolvedContentType);
        headers.set('Content-Length', servedBuffer.length.toString());
        headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

        if (resolvedContentType.includes('svg')) {
          headers.set('Content-Security-Policy', "default-src 'none'");
        }

        if (effectiveEtag) headers.set('ETag', effectiveEtag);
        if (lastModified) headers.set('Last-Modified', lastModified.toUTCString());

        if (isHeadRequest) {
          return new NextResponse(null, { status: 200, headers });
        }

        return new NextResponse(new Uint8Array(servedBuffer), { status: 200, headers });
      } catch (err: any) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          continue;
        }
        console.error('[API /media] Error fetching from R2:', err);
      }
    }
  }

  // 2. Fallback: Check local repository files or database records
  const local = await resolveLocalOrDatabaseAsset(key);
  if (local) {
    // If R2 is active, auto-upload to Cloudflare R2 asynchronously
    if (isR2Configured()) {
      uploadToR2(key, local.buffer, local.contentType).catch((uploadErr) => {
        console.warn('[API /media] Auto-seed to R2 notice:', uploadErr?.message || uploadErr);
      });
    }

    let finalBuffer = local.buffer;
    let finalContentType = local.contentType;
    let localEtag = `"${Buffer.from(key + (targetWidth || '')).toString('base64').slice(0, 10)}-${finalBuffer.length.toString(16)}"`;

    // Apply sharp resizing if requested
    if (
      targetWidth &&
      (finalContentType === 'image/jpeg' ||
        finalContentType === 'image/png' ||
        finalContentType === 'image/webp')
    ) {
      try {
        const sharp = (await import('sharp')).default;
        finalBuffer = await sharp(local.buffer)
          .resize({ width: targetWidth, withoutEnlargement: true })
          .webp({ quality: targetQuality })
          .toBuffer();
        finalContentType = 'image/webp';
        localEtag = `"${Buffer.from(key + targetWidth).toString('base64').slice(0, 10)}-${finalBuffer.length.toString(16)}"`;
      } catch {}
    } else if (shouldNormalizeBaseline) {
      const normalized = await normalizeProgressiveJpegToBaseline(
        local.buffer,
        local.contentType,
        `${key}:baseline-sof0`
      );
      finalBuffer = normalized.buffer;
      if (normalized.converted && normalized.etag) {
        localEtag = normalized.etag;
      }
    }

    if (ifNoneMatch && ifNoneMatch === localEtag) {
      return new NextResponse(null, { status: 304 });
    }

    const headers = new Headers();
    const safeFilename = (key.split('/').pop() || 'media').replace(/["\r\n]/g, '') || 'media';
    headers.set('Content-Type', finalContentType);
    headers.set('Content-Length', finalBuffer.length.toString());
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', localEtag);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    if (isHeadRequest) {
      return new NextResponse(null, { status: 200, headers });
    }

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers,
    });
  }

  const notFoundHeaders = new Headers();
  notFoundHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  notFoundHeaders.set('Pragma', 'no-cache');
  notFoundHeaders.set('Expires', '0');
  return new NextResponse('Media not found', { status: 404, headers: notFoundHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleMediaRequest(request, path, false);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleMediaRequest(request, path, true);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}
