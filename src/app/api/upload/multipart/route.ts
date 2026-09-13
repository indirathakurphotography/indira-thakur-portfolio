import { NextRequest, NextResponse } from 'next/server';
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { requireAdmin } from '@/lib/cmsDatabase';
import { ensureR2Bucket, getR2Client, getR2Config, getR2PublicUrl, isR2Configured } from '@/lib/r2';
import { MAX_VIDEO_UPLOAD_SIZE } from '@/lib/uploadConstants';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Browser requests stay below Vercel's request-body limit. The server combines
// two of these temporary chunks into a valid R2/S3 multipart part (>= 5 MiB).
const BROWSER_CHUNK_BYTES = 3 * 1024 * 1024;
const R2_PART_GROUP_SIZE = 2;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function sanitizeFilename(name: string): string {
  const clean = (name || 'video')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  const ext = clean.includes('.') ? clean.split('.').pop()! : 'mp4';
  const base = clean.substring(0, clean.lastIndexOf('.')) || 'video';
  return `${Date.now()}-${base}.${ext}`;
}

function cleanFolder(folder: string): string {
  return (folder || 'videos/testimonials')
    .split('/')
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, ''))
    .filter(Boolean)
    .join('/') || 'videos/testimonials';
}

function tempChunkKey(key: string, uploadId: string, chunkNumber: number): string {
  return `${key}.multipart/${uploadId}/${chunkNumber}`;
}

async function authorize(request: NextRequest): Promise<void> {
  await requireAdmin(request);
}

export async function POST(request: NextRequest) {
  try {
    await authorize(request);
  } catch {
    return errorResponse('Unauthorized access. Admin login required.', 401);
  }

  if (!isR2Configured()) return errorResponse('Cloudflare R2 is not configured.', 503);
  const config = getR2Config();
  await ensureR2Bucket(config.bucketName);
  const client = getR2Client();
  const action = request.headers.get('x-upload-action') || '';

  try {
    if (action === 'init') {
      const body = await request.json();
      const fileName = String(body.fileName || 'video.mp4');
      const fileType = String(body.fileType || 'video/mp4');
      const fileSize = Number(body.fileSize || 0);
      if (!fileSize || fileSize > MAX_VIDEO_UPLOAD_SIZE) {
        return errorResponse('Video exceeds the maximum allowed size of 200 MB.', 413);
      }
      const key = `${cleanFolder(String(body.folder || 'videos/testimonials'))}/${sanitizeFilename(fileName)}`;
      const result = await client.send(new CreateMultipartUploadCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: fileType,
      }));
      if (!result.UploadId) return errorResponse('R2 did not return a multipart upload ID.', 502);
      return NextResponse.json({ success: true, uploadId: result.UploadId, key, contentType: fileType, publicUrl: getR2PublicUrl(key) });
    }

    if (action === 'part') {
      const form = await request.formData();
      const uploadId = String(form.get('uploadId') || '');
      const key = String(form.get('key') || '');
      const chunkNumber = Number(form.get('partNumber') || 0);
      const chunk = form.get('chunk');
      if (!uploadId || !key || !chunkNumber || !(chunk instanceof File)) return errorResponse('Missing multipart chunk fields.');
      const bytes = Buffer.from(await chunk.arrayBuffer());
      if (!bytes.length || bytes.length > BROWSER_CHUNK_BYTES + 1024 * 1024) return errorResponse('Invalid browser chunk size.', 413);

      // Store the small request body as a temporary object. It is aggregated at completion.
      await client.send(new PutObjectCommand({
        Bucket: config.bucketName,
        Key: tempChunkKey(key, uploadId, chunkNumber),
        Body: bytes,
        ContentType: 'application/octet-stream',
      }));
      return NextResponse.json({ success: true, partNumber: chunkNumber, etag: `temp-${chunkNumber}`, bytes: bytes.length });
    }

    if (action === 'complete') {
      const body = await request.json();
      const uploadId = String(body.uploadId || '');
      const key = String(body.key || '');
      const chunkCount = Number(body.chunkCount || 0);
      if (!uploadId || !key || !chunkCount) return errorResponse('Missing multipart completion fields.');

      const parts: Array<{ PartNumber: number; ETag: string }> = [];
      let chunkNumber = 1;
      let r2PartNumber = 1;

      while (chunkNumber <= chunkCount) {
        const buffers: Buffer[] = [];
        const tempKeys: string[] = [];
        for (let offset = 0; offset < R2_PART_GROUP_SIZE && chunkNumber + offset <= chunkCount; offset += 1) {
          const currentChunk = chunkNumber + offset;
          const tempKey = tempChunkKey(key, uploadId, currentChunk);
          const result = await client.send(new GetObjectCommand({ Bucket: config.bucketName, Key: tempKey }));
          if (!result.Body) throw new Error(`Temporary upload chunk ${currentChunk} was not found.`);
          buffers.push(Buffer.from(await result.Body.transformToByteArray()));
          tempKeys.push(tempKey);
        }

        const aggregatedPart = Buffer.concat(buffers);
        const uploadedPart = await client.send(new UploadPartCommand({
          Bucket: config.bucketName,
          Key: key,
          UploadId: uploadId,
          PartNumber: r2PartNumber,
          Body: aggregatedPart,
        }));
        if (!uploadedPart.ETag) throw new Error(`R2 did not return an ETag for assembled part ${r2PartNumber}.`);
        parts.push({ PartNumber: r2PartNumber, ETag: uploadedPart.ETag });
        chunkNumber += tempKeys.length;
        r2PartNumber += 1;
      }

      await client.send(new CompleteMultipartUploadCommand({
        Bucket: config.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }));

      // Best-effort cleanup of temporary browser chunks after the final object exists.
      for (let index = 1; index <= chunkCount; index += 1) {
        await client.send(new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: tempChunkKey(key, uploadId, index),
        })).catch(() => undefined);
      }

      return NextResponse.json({ success: true, key, publicUrl: getR2PublicUrl(key) });
    }

    return errorResponse('Unknown multipart upload action.');
  } catch (err: any) {
    console.error('[R2 Multipart Upload]', err);
    return errorResponse(err?.message || 'R2 multipart upload failed.', 502);
  }
}
