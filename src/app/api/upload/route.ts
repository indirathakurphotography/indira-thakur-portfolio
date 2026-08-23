import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { uploadFile, deleteFile } from '@/lib/supabase-storage';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'gallery';

    const db = await connectToDatabase();
    if (!db) {
      if (process.env.MONGODB_URI) {
        return NextResponse.json({ files: [], error: 'Database connection unavailable' }, { status: 503 });
      }
      return NextResponse.json({ files: [] });
    }

    const FileRecord = (await import('@/models/FileRecord')).default;
    const records = await (FileRecord as any).find({ folder }).sort({ createdAt: -1 }).lean();
    if (records && records.length > 0) {
      return NextResponse.json({ files: records });
    }

    const GalleryImage = (await import('@/models/GalleryImage')).default;
    const images = await GalleryImage.find({}).sort({ createdAt: -1 }).lean();
    const mapped = (images || []).map((img: any) => ({
      url: img.src,
      publicId: img.publicId,
      filename: img.title || 'image',
      size: 0,
      type: 'image/jpeg',
      folder,
      createdAt: img.createdAt,
    }));
    return NextResponse.json({ files: mapped });
  } catch (error: any) {
    console.error('Upload GET error:', error);
    return NextResponse.json({ files: [], error: error.message }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdmin(request);
    } catch {
      return jsonError('Unauthorized', 401);
    }

    const contentType = request.headers.get('content-type') || '';
    let url = '';
    let publicId = '';
    let filename = '';
    let folder = 'gallery';
    let category = '';
    let title = '';
    let alt = '';
    let description = '';
    let width = 1200;
    let height = 1600;
    let featured = false;
    let order = 0;
    let size = 0;
    let type = 'image/jpeg';

    if (contentType.includes('application/json')) {
      const json = await request.json();
      url = json.url || json.src || '';
      publicId = json.publicId || '';
      filename = json.filename || 'uploaded_image';
      folder = json.folder || 'gallery';
      category = json.category || '';
      title = json.title || '';
      alt = json.alt || '';
      description = json.description || '';
      width = parseInt(json.width) || 1200;
      height = parseInt(json.height) || 1600;
      featured = Boolean(json.featured);
      order = parseInt(json.order) || 0;
      size = json.size || 0;
      type = json.type || 'image/jpeg';

      if (!url) return jsonError('Missing pre-uploaded image URL', 400);
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return jsonError('No file provided', 400);

      folder = (formData.get('folder') as string) || 'gallery';
      category = (formData.get('category') as string) || '';
      title = (formData.get('title') as string) || '';
      alt = (formData.get('alt') as string) || '';
      description = (formData.get('description') as string) || '';
      width = parseInt((formData.get('width') as string) || '0') || 1200;
      height = parseInt((formData.get('height') as string) || '0') || 1600;
      featured = formData.get('featured') === 'true';
      order = parseInt((formData.get('order') as string) || '0') || 0;
      filename = file.name;
      size = file.size;
      type = file.type || 'image/jpeg';

      const result = await uploadFile(file, folder);
      url = result.url;
      publicId = result.publicId;
    }

    // Persist to MongoDB when a database is configured; otherwise run in media-only mode
    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      if (!db) {
        return jsonError('Database connection unavailable. Uploaded media was not persisted.', 503);
      }

      let item: Record<string, unknown> = {
        _id: `gallery-${Date.now()}`,
        id: `gallery-${Date.now()}`,
        src: url,
        publicId,
        alt: alt || title || filename.replace(/\.[^/.]+$/, ''),
        title: title || filename.replace(/\.[^/.]+$/, ''),
        description,
        width,
        height,
        category: category || '',
        featured,
        order,
      };

      if (folder === 'gallery') {
        const GalleryImage = (await import('@/models/GalleryImage')).default;
        const createdItem: any = await GalleryImage.create({
          src: url,
          publicId,
          alt: alt || title || '',
          title: title || '',
          description,
          width,
          height,
          category: category || '',
          featured,
          order,
        });

        // Read-after-write verification
        const fresh = await GalleryImage.findById(createdItem._id).lean();
        if (!fresh) {
          return jsonError('Read-after-write verification failed: uploaded image was not persisted in MongoDB.', 500);
        }
        item = fresh as any;
      }

      const FileRecord = (await import('@/models/FileRecord')).default;
      await FileRecord.create({
        url,
        publicId,
        filename: filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
        originalName: filename,
        size,
        type,
        folder,
      });

      return NextResponse.json(item, { status: 201 });
    }

    // Media-only mode: no MongoDB configured
    return NextResponse.json({
      _id: `gallery-${Date.now()}`,
      id: `gallery-${Date.now()}`,
      src: url,
      publicId,
      alt: alt || title || filename.replace(/\.[^/.]+$/, ''),
      title: title || filename.replace(/\.[^/.]+$/, ''),
      description,
      width,
      height,
      category: category || '',
      featured,
      order,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return jsonError(`Upload failed: ${error.message || 'Unknown error'}`, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    try {
      await requireAdmin(request);
    } catch {
      return jsonError('You must be logged in to delete images', 401);
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return jsonError('No file identifier provided', 400);
    }

    await deleteFile(publicId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return jsonError(`Delete failed: ${error.message || 'Unknown error'}`, 500);
  }
}
