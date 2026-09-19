import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import {
  DEFAULT_DRIVE_FOLDERS,
  extractDriveFolderId,
  fetchDriveFolderFiles,
  inferCategoryFromContext,
  normalizeMediaIdentity,
  DriveAuditFileResult,
  DriveAuditSummary,
  DriveFolderFile,
} from '@/lib/googleDriveService';
import {
  fetchAllGalleryImages,
  createGalleryImageItem,
  clearServerGalleryStorageCache,
} from '@/lib/galleryStorage';
import { formatCategory, normalizeCategory } from '@/lib/categoryUtils';
import { triggerRevalidation } from '@/lib/revalidate';
import { isR2Configured, uploadToR2, getR2PublicUrl, listR2Objects } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET() {
  try {
    const existing = await fetchAllGalleryImages();
    const categories: Record<string, number> = {};
    for (const item of existing) {
      const cat = formatCategory(item.category) || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    }

    return NextResponse.json({
      defaultFolders: DEFAULT_DRIVE_FOLDERS,
      totalGalleryImages: existing.length,
      categoryCounts: categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin authorization check
    try {
      await requireAdmin(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      folderUrls = DEFAULT_DRIVE_FOLDERS.map((f) => f.url),
      accessToken,
      dryRun = true,
      selectedFileIds,
      customCategoryOverrides,
    } = body;

    // 1. Fetch current gallery records
    const currentGallery = await fetchAllGalleryImages();
    const driveIdIndex = new Map<string, any>();
    const normalizedNameIndex = new Map<string, any>();
    const srcIndex = new Map<string, any>();

    // Helper to index existing gallery records
    const indexGalleryItem = (item: any) => {
      const src = item.src || item.url || '';
      const thumb = item.thumbnail || '';
      const pubId = item.publicId || item.key || '';
      const filename = item.filename || item.originalName || item.title || '';

      if (src) srcIndex.set(src.toLowerCase(), item);
      if (thumb) srcIndex.set(thumb.toLowerCase(), item);
      if (pubId) srcIndex.set(pubId.toLowerCase(), item);

      // Extract drive ID from URL
      const driveMatch = (src + ' ' + thumb + ' ' + pubId).match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/);
      if (driveMatch) {
        driveIdIndex.set(driveMatch[1], item);
      }

      // Normalized identity
      const normSrc = normalizeMediaIdentity(src);
      const normThumb = normalizeMediaIdentity(thumb);
      const normPub = normalizeMediaIdentity(pubId);
      const normFile = normalizeMediaIdentity(filename);

      if (normSrc) normalizedNameIndex.set(normSrc, item);
      if (normThumb) normalizedNameIndex.set(normThumb, item);
      if (normPub) normalizedNameIndex.set(normPub, item);
      if (normFile) normalizedNameIndex.set(normFile, item);
    };

    for (const item of currentGallery) {
      indexGalleryItem(item);
    }

    // Index Cloudflare R2 objects separately to identify existing storage assets
    const r2ObjectsMap = new Map<string, { key: string; size: number }>();
    if (isR2Configured()) {
      try {
        const r2Items = await listR2Objects('', 2000);
        for (const obj of r2Items) {
          const key = (obj as any).key || (obj as any).Key || '';
          if (!key) continue;
          const normKey = normalizeMediaIdentity(key);
          if (normKey && !r2ObjectsMap.has(normKey)) {
            r2ObjectsMap.set(normKey, { key, size: (obj as any).size || (obj as any).Size || 0 });
          }
        }
      } catch (err: any) {
        console.warn('[DriveImportRoute] R2 indexing notice:', err.message);
      }
    }

    // 2. Process each Drive folder
    const allAuditResults: DriveAuditFileResult[] = [];
    const folderBreakdowns: DriveAuditSummary['folderBreakdowns'] = [];
    let nextOrder = currentGallery.length > 0 ? Math.max(...currentGallery.map((g) => g.order || 0)) + 1 : 1;

    for (const urlOrId of folderUrls) {
      const folderId = extractDriveFolderId(urlOrId);
      if (!folderId) continue;

      const { files, folderName } = await fetchDriveFolderFiles(folderId, accessToken);
      let folderExisting = 0;
      let folderMissing = 0;

      for (const file of files) {
        const normFileName = normalizeMediaIdentity(file.name);

        // Check 1: Match by exact Google Drive file ID or source in existing gallery records
        let matchedRecord = driveIdIndex.get(file.id);
        let matchType = '';

        if (matchedRecord) {
          matchType = 'exact-drive-id';
        } else {
          // Check 2: Match by normalized filename/identity across gallery records
          matchedRecord = normalizedNameIndex.get(normFileName);
          if (matchedRecord) {
            matchType = 'gallery-filename-match';
          }
        }

        // Canonical category resolution
        const customOverride = customCategoryOverrides?.[file.id];
        const inferred = inferCategoryFromContext(folderName, file.name);
        const targetCategoryKey = customOverride || inferred.key;
        const targetCategoryLabel = formatCategory(targetCategoryKey);

        if (matchedRecord) {
          folderExisting++;
          allAuditResults.push({
            driveFileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            directUrl: file.directUrl,
            folderId,
            folderName,
            status: 'already_exists',
            matchType,
            existingRecordId: matchedRecord._id || matchedRecord.id,
            existingSrc: matchedRecord.src,
            existingCategory: matchedRecord.category,
            canonicalCategory: matchedRecord.category || targetCategoryKey,
            canonicalCategoryLabel: formatCategory(matchedRecord.category || targetCategoryKey),
          });
        } else {
          folderMissing++;
          // Check whether the asset is already in R2 storage
          const r2Obj = r2ObjectsMap.get(normFileName);
          const r2Status: 'present' | 'missing' = r2Obj ? 'present' : 'missing';
          const r2Action: 'link' | 'upload' = r2Obj ? 'link' : 'upload';

          allAuditResults.push({
            driveFileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            directUrl: file.directUrl,
            folderId,
            folderName,
            status: 'missing',
            canonicalCategory: targetCategoryKey,
            canonicalCategoryLabel: targetCategoryLabel,
            r2Status,
            existingR2Key: r2Obj ? r2Obj.key : undefined,
            r2Action,
          });
        }
      }

      folderBreakdowns.push({
        folderId,
        folderName,
        totalFiles: files.length,
        existing: folderExisting,
        missing: folderMissing,
      });
    }

    // 3. Aggregate Audit Summary
    const totalFilesChecked = allAuditResults.length;
    const existingCount = allAuditResults.filter((r) => r.status === 'already_exists').length;
    const missingCount = allAuditResults.filter((r) => r.status === 'missing').length;
    const conflictCount = allAuditResults.filter((r) => r.status === 'duplicate_or_conflict').length;
    const r2AlreadyPresentCount = allAuditResults.filter((r) => r.status === 'missing' && r.r2Action === 'link').length;
    const r2NeedsUploadCount = allAuditResults.filter((r) => r.status === 'missing' && r.r2Action === 'upload').length;

    const categoryProposals: Record<string, number> = {};
    for (const r of allAuditResults.filter((r) => r.status === 'missing')) {
      categoryProposals[r.canonicalCategoryLabel] = (categoryProposals[r.canonicalCategoryLabel] || 0) + 1;
    }

    const auditSummary: DriveAuditSummary = {
      totalFilesChecked,
      existingCount,
      missingCount,
      conflictCount,
      r2AlreadyPresentCount,
      r2NeedsUploadCount,
      folderBreakdowns,
      categoryProposals,
    };

    // If dryRun requested, return the full comparison report immediately
    if (dryRun) {
      return NextResponse.json({
        mode: 'audit',
        summary: auditSummary,
        results: allAuditResults,
      });
    }

    // 4. Perform actual Import of Missing Files
    const filesToImport = allAuditResults.filter((r) => {
      if (r.status !== 'missing') return false;
      if (Array.isArray(selectedFileIds) && selectedFileIds.length > 0) {
        return selectedFileIds.includes(r.driveFileId);
      }
      return true;
    });

    const importedRecords: any[] = [];
    const failures: Array<{ fileName: string; driveFileId: string; error: string }> = [];
    let newlyUploadedR2Count = 0;
    let linkedExistingR2Count = 0;

    for (const item of filesToImport) {
      try {
        const cleanTitle = item.fileName
          .replace(/\.[a-zA-Z0-9]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();

        let finalSrc = '';
        let finalThumb = '';
        let finalPublicId = '';
        let actionTaken: 'linked_existing_r2' | 'uploaded_to_r2' = 'linked_existing_r2';

        if (item.r2Action === 'link' && item.existingR2Key) {
          // Object already exists in Cloudflare R2 - link directly without re-uploading
          finalPublicId = item.existingR2Key;
          finalSrc = getR2PublicUrl(item.existingR2Key);
          finalThumb = getR2PublicUrl(item.existingR2Key);
          linkedExistingR2Count++;
          actionTaken = 'linked_existing_r2';
        } else {
          // Binary genuinely does not exist in R2 - download from Drive and stream directly into R2
          const sanitizedName = item.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const r2Key = `gallery/${Date.now()}-${sanitizedName}`;

          const driveRes = await fetch(item.directUrl);
          if (!driveRes.ok) {
            throw new Error(`Failed to download from Google Drive (HTTP ${driveRes.status})`);
          }
          const arrayBuffer = await driveRes.arrayBuffer();
          const fileBuffer = Buffer.from(arrayBuffer);

          const uploadResult = await uploadToR2(
            r2Key,
            fileBuffer,
            item.mimeType || 'image/jpeg',
            { originalFileName: item.fileName, importedFromDrive: item.driveFileId }
          );

          finalPublicId = uploadResult.key;
          finalSrc = uploadResult.url;
          finalThumb = uploadResult.url;
          newlyUploadedR2Count++;
          actionTaken = 'uploaded_to_r2';
        }

        const created = await createGalleryImageItem({
          src: finalSrc,
          thumbnail: finalThumb,
          publicId: finalPublicId,
          title: cleanTitle,
          alt: `${item.canonicalCategoryLabel} fine art photograph by Indira Thakur`,
          category: item.canonicalCategory,
          order: nextOrder++,
          featured: false,
          width: 1200,
          height: 1600,
        });

        importedRecords.push({
          ...created,
          actionTaken,
          r2Key: finalPublicId,
          driveFileId: item.driveFileId,
          fileName: item.fileName,
        });
      } catch (err: any) {
        console.error(`[DriveImportRoute] Failed to import "${item.fileName}":`, err);
        failures.push({
          fileName: item.fileName,
          driveFileId: item.driveFileId,
          error: err.message || 'Unknown error',
        });
      }
    }

    clearServerGalleryStorageCache();
    triggerRevalidation();

    // 5. Fetch updated gallery records & verify category visibility
    const updatedGallery = await fetchAllGalleryImages();
    const finalCategoryCounts: Record<string, number> = {};
    for (const item of updatedGallery) {
      const cat = formatCategory(item.category) || 'Uncategorized';
      finalCategoryCounts[cat] = (finalCategoryCounts[cat] || 0) + 1;
    }

    // Verify each imported record is present in the updated gallery
    const verifiedImportedIds = new Set(updatedGallery.map((g) => g._id));
    const allImportedVerified = importedRecords.every((rec) => verifiedImportedIds.has(rec._id));

    return NextResponse.json({
      mode: 'import',
      success: failures.length === 0,
      summary: auditSummary,
      stats: {
        totalDriveImagesScanned: totalFilesChecked,
        skippedCount: existingCount,
        missingCount,
        newlyUploadedR2Count,
        linkedExistingR2Count,
        createdGalleryRecordsCount: importedRecords.length,
        failuresCount: failures.length,
        allImportedVerified,
      },
      failures,
      finalTotalGalleryImages: updatedGallery.length,
      finalCategoryCounts,
      importedFiles: importedRecords.map((rec) => ({
        id: rec._id,
        fileName: rec.fileName,
        actionTaken: rec.actionTaken,
        publicId: rec.publicId,
        src: rec.src,
        category: rec.category,
        title: rec.title,
      })),
    });
  } catch (error: any) {
    console.error('[DriveImportRoute] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process Google Drive import' }, { status: 500 });
  }
}
