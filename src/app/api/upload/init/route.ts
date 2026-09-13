import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { createR2SignedUploadUrl, isR2Configured, getR2Config } from '@/lib/r2';
import {
  MAX_IMAGE_UPLOAD_SIZE,
  MAX_VIDEO_UPLOAD_SIZE,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  MAX_VIDEO_UPLOAD_SIZE_MB,
} from '@/lib/uploadConstants';

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ error: message, success: false, ...extra }, { status });
}

function sanitizeFilename(name: string): string {
  const timestamp = Date.now();
  const clean = (name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  const ext = clean.includes('.') ? clean.split('.').pop()! : 'jpg';
  const base = clean.substring(0, clean.lastIndexOf('.')) || 'file';
  return `${timestamp}-${base}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdmin(request);
    } catch {
      return jsonError('Unauthorized access. Admin login required.', 401);
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, folder = 'general' } = body;

    if (!fileName) {
      return jsonError('fileName is required', 400);
    }

    const cleanFolder = (folder || 'general')
      .toString()
      .split('/')
      .map((part: string) => part
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, ''))
      .filter(Boolean)
      .join('/') || 'general';

    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'gif', 'mp4', 'mov', 'webm'];
    if (!allowedExtensions.includes(ext)) {
      return jsonError(`Unsupported file extension (.${ext}). Allowed formats: JPG, PNG, WEBP, AVIF, HEIC, MP4, MOV, WEBM`, 400);
    }

    const isVideo =
      (fileType || '').startsWith('video/') ||
      ['mp4', 'mov', 'webm'].includes(ext);
    const maxSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_IMAGE_UPLOAD_SIZE;
    const maxSizeMB = isVideo ? MAX_VIDEO_UPLOAD_SIZE_MB : MAX_IMAGE_UPLOAD_SIZE_MB;

    if (fileSize && fileSize > maxSize) {
      return jsonError(
        `File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${maxSizeMB} MB.`,
        413
      );
    }

    const sanitizedName = sanitizeFilename(fileName);
    const path = `${cleanFolder}/${sanitizedName}`;
    const contentType = fileType || (isVideo ? 'video/mp4' : 'image/jpeg');

    const r2Config = getR2Config();
    const r2Ready = isR2Configured();

    const uploadInfo = await createR2SignedUploadUrl(path, contentType);

    return NextResponse.json({
      success: true,
      provider: 'r2',
      isR2Configured: r2Ready,
      signedUrl: uploadInfo.signedUrl,
      publicUrl: uploadInfo.publicUrl,
      publicId: uploadInfo.key,
      path: uploadInfo.key,
      bucket: uploadInfo.bucket,
      contentType,
      maxAllowedBytes: maxSize,
    });
  } catch (err: any) {
    console.error('[Upload Init Exception]', err);
    return jsonError(err instanceof Error ? err.message : 'Upload initialization failed', 500);
  }
}
