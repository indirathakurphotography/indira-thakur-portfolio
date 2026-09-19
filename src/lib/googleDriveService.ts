/**
 * Google Drive Integration & Audit Service
 * 
 * Supports:
 * - Google Drive API v3 browsing with OAuth access token
 * - Public Drive folder parser fallback
 * - Comparison against existing gallery and Cloudflare R2 media
 * - Canonical category resolution
 */

export interface DriveFolderFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  width?: number;
  height?: number;
  thumbnailLink?: string;
  directUrl: string;
  folderId?: string;
}

export interface DriveAuditFileResult {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  directUrl: string;
  folderId?: string;
  folderName?: string;
  status: 'already_exists' | 'missing' | 'duplicate_or_conflict';
  matchType?: string;
  existingRecordId?: string;
  existingSrc?: string;
  existingCategory?: string;
  canonicalCategory: string;
  canonicalCategoryLabel: string;
  r2Status?: 'present' | 'missing';
  existingR2Key?: string;
  r2Action?: 'link' | 'upload';
}

export interface DriveAuditSummary {
  totalFilesChecked: number;
  existingCount: number;
  missingCount: number;
  conflictCount: number;
  r2AlreadyPresentCount?: number;
  r2NeedsUploadCount?: number;
  folderBreakdowns: {
    folderId: string;
    folderName: string;
    totalFiles: number;
    existing: number;
    missing: number;
  }[];
  categoryProposals: Record<string, number>;
}

export const CANONICAL_CATEGORIES = [
  { key: 'toddler-child', label: 'Toddler & Child Photography' },
  { key: 'birth-photography', label: 'Birth Photography' },
  { key: 'brand-collaboration', label: 'Brand Collaboration' },
  { key: 'newborn', label: 'Newborn' },
  { key: 'maternity', label: 'Maternity' },
  { key: 'portrait', label: 'Portrait' },
  { key: 'weddings', label: 'Weddings' },
  { key: 'events', label: 'Events' },
] as const;

export const DEFAULT_DRIVE_FOLDERS = [
  {
    name: 'Newborns',
    folderId: '1D-rTXVnmdOw4OcEFJMaBmM0OmrNFaHCj',
    url: 'https://drive.google.com/drive/folders/1D-rTXVnmdOw4OcEFJMaBmM0OmrNFaHCj',
    defaultCategory: 'newborn',
  },
  {
    name: 'Brand collabs',
    folderId: '1ol39emyIke0Q9dxc3IFEtW1IBYe4wtc6',
    url: 'https://drive.google.com/drive/folders/1ol39emyIke0Q9dxc3IFEtW1IBYe4wtc6',
    defaultCategory: 'brand-collaboration',
  },
  {
    name: 'Portraits, Maternity & Birth photography',
    folderId: '1Mmg6uyQZqnIGqaQunqZw3hFMm2srGtCv',
    url: 'https://drive.google.com/drive/folders/1Mmg6uyQZqnIGqaQunqZw3hFMm2srGtCv',
    defaultCategory: 'portrait', // auto-refines by file naming
  },
  {
    name: 'Private / Client Archive',
    folderId: '1ylo5VR3_AIfd8hQSavGANVmBv00bIk5l',
    url: 'https://drive.google.com/drive/folders/1ylo5VR3_AIfd8hQSavGANVmBv00bIk5l',
    defaultCategory: 'portrait',
  },
];

export function extractDriveFolderId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  // If raw ID (alphanumeric 20-55 chars)
  if (/^[a-zA-Z0-9_-]{25,55}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  // /folders/{FOLDER_ID}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{25,55})/i);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // id={FOLDER_ID}
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,55})/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  return null;
}

export function inferCategoryFromContext(folderName?: string, fileName?: string): {
  key: string;
  label: string;
} {
  const fLower = (folderName || '').toLowerCase();
  const nameLower = (fileName || '').toLowerCase();

  // 1. Folder Brand Collaboration
  if (fLower.includes('brand') || fLower.includes('collab')) {
    return { key: 'brand-collaboration', label: 'Brand Collaboration' };
  }

  // 2. Folder Newborns
  if (fLower.includes('newborn')) {
    return { key: 'newborn', label: 'Newborn' };
  }

  // 3. Maternity cues
  if (
    nameLower.includes('maternity') ||
    nameLower.includes('pregnancy') ||
    nameLower.includes('bump') ||
    nameLower.startsWith('img_04') ||
    nameLower.startsWith('img_05') ||
    nameLower.startsWith('img_19') ||
    nameLower.startsWith('img_20')
  ) {
    return { key: 'maternity', label: 'Maternity' };
  }

  // 4. Toddler / Child cues
  if (nameLower.includes('toddler') || nameLower.includes('child') || nameLower.includes('milestone')) {
    return { key: 'toddler-child', label: 'Toddler & Child Photography' };
  }

  // 5. Birth Photography cues
  if (nameLower.includes('birth') || nameLower.includes('delivery') || nameLower.includes('labor')) {
    return { key: 'birth-photography', label: 'Birth Photography' };
  }

  // 6. Wedding cues
  if (nameLower.includes('wedding') || nameLower.includes('bride') || nameLower.includes('groom')) {
    return { key: 'weddings', label: 'Weddings' };
  }

  // 7. Event cues
  if (nameLower.includes('event') || nameLower.includes('ceremony')) {
    return { key: 'events', label: 'Events' };
  }

  // 8. If in the composite folder "Portraits, Maternity & Birth photography":
  if (fLower.includes('maternity')) {
    return { key: 'maternity', label: 'Maternity' };
  }
  if (fLower.includes('birth')) {
    return { key: 'birth-photography', label: 'Birth Photography' };
  }

  // Default to Portrait
  return { key: 'portrait', label: 'Portrait' };
}

