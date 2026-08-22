/**
 * Utility functions for video URL parsing and embedding.
 * Supports Google Drive, YouTube, Vimeo, and direct video formats (.mp4, .webm).
 */

/**
 * Extracts Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/file/d/FILE_ID/edit
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Match /file/d/{FILE_ID} or /d/{FILE_ID}
  const fileDMatch = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/i);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // 2. Query parameter id={FILE_ID}
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/i);
  if (queryIdMatch && queryIdMatch[1]) {
    return queryIdMatch[1];
  }

  // 3. Fallback for Google Drive domains
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const rawTokenMatch = trimmed.match(/([a-zA-Z0-9_-]{25,})/);
    if (rawTokenMatch && rawTokenMatch[1]) {
      return rawTokenMatch[1];
    }
  }

  return null;
}

/**
 * Extracts YouTube Video ID from any YouTube URL format:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  if (!trimmed) return null;

  // 1. watch?v=
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // 2. youtu.be/
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // 3. shorts/
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // 4. embed/
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // 5. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Returns a clean YouTube embed URL for a given URL or Video ID
 */
export function getYouTubeEmbedUrl(urlOrId: string): string {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  return urlOrId;
}

/**
 * Returns a high-res thumbnail URL for a given YouTube URL or Video ID
 */
export function getYouTubeThumbnailUrl(urlOrId: string): string {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return '';
}

/**
 * Normalizes any video URL into a clean, embeddable URL.
 * Google Drive URLs are ALWAYS converted to:
 * https://drive.google.com/file/d/FILE_ID/preview
 */
export function formatVideoEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Google Drive
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  // 2. YouTube
  const ytId = extractYouTubeVideoId(trimmed);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  }

  // 3. Vimeo
  if (trimmed.includes('vimeo.com/')) {
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
  }

  return trimmed;
}

/**
 * Determines if a video URL is a direct binary video file (.mp4, .webm, etc.)
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  if (extractGoogleDriveFileId(lower) || extractYouTubeVideoId(lower) || lower.includes('vimeo.com')) {
    return false;
  }
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.mkv') ||
    lower.includes('.mp4?') ||
    lower.includes('.webm?') ||
    lower.includes('.mov?') ||
    lower.includes('.m4v?') ||
    lower.includes('/videos/') ||
    lower.startsWith('blob:') ||
    lower.startsWith('data:video/')
  );
}

/**
 * Returns a high-res thumbnail URL for a video.
 * Uses custom thumbnail if provided; otherwise derives from YouTube / Google Drive / Vimeo.
 */
export function getVideoThumbnail(videoUrl: string, customThumbnail?: string): string {
  if (customThumbnail && customThumbnail.trim() !== '' && !customThumbnail.includes('placeholder')) {
    return customThumbnail.trim();
  }

  const trimmed = (videoUrl || '').trim();

  // 1. Google Drive thumbnail
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
  }

  // 2. YouTube thumbnail
  const ytId = extractYouTubeVideoId(trimmed);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 3. Return empty string if no thumbnail is available
  return '';
}
