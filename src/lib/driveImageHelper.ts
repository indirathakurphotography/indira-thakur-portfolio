/**
 * Utility functions for extracting, validating, and converting Google Drive URLs
 * into direct, high-performance image source URLs.
 */

export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Direct file ID if user pasted a raw ID (15+ alphanumeric with _ and -)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  // 2. /file/d/{FILE_ID} or /d/{FILE_ID}
  const fileDMatch = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/i);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // 3. id={FILE_ID} query param
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/i);
  if (queryIdMatch && queryIdMatch[1]) {
    return queryIdMatch[1];
  }

  // 4. googleusercontent.com/d/{FILE_ID}
  const lhMatch = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,})/i);
  if (lhMatch && lhMatch[1]) {
    return lhMatch[1];
  }

  // 5. Fallback for Google Drive domains with token match
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const rawMatch = trimmed.match(/([a-zA-Z0-9_-]{25,})/);
    if (rawMatch && rawMatch[1]) {
      return rawMatch[1];
    }
  }

  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com/d/')
  );
}

export function googleDriveToDirectImageUrl(urlOrId: string): string {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  const fileId = extractGoogleDriveId(urlOrId);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return urlOrId.trim();
}

export function validateGoogleDriveUrl(url: string): {
  valid: boolean;
  fileId?: string;
  directUrl?: string;
  error?: string;
} {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Please enter a Google Drive link.' };
  }

  const trimmed = url.trim();
  const fileId = extractGoogleDriveId(trimmed);

  if (!fileId) {
    return {
      valid: false,
      error: 'Invalid Google Drive link. Please use a link like https://drive.google.com/file/d/FILE_ID/view or paste the File ID.',
    };
  }

  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  return {
    valid: true,
    fileId,
    directUrl,
  };
}

export function processImageUrlInput(input: string): {
  url: string;
  isGoogleDrive: boolean;
  fileId?: string;
} {
  if (!input || typeof input !== 'string') {
    return { url: '', isGoogleDrive: false };
  }

  const trimmed = input.trim();
  if (isGoogleDriveUrl(trimmed) || /^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    const fileId = extractGoogleDriveId(trimmed);
    if (fileId) {
      return {
        url: `https://lh3.googleusercontent.com/d/${fileId}`,
        isGoogleDrive: true,
        fileId,
      };
    }
  }

  return {
    url: trimmed,
    isGoogleDrive: false,
  };
}
