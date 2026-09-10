import { NextRequest, NextResponse } from 'next/server';
import { getR2Object, isR2Configured, uploadToR2 } from '@/lib/r2';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveLocalOrDatabaseAsset(
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const publicDir = path.resolve('./public');
    const lower = key.toLowerCase();

    // 1. Logo / Brand Photography logo
    if (
      lower.includes('indira_photography_logo') ||
      (lower.includes('logo') &&
        (lower.startsWith('brand/') ||
          lower.startsWith('footer/logo/') ||
          lower.startsWith('seo/')))
    ) {
      const logoPath = path.join(publicDir, 'icon.jpeg');
      if (fs.existsSync(logoPath)) {
        return { buffer: fs.readFileSync(logoPath), contentType: 'image/jpeg' };
      }
    }

    // 2. Favicon / Apple Touch Icon / App Icon
    if (lower.includes('apple-touch-icon')) {
      const p = path.join(publicDir, 'apple-touch-icon.png');
      if (fs.existsSync(p)) return { buffer: fs.readFileSync(p), contentType: 'image/png' };
    }
    if (lower.includes('favicon') || lower.includes('icon.png')) {
      const p = path.join(publicDir, 'icon.png');
      if (fs.existsSync(p)) return { buffer: fs.readFileSync(p), contentType: 'image/png' };
    }

    // 3. OG image
    if (lower.includes('og-image') || lower.includes('defaultogimage')) {
      const p = path.join(publicDir, 'og-image.jpg');
      if (fs.existsSync(p)) return { buffer: fs.readFileSync(p), contentType: 'image/jpeg' };
    }

    // 4. Exact filename match in public directory
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

    // 5. Check MongoDB for base64 encoded media (e.g. Gallery items in FileRecord)
    if (key.startsWith('gallery/') || key.startsWith('images/gallery/')) {
      try {
        const { connectToDatabase } = await import('@/lib/mongodb');
        const db = await connectToDatabase();
        if (db) {
          const FileRecord = (await import('@/models/FileRecord')).default;
          const rec = (await (FileRecord as any).findOne({
            $or: [{ publicId: key }, { publicId: key.replace(/^images\//, '') }],
          }).lean()) as any;
          if (rec?.url && rec.url.startsWith('data:image/')) {
            const match = rec.url.match(/^data:([^;]+);base64,(.+)$/);
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

  if (isR2Configured()) {
    // Try both the key directly and with/without "images/" prefix
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

        const headers = new Headers();
        headers.set('Content-Type', contentType || 'application/octet-stream');
        headers.set(
          'Cache-Control',
          'public, max-age=31536000, stale-while-revalidate=86400, immutable'
        );
        headers.set('X-Content-Type-Options', 'nosniff');

        // Restrict execution context if an SVG is ever served
        if (contentType && contentType.includes('svg')) {
          headers.set('Content-Security-Policy', "default-src 'none'");
        }

        if (contentLength !== undefined) {
          headers.set('Content-Length', contentLength.toString());
        }
        if (etag) headers.set('ETag', etag);
        if (lastModified) headers.set('Last-Modified', lastModified.toUTCString());
        headers.set('Accept-Ranges', 'bytes');

        let status = 200;
        if (contentRange) {
          headers.set('Content-Range', contentRange);
          status = 206;
        }

        if (isHeadRequest) {
          return new NextResponse(null, { status, headers });
        }

        let responseBody: any = body;
        if (body instanceof Readable) {
          responseBody = Readable.toWeb(body);
        }

        return new NextResponse(responseBody, {
          status,
          headers,
        });
      } catch (err: any) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          continue; // Try next key candidate
        }
        console.error('[API /media] Error fetching from R2:', err);
      }
    }

    // Check if the asset can be resolved from local repository files or database records
    const local = await resolveLocalOrDatabaseAsset(key);
    if (local) {
      // Auto-upload to Cloudflare R2 so subsequent requests hit R2 directly
      uploadToR2(key, local.buffer, local.contentType).catch((uploadErr) => {
        console.warn('[API /media] Auto-seed to R2 notice:', uploadErr?.message || uploadErr);
      });

      const headers = new Headers();
      headers.set('Content-Type', local.contentType);
      headers.set('Content-Length', local.buffer.length.toString());
      headers.set(
        'Cache-Control',
        'public, max-age=31536000, stale-while-revalidate=86400, immutable'
      );
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Accept-Ranges', 'bytes');

      if (isHeadRequest) {
        return new NextResponse(null, { status: 200, headers });
      }

      return new NextResponse(new Uint8Array(local.buffer), {
        status: 200,
        headers,
      });
    }

    return new NextResponse('Object Not Found in R2', { status: 404 });
  }

  // Fallback: If R2 is not configured
  return new NextResponse('Media not found or Cloudflare R2 credentials pending', {
    status: 404,
  });
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
