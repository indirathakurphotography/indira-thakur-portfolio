import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdminClient, getSupabaseUrl } from '@/lib/supabase';
import { connectToDatabase } from '@/lib/mongodb';
import { validateVideoFile } from '@/lib/imageValidation';
import { MAX_VIDEO_UPLOAD_SIZE, MAX_VIDEO_UPLOAD_SIZE_MB } from '@/lib/uploadConstants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // Allow sufficient time for video processing

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length') || 'unknown';
  const contentType = request.headers.get('content-type') || '';
  console.log(`[API /api/upload/video] POST Request Received. Content-Length: ${contentLength} bytes, Content-Type: ${contentType}`);

  try {
    const user = requireAuth(request);
    if (!user) {
      console.warn('[API /api/upload/video] Unauthorized request attempt');
      return jsonError('Unauthorized access. Admin login required.', 401);
    }

    // Handle JSON body (for Google Drive import or External URL processing)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileId, accessToken, externalUrl, source, filename } = body;

      if (source === 'google-drive') {
        if (!fileId) return jsonError('Google Drive File ID is required', 400);

        // Fetch file metadata from Google Drive API
        const metaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          }
        );

        if (!metaRes.ok) {
          const metaErr = await metaRes.text();
          console.error('[Google Drive Meta Fetch Error]:', metaErr);
          return jsonError('Could not access Google Drive file. Ensure file is shared or login with Google.', 400);
        }

        const metadata = await metaRes.json();
        const mimeType = metadata.mimeType || 'video/mp4';
        const fileSize = parseInt(metadata.size || '0', 10);

        if (fileSize > MAX_VIDEO_UPLOAD_SIZE) {
          return jsonError(
            `File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${MAX_VIDEO_UPLOAD_SIZE_MB} MB.`,
            400
          );
        }

        // Stream file content from Google Drive API
        const mediaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          }
        );

        if (!mediaRes.ok) {
          return jsonError('Failed to download video content from Google Drive.', 500);
        }

        const arrayBuffer = await mediaRes.arrayBuffer();
        const driveFileName = metadata.name || filename || `drive-video-${Date.now()}.mp4`;
        const driveFile = new File([arrayBuffer], driveFileName, { type: mimeType });

        const { client } = getSupabaseAdminClient();
        const videoPath = `videos/testimonials/${Date.now()}-${driveFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadErr } = await client.storage.from('images').upload(videoPath, arrayBuffer, {
          contentType: mimeType || 'video/mp4',
          upsert: true,
        });
        if (uploadErr) throw new Error(uploadErr.message);
        const uploadRes = {
          url: `${getSupabaseUrl()}/storage/v1/object/public/images/${videoPath}`,
          publicId: videoPath,
        };

        // Record file in MongoDB if enabled
        if (process.env.MONGODB_URI) {
          try {
            await connectToDatabase();
            const FileRecord = (await import('@/models/FileRecord')).default;
            await FileRecord.create({
              url: uploadRes.url,
              publicId: uploadRes.publicId,
              filename: driveFileName.replace(/[^a-zA-Z0-9.-]/g, '_'),
              originalName: driveFileName,
              size: fileSize || arrayBuffer.byteLength,
              type: mimeType,
              folder: 'videos/testimonials',
            }).catch(() => {});
          } catch (dbErr) {
            console.warn('[Video Upload API] MongoDB FileRecord sync warning:', dbErr);
          }
        }

        return NextResponse.json({
          videoUrl: uploadRes.url,
          publicId: uploadRes.publicId,
          fileSize: fileSize || arrayBuffer.byteLength,
          uploadSource: 'google-drive',
          success: true,
        }, { status: 201 });
      }

      if (source === 'url') {
        if (!externalUrl) return jsonError('External video URL is required', 400);

        // Validate direct mp4 URL
        if (!externalUrl.toLowerCase().includes('.mp4') && !externalUrl.startsWith('http')) {
          return jsonError('External video URL must be a valid direct .mp4 link', 400);
        }

        return NextResponse.json({
          videoUrl: externalUrl,
          publicId: '',
          fileSize: 0,
          uploadSource: 'url',
          success: true,
        }, { status: 200 });
      }

      return jsonError('Invalid source type provided', 400);
    }

    // Handle Multipart Form Uploads (Device File Upload)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const duration = (formData.get('duration') as string) || '';
    const folder = (formData.get('folder') as string) || 'videos/testimonials';

    if (!file) {
      return jsonError('No video file provided', 400);
    }

    // Validate video file specs
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      return jsonError(validation.error || 'Invalid video file', 400);
    }

    const { client } = getSupabaseAdminClient();
    const videoPath = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const videoArrayBuffer = await file.arrayBuffer();
    const { error: deviceUploadErr } = await client.storage.from('images').upload(videoPath, videoArrayBuffer, {
      contentType: file.type || 'video/mp4',
      upsert: true,
    });
    if (deviceUploadErr) throw new Error(deviceUploadErr.message);
    const uploadRes = {
      url: `${getSupabaseUrl()}/storage/v1/object/public/images/${videoPath}`,
      publicId: videoPath,
    };

    // Sync FileRecord in MongoDB if available
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const FileRecord = (await import('@/models/FileRecord')).default;
        await FileRecord.create({
          url: uploadRes.url,
          publicId: uploadRes.publicId,
          filename: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
          originalName: file.name,
          size: file.size,
          type: file.type,
          folder,
        }).catch(() => {});
      } catch (dbErr) {
        console.warn('[Video Upload API] FileRecord creation warning:', dbErr);
      }
    }

    return NextResponse.json({
      videoUrl: uploadRes.url,
      publicId: uploadRes.publicId,
      fileSize: file.size,
      duration: duration,
      uploadSource: 'device',
      success: true,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Video Upload API Error]:', error);
    return jsonError(`Video upload failed: ${error.message || 'Server error'}`, 500);
  }
}