/**
 * Parses Google Drive HTML response using the internal _DRIVE_ivd structure.
 */
export function parseDriveHtmlFolder(html: string, folderId: string): DriveFolderFile[] {
  try {
    const marker = "_DRIVE_ivd\x27] = \x27";
    const startIdx = html.indexOf(marker);
    if (startIdx === -1) return [];

    const strStart = startIdx + marker.length;
    const strEnd = html.indexOf("\x27;if (wind", strStart);
    if (strEnd === -1) return [];

    const rawStr = html.substring(strStart, strEnd);
    const unescaped = rawStr
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\\//g, '/');

    const parsed = JSON.parse(unescaped);
    const entries = parsed[0] || [];

    return entries
      .filter((e: any) => {
        const mime = e[3] || '';
        return (
          mime.startsWith('image/') ||
          /\.(jpg|jpeg|png|webp|avif|heic)$/i.test(e[2] || '')
        );
      })
      .map((entry: any) => ({
        id: entry[0],
        folderId: entry[1] ? entry[1][0] : folderId,
        name: entry[2],
        mimeType: entry[3] || 'image/jpeg',
        size: entry[13] || 0,
        directUrl: `https://lh3.googleusercontent.com/d/${entry[0]}`,
      }));
  } catch (err) {
    console.warn('[GoogleDriveService] Error parsing folder HTML:', err);
    return [];
  }
}

/**
 * Fetch folder files via Google Drive API v3 (when access token is available)
 * or via public folder scraper fallback.
 */
export async function fetchDriveFolderFiles(
  folderId: string,
  accessToken?: string | null
): Promise<{ files: DriveFolderFile[]; folderName: string }> {
  // 1. Try Google Drive API v3 if accessToken is present
  if (accessToken) {
    try {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`);
      const fields = encodeURIComponent('files(id,name,mimeType,size,imageMediaMetadata,thumbnailLink,webContentLink,parents)');
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=1000`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const files: DriveFolderFile[] = (data.files || [])
          .filter((f: any) => f.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif)$/i.test(f.name || ''))
          .map((f: any) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType || 'image/jpeg',
            size: f.size ? parseInt(f.size, 10) : undefined,
            width: f.imageMediaMetadata?.width,
            height: f.imageMediaMetadata?.height,
            thumbnailLink: f.thumbnailLink,
            directUrl: `https://lh3.googleusercontent.com/d/${f.id}`,
            folderId,
          }));

        // Try getting folder metadata for clean name
        let folderName = 'Google Drive Folder';
        try {
          const metaRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (metaRes.ok) {
            const meta = await metaRes.json();
            if (meta.name) folderName = meta.name;
          }
        } catch {}

        return { files, folderName };
      }
    } catch (apiErr) {
      console.warn('[GoogleDriveService] Drive API fetch failed, trying public fallback:', apiErr);
    }
  }

  // 2. Public folder scrape fallback
  try {
    const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      let folderName = 'Google Drive Folder';
      const titleMatch = html.match(/<title>([^<]+?)(?:\s*-\s*Google\s*(?:Drive|雲端硬碟))?<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        folderName = titleMatch[1].replace(/\s*-\s*Google.*$/i, '').trim();
      }

      const files = parseDriveHtmlFolder(html, folderId);
      return { files, folderName };
    }
  } catch (err) {
    console.warn('[GoogleDriveService] Public folder fetch failed:', err);
  }

  return { files: [], folderName: 'Drive Folder' };
}

/**
 * Normalizes filenames for consistent comparison:
 * Strips extension, removes timestamps prefixes, removes non-alphanumerics, lowercases.
 */
export function normalizeMediaIdentity(str: string): string {
  if (!str) return '';
  let clean = str.split('?')[0].split('#')[0];
  const lastSegment = clean.split('/').pop() || clean;
  // Remove extension
  clean = lastSegment.replace(/\.[a-zA-Z0-9]+$/, '');
  // Remove leading epoch/timestamp prefix: e.g. 1785139692503-
  clean = clean.replace(/^\d{10,15}[-_]/, '');
  // Remove spaces, hyphens, underscores
  return clean.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}
