import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { deleteFile, getPublicUrl, uploadFile } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

const BUCKET = 'images';

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'uploads';

    await connectToDatabase();
    const FileRecord = (await import('@/models/FileRecord')).default;
    const dbFiles = await FileRecord.find({ folder: new RegExp(`^${folder}`) }).sort({ createdAt: -1 }).lean();

    const fileMap = new Map<string, Record<string, unknown>>();

    for (const file of dbFiles) {
      fileMap.set(file.url, {
        _id: file._id.toString(),
        id: file._id.toString(),
        url: file.url,
        publicId: file.publicId,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        type: file.type,
        folder: file.folder,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      });
    }

    const supabase0 = getSupabase();
    const { data: storageFiles, error } = await supabase0.storage
      .from(BUCKET)
      .list(folder, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

    if (!error && storageFiles) {
      for (const item of storageFiles) {
        const path = `${folder}/${item.name}`;
        const url = getPublicUrl(path);
        if (!fileMap.has(url)) {
          fileMap.set(url, {
            id: path,
            url,
            publicId: path,
            filename: item.name,
            originalName: item.name,
            size: item.metadata?.size || 0,
            type: item.metadata?.mimetype || 'application/octet-stream',
            folder,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          });
        }
      }
    }

    return NextResponse.json({ files: Array.from(fileMap.values()) });
  } catch (error) {
    console.error('Files list error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let url = '';
    let publicId = '';
    let filename = '';
    let originalName = '';
    let size = 0;
    let type = 'image/jpeg';
    let folder = 'uploads';
    let category = '';
    let title = '';
    let alt = '';
    let description = '';
    let width = 1200;
    let height = 1600;
    let featured = false;
    let order = 0;

    if (contentType.includes('application/json')) {
      const json = await request.json();
      url = json.url || json.src || '';
      publicId = json.publicId || '';
      filename = json.filename || 'uploaded_image';
      originalName = json.originalName || filename;
      size = json.size || 0;
      type = json.type || 'image/jpeg';
      folder = json.folder || 'uploads';
      category = json.category || '';
      title = json.title || '';
      alt = json.alt || '';
      description = json.description || '';
      width = parseInt(json.width) || 1200;
      height = parseInt(json.height) || 1600;
      featured = Boolean(json.featured);
      order = parseInt(json.order) || 0;

      if (!url) {
        return NextResponse.json({ error: 'Missing pre-uploaded URL' }, { status: 400 });
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      folder = (formData.get('folder') as string) || 'uploads';
      category = (formData.get('category') as string) || '';
      title = (formData.get('title') as string) || '';
      alt = (formData.get('alt') as string) || '';
      description = (formData.get('description') as string) || '';
      width = parseInt((formData.get('width') as string) || '1200') || 1200;
      height = parseInt((formData.get('height') as string) || '1600') || 1600;
      featured = formData.get('featured') === 'true';
      order = parseInt((formData.get('order') as string) || '0') || 0;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const result = await uploadFile(file, folder);
      url = result.url;
      publicId = result.publicId;
      filename = file.name;
      originalName = file.name;
      size = file.size;
      type = file.type || 'image/jpeg';
      width = result.width || width;
      height = result.height || height;
    }

    let dbFileId = `file-${Date.now()}`;

    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        const FileRecord = (await import('@/models/FileRecord')).default;
        const dbFile = await FileRecord.create({
          url,
          publicId,
          filename: filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
          originalName,
          size,
          type,
          folder,
        });
        dbFileId = dbFile._id.toString();

        if (folder === 'gallery' || folder === 'site' || category || title) {
          try {
            const GalleryImage = (await import('@/models/GalleryImage')).default;
            await GalleryImage.create({
              src: url,
              publicId,
              alt: alt || title || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              title: title || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              description,
              width,
              height,
              category: category || 'Other',
              featured,
              order,
            });
          } catch (galleryErr) {
            console.warn('[Files API] GalleryImage creation skipped/failed:', galleryErr);
          }
        }
      } catch (dbErr) {
        console.warn('[Files API] MongoDB sync warning:', dbErr);
      }
    }

    return NextResponse.json(
      {
        _id: dbFileId,
        id: dbFileId,
        url,
        src: url,
        publicId,
        filename,
        originalName,
        size,
        type,
        folder,
        width,
        height,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: `Upload failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ error: 'Missing file identifier' }, { status: 400 });
    }

    await deleteFile(publicId);

    await connectToDatabase();
    const FileRecord = (await import('@/models/FileRecord')).default;
    await FileRecord.deleteOne({ publicId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
