import { NextRequest, NextResponse } from 'next/server';
import { getR2Object, isR2Configured } from '@/lib/r2';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
