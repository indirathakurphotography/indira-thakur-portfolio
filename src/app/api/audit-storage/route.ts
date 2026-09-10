import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSupabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/cmsDatabase';
import { isR2Configured, getR2Config, listR2Objects } from '@/lib/r2';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function listAllFilesRecursively(supabase: any, bucketName: string, folder = ''): Promise<{ files: any[], folders: string[] }> {
  let allFiles: any[] = [];
  let allFolders: string[] = [];

  const { data: items, error } = await supabase.storage.from(bucketName).list(folder, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !items) return { files: allFiles, folders: allFolders };

  for (const item of items) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;
    const isFolder = !item.id || !item.metadata;
    if (isFolder) {
      allFolders.push(fullPath);
      const sub = await listAllFilesRecursively(supabase, bucketName, fullPath);
      allFiles = allFiles.concat(sub.files);
      allFolders = allFolders.concat(sub.folders);
    } else {
      const publicUrlData = supabase.storage.from(bucketName).getPublicUrl(fullPath);
      allFiles.push({
        bucket: bucketName,
        name: item.name,
        path: fullPath,
        size: item.metadata?.size || (item as any).size || 0,
        createdAt: item.created_at,
        url: publicUrlData.data.publicUrl,
      });
    }
  }

  return { files: allFiles, folders: allFolders };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r2Config = getR2Config();
  const r2Ready = isR2Configured();

  const auditResult: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasMongoDBUri: !!process.env.MONGODB_URI,
      hasCloudflareAccountId: !!r2Config.accountId,
      hasR2AccessKeyId: !!r2Config.accessKeyId,
      hasR2SecretAccessKey: !!r2Config.secretAccessKey,
      r2BucketName: r2Config.bucketName,
      r2Configured: r2Ready,
      hasSupabaseUrl: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    databaseName: null,
    mongoStatus: 'Disconnected',
    mongoError: null,
    collections: {},
    cloudflareR2: {
      configured: r2Ready,
      bucket: r2Config.bucketName,
      endpoint: r2Config.endpoint,
      publicDomain: r2Config.publicDomain || 'App streaming proxy (/api/media/*)',
      files: [] as any[],
      totalFiles: 0,
      folderBreakdown: {} as Record<string, number>,
      error: null as string | null,
    },
    supabaseStorage: {
      buckets: [] as string[],
      folders: [] as string[],
      files: [] as any[],
      totalFiles: 0,
      folderBreakdown: {} as Record<string, number>,
      error: null as string | null,
      quotaStatus: 'Checking...',
    },
    currentAssetsBySection: {},
    missingAssets: [] as any[],
  };

  // 1. Audit Cloudflare R2
  if (r2Ready) {
    try {
      const r2Files = await listR2Objects('', 1000);
      auditResult.cloudflareR2.files = r2Files;
      auditResult.cloudflareR2.totalFiles = r2Files.length;

      const r2Breakdown: Record<string, number> = {};
      r2Files.forEach((f) => {
        const folder = f.key.split('/').slice(0, -1).join('/') || '[root]';
        r2Breakdown[folder] = (r2Breakdown[folder] || 0) + 1;
      });
      auditResult.cloudflareR2.folderBreakdown = r2Breakdown;
    } catch (r2Err: any) {
      auditResult.cloudflareR2.error = r2Err.message || String(r2Err);
    }
  } else {
    auditResult.missingAssets.push({
      section: 'Cloudflare R2 Storage',
      reason:
        'Cloudflare R2 credentials (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) not yet set in environment variables.',
    });
  }

  // 2. Connect to MongoDB gracefully
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const db = mongoose.connection.db;
      if (db) {
        auditResult.mongoStatus = 'Connected';
        auditResult.databaseName = db.databaseName;
        const colList = await db.listCollections().toArray();
        for (const col of colList) {
          const count = await db.collection(col.name).countDocuments();
          auditResult.collections[col.name] = count;
        }
      }
    } catch (mongoErr: any) {
      auditResult.mongoStatus = 'Connection Failed';
      auditResult.mongoError = mongoErr.message || String(mongoErr);
      auditResult.missingAssets.push({
        section: 'MongoDB Database',
        reason: `Connection failed: ${mongoErr.message || String(mongoErr)}`,
      });
    }
  } else {
    auditResult.missingAssets.push({
      section: 'System Environment',
      reason: 'MONGODB_URI environment variable is not defined in the runtime container.',
    });
  }

  // 3. Check Supabase Storage Recursively & Quota
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const supabase = getSupabase();
      const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
      if (bucketErr) {
        auditResult.supabaseStorage.error = bucketErr.message;
        if (bucketErr.message?.includes('402') || bucketErr.message?.includes('quota')) {
          auditResult.supabaseStorage.quotaStatus = 'EXCEEDED (HTTP 402 exceed_cached_egress_quota)';
        }
      } else if (buckets) {
        auditResult.supabaseStorage.buckets = buckets.map((b) => b.name);

        let allStorageFiles: any[] = [];
        let allStorageFolders: string[] = [];
        const folderBreakdown: Record<string, number> = {};

        for (const bucket of buckets) {
          const result = await listAllFilesRecursively(supabase, bucket.name, '');
          allStorageFiles = [...allStorageFiles, ...result.files];
          allStorageFolders = [...allStorageFolders, ...result.folders];

          result.files.forEach((f) => {
            const folderPath = f.path.split('/').slice(0, -1).join('/') || '[root]';
            folderBreakdown[folderPath] = (folderBreakdown[folderPath] || 0) + 1;
          });
        }

        auditResult.supabaseStorage.folders = allStorageFolders;
        auditResult.supabaseStorage.files = allStorageFiles;
        auditResult.supabaseStorage.totalFiles = allStorageFiles.length;
        auditResult.supabaseStorage.folderBreakdown = folderBreakdown;
        auditResult.supabaseStorage.quotaStatus = 'OK';
      }
    } catch (sbErr: any) {
      auditResult.supabaseStorage.error = sbErr.message || String(sbErr);
    }
  } else {
    auditResult.supabaseStorage.error = 'SUPABASE_URL is not set in runtime environment.';
    auditResult.supabaseStorage.quotaStatus = 'NOT_CONFIGURED';
  }

  // 4. Inspect Models if DB connected
  if (mongoose.connection.readyState === 1) {
    try {
      const db = mongoose.connection.db;
      if (db) {
        const About = (await import('@/models/About')).default;
        const aboutDoc = await (About as any).findOne({});
        const aboutData = aboutDoc ? (aboutDoc.toObject ? aboutDoc.toObject() : aboutDoc) : null;

        auditResult.currentAssetsBySection.about = {
          existsInDB: !!aboutData,
          image: aboutData?.image || null,
          secondaryImage: aboutData?.secondaryImage || null,
        };

        const Service = (await import('@/models/Service')).default;
        const services = await (Service as any).find({}).lean();
        auditResult.currentAssetsBySection.services = {
          count: services.length,
          items: services.map((s: any) => ({
            _id: s._id,
            name: s.name,
            image: s.image,
          })),
        };

        const GalleryImage = (await import('@/models/GalleryImage')).default;
        const galleryImages = await (GalleryImage as any).find({}).lean();
        const r2Gallery = galleryImages.filter((g: any) => (g.src || '').includes('r2.dev') || (g.src || '').includes('/api/media/'));
        const supabaseGallery = galleryImages.filter((g: any) => (g.src || '').includes('supabase') || (g.src || '').includes('storage'));

        auditResult.currentAssetsBySection.gallery = {
          total: galleryImages.length,
          r2Count: r2Gallery.length,
          supabaseCount: supabaseGallery.length,
        };

        const SiteConfig = (await import('@/models/SiteConfig')).default;
        const siteConfigDoc = await (SiteConfig as any).findOne({});
        const siteConfig = siteConfigDoc ? (siteConfigDoc.toObject ? siteConfigDoc.toObject() : siteConfigDoc) : null;

        auditResult.currentAssetsBySection.siteConfig = {
          heroImages: siteConfig?.hero?.images || [],
          hasBrandLogo: !!siteConfig?.brand?.logo,
          brandLogo: siteConfig?.brand?.logo || null,
        };

        const FileRecord = (await import('@/models/FileRecord')).default;
        const fileRecords = await (FileRecord as any).find({}).lean();
        auditResult.currentAssetsBySection.fileRecordsInDB = {
          total: fileRecords.length,
          records: fileRecords.map((f: any) => ({
            _id: f._id,
            filename: f.filename,
            url: f.url,
            folder: f.folder,
          })),
        };
      }
    } catch (modelErr: any) {
      auditResult.modelInspectionError = modelErr.message;
    }
  }

  return NextResponse.json(auditResult);
}
