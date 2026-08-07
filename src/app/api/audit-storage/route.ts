import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSupabase } from '@/lib/supabase';
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
  const auditResult: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasMongoDBUri: !!process.env.MONGODB_URI,
      hasSupabaseUrl: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    databaseName: null,
    mongoStatus: 'Disconnected',
    mongoError: null,
    collections: {},
    supabaseStorage: {
      buckets: [],
      folders: [],
      files: [],
      totalFiles: 0,
      folderBreakdown: {},
      error: null,
    },
    currentAssetsBySection: {},
    autoRestored: [],
    missingAssets: [],
  };

  // 1. Connect to MongoDB gracefully
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

  // 2. Check Supabase Storage Recursively
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const supabase = getSupabase();
      const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
      if (bucketErr) {
        auditResult.supabaseStorage.error = bucketErr.message;
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
      }
    } catch (sbErr: any) {
      auditResult.supabaseStorage.error = sbErr.message || String(sbErr);
    }
  } else {
    auditResult.missingAssets.push({
      section: 'Supabase Storage',
      reason: 'SUPABASE_URL is not set in runtime environment.',
    });
  }

  // 3. Inspect Models if DB connected
  if (mongoose.connection.readyState === 1) {
    try {
      const db = mongoose.connection.db;
      if (db) {
        // --- About ---
        const About = (await import('@/models/About')).default;
        const aboutDoc = await About.findOne({});
        const aboutData = aboutDoc ? aboutDoc.toObject() : null;
        const aboutImageIsUnsplash = (aboutData?.image || '').includes('unsplash.com');
        const aboutSecImageIsUnsplash = (aboutData?.secondaryImage || '').includes('unsplash.com');

        auditResult.currentAssetsBySection.about = {
          existsInDB: !!aboutData,
          image: aboutData?.image || null,
          secondaryImage: aboutData?.secondaryImage || null,
          isUnsplashPlaceholder: aboutImageIsUnsplash || aboutSecImageIsUnsplash,
        };

        // Auto-restore About if matching file in Supabase
        if (aboutImageIsUnsplash && auditResult.supabaseStorage.files.length > 0) {
          const matchingAboutImg = auditResult.supabaseStorage.files.find(
            (f: any) => f.path.toLowerCase().includes('about') || f.name.toLowerCase().includes('indira')
          );
          if (matchingAboutImg && aboutDoc) {
            aboutDoc.image = matchingAboutImg.url;
            await aboutDoc.save();
            auditResult.autoRestored.push(`About main image restored from Supabase Storage: ${matchingAboutImg.url}`);
            auditResult.currentAssetsBySection.about.image = matchingAboutImg.url;
            auditResult.currentAssetsBySection.about.isUnsplashPlaceholder = false;
          }
        }

        // --- Services ---
        const Service = (await import('@/models/Service')).default;
        const services = await Service.find({}).lean();
        const unsplashServices = services.filter((s: any) => (s.image || '').includes('unsplash.com'));

        auditResult.currentAssetsBySection.services = {
          count: services.length,
          unsplashPlaceholderCount: unsplashServices.length,
          items: services.map((s: any) => ({
            _id: s._id,
            name: s.name,
            image: s.image,
            isUnsplash: (s.image || '').includes('unsplash.com'),
          })),
        };

        // --- Gallery Images ---
        const GalleryImage = (await import('@/models/GalleryImage')).default;
        const galleryImages = await GalleryImage.find({}).lean();
        const unsplashGallery = galleryImages.filter((g: any) => (g.src || '').includes('unsplash.com'));
        const supabaseGallery = galleryImages.filter((g: any) => (g.src || '').includes('supabase') || (g.src || '').includes('storage'));
        const cloudinaryGallery = galleryImages.filter((g: any) => (g.src || '').includes('res.cloudinary.com'));

        auditResult.currentAssetsBySection.gallery = {
          total: galleryImages.length,
          unsplashCount: unsplashGallery.length,
          supabaseCount: supabaseGallery.length,
          cloudinaryCount: cloudinaryGallery.length,
        };

        // --- SiteConfig ---
        const SiteConfig = (await import('@/models/SiteConfig')).default;
        const siteConfigDoc = await SiteConfig.findOne({});
        const siteConfig = siteConfigDoc ? siteConfigDoc.toObject() : null;

        auditResult.currentAssetsBySection.siteConfig = {
          heroImages: siteConfig?.hero?.images || [],
          hasBrandLogo: !!siteConfig?.brand?.logo,
          brandLogo: siteConfig?.brand?.logo || null,
        };

        // --- FileRecord ---
        const FileRecord = (await import('@/models/FileRecord')).default;
        const fileRecords = await FileRecord.find({}).lean();
        auditResult.currentAssetsBySection.fileRecordsInDB = {
          total: fileRecords.length,
          records: fileRecords.map((f: any) => ({
            _id: f._id,
            filename: f.filename,
            url: f.url,
            provider: f.provider,
            category: f.category,
          })),
        };
      }
    } catch (modelErr: any) {
      auditResult.modelInspectionError = modelErr.message;
    }
  }

  return NextResponse.json(auditResult);
}

