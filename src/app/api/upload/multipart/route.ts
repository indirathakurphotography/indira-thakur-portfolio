import { NextRequest, NextResponse } from 'next/server';
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { requireAdmin } from '@/lib/cmsDatabase';
import { ensureR2Bucket, getR2Client, getR2Config, getR2PublicUrl, isR2Configured } from '@/lib/r2';
import { MAX_VIDEO_UPLOAD_SIZE } from '@/lib/uploadConstants';

export const runtime = 'nodejs';
export const maxDuration = 300;

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
      const partNumber = Number(form.get('partNumber') || 0);
      const chunk = form.get('chunk');
      if (!uploadId || !key || !partNumber || !(chunk instanceof File)) return errorResponse('Missing multipart chunk fields.');
      const bytes = Buffer.from(await chunk.arrayBuffer());
      const result = await client.send(new UploadPartCommand({
        Bucket: config.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: bytes,
      }));
      if (!result.ETag) return errorResponse('R2 did not return a part ETag.', 502);
      return NextResponse.json({ success: true, partNumber, etag: result.ETag });
    }

    if (action === 'complete') {
      const body = await request.json();
      const uploadId = String(body.uploadId || '');
      const key = String(body.key || '');
      const parts = Array.isArray(body.parts) ? body.parts : [];
      if (!uploadId || !key || !parts.length) return errorResponse('Missing multipart completion fields.');
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: config.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part: any) => ({ PartNumber: Number(part.partNumber), ETag: String(part.etag) })),
        },
      }));
      return NextResponse.json({ success: true, key, publicUrl: getR2PublicUrl(key) });
    }

    return errorResponse('Unknown multipart upload action.');
  } catch (err: any) {
    console.error('[R2 Multipart Upload]', err);
    return errorResponse(err?.message || 'R2 multipart upload failed.', 502);
  }
}
