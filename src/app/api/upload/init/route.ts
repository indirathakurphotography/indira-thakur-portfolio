import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getSupabaseUrl,
  getSupabaseKey,
  getSupabaseAnonKey,
  getSupabaseInitDetails,
  getSupabaseAdminClient,
} from '@/lib/supabase';
import {
  MAX_IMAGE_UPLOAD_SIZE,
  MAX_VIDEO_UPLOAD_SIZE,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  MAX_VIDEO_UPLOAD_SIZE_MB,
} from '@/lib/uploadConstants';

const BUCKET = 'images';

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ error: message, success: false, ...extra }, { status });
}

function sanitizeFilename(name: string): string {
  const timestamp = Date.now();
  const clean = (name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  const ext = clean.includes('.') ? clean.split('.').pop()! : 'bin';
  const base = clean.substring(0, clean.lastIndexOf('.')) || 'file';
  return `${timestamp}-${base}.${ext}`;
}

async function ensureBucket(): Promise<void> {
  try {
    const { client } = getSupabaseAdminClient();
    const { data: bucket, error: getErr } = await client.storage.getBucket(BUCKET);
    if (bucket && !getErr) return;

    await client.storage.createBucket(BUCKET, { public: true });
  } catch (err) {
    console.warn('[Storage Init] ensureBucket info:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return jsonError('Unauthorized access. Admin login required.', 401);
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, folder = 'general' } = body;

    if (!fileName) {
      return jsonError('fileName is required', 400);
    }

    const isVideo = (fileType || '').startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(fileName);
    const maxSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_IMAGE_UPLOAD_SIZE;
    const maxSizeMB = isVideo ? MAX_VIDEO_UPLOAD_SIZE_MB : MAX_IMAGE_UPLOAD_SIZE_MB;

    if (fileSize && fileSize > maxSize) {
      return jsonError(
        `File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${maxSizeMB} MB.`,
        413
      );
    }

    const baseUrl = getSupabaseUrl();
    const serviceKey = getSupabaseKey();
    const anonKey = getSupabaseAnonKey() || serviceKey;
    const initDetails = getSupabaseInitDetails();

    if (!baseUrl || (!serviceKey && !anonKey)) {
      const errorMsg = `Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your environment variables. Detected vars: ${JSON.stringify(initDetails.detectedVars)}`;
      console.error('[Upload Init Error]', errorMsg);
      return jsonError(errorMsg, 500, { detectedVars: initDetails.detectedVars });
    }

    await ensureBucket();

    const sanitizedName = sanitizeFilename(fileName);
    const path = `${folder}/${sanitizedName}`;

    const directUploadUrl = `${baseUrl}/storage/v1/object/${BUCKET}/${path}`;
    const publicUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

    // Try creating signed upload URL via server-side Supabase admin client
    let signedUrl: string | null = null;
    let token: string | null = null;
    let signedUploadError: string | null = null;
    let isServiceRoleUsed = false;
    let keySummary = '';

    try {
      const adminRes = getSupabaseAdminClient();
      isServiceRoleUsed = adminRes.isServiceRole;
      keySummary = adminRes.keyUsedSummary;

      console.log(`[Upload Init Trace] Creating signed upload URL for path "${path}" in bucket "${BUCKET}" using isServiceRole: ${isServiceRoleUsed} (key: ${keySummary})`);
      const signedRes = await adminRes.client.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
      
      if (signedRes.data?.signedUrl) {
        let sUrl = signedRes.data.signedUrl;
        if (!sUrl.startsWith('http')) {
          if (sUrl.startsWith('/storage/v1')) {
            sUrl = `${baseUrl}${sUrl}`;
          } else {
            sUrl = `${baseUrl}/storage/v1${sUrl.startsWith('/') ? '' : '/'}${sUrl}`;
          }
        }
        signedUrl = sUrl;
        token = signedRes.data.token || null;
        console.log(`[Upload Init Trace] SUCCESS: Signed upload URL generated successfully. URL: "${signedUrl.substring(0, 80)}...", Token present: ${Boolean(token)}`);
      } else if (signedRes.error) {
        signedUploadError = signedRes.error.message;
        console.warn('[Upload Init Trace] createSignedUploadUrl error:', signedUploadError);
      }
    } catch (sErr) {
      signedUploadError = sErr instanceof Error ? sErr.message : String(sErr);
      console.warn('[Upload Init Trace] createSignedUploadUrl exception:', signedUploadError);
    }

    if (!signedUrl) {
      const errMsg = signedUploadError || 'Failed to generate Supabase Storage signed upload URL.';
      console.error('[Upload Init Error]', errMsg);
      return jsonError(errMsg, 500, { isServiceRoleUsed, keySummary });
    }

    return NextResponse.json({
      success: true,
      signedUrl,
      token,
      isServiceRoleUsed,
      keySummary,
      publicUrl,
      publicId: path,
      apiKey: anonKey, // STRICTLY ONLY ANON KEY (or publishable key) SENT TO BROWSER
      supabaseUrl: baseUrl,
      path,
      bucket: BUCKET,
      maxAllowedBytes: maxSize,
    });
  } catch (err) {
    console.error('[Upload Init Exception]', err);
    return jsonError(err instanceof Error ? err.message : 'Upload initialization failed', 500);
  }
}
