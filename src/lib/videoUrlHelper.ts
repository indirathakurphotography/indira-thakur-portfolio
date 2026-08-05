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
  if (trimmed.includes('youtube.com/watch')) {
    const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (vMatch && vMatch[1]) {
      return `https://www.youtube.com/embed/${vMatch[1]}?autoplay=1`;
    }
  }
  if (trimmed.includes('youtu.be/')) {
    const idMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://www.youtube.com/embed/${idMatch[1]}?autoplay=1`;
    }
  }
  if (trimmed.includes('youtube.com/embed/')) {
    const embedId = trimmed.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0];
    if (embedId) {
      return `https://www.youtube.com/embed/${embedId}?autoplay=1`;
    }
  }
  if (trimmed.includes('youtube.com/shorts/')) {
    const shortsId = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('&')[0];
    if (shortsId) {
      return `https://www.youtube.com/embed/${shortsId}?autoplay=1`;
    }
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
  if (extractGoogleDriveFileId(lower) || lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
    return false;
  }
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.includes('.mp4?') ||
    lower.includes('.webm?')
  );
}

/**
 * Returns a high-res thumbnail URL for a video.
 * Uses custom thumbnail if provided; otherwise derives from YouTube / Google Drive / Vimeo.
 */
export function getVideoThumbnail(videoUrl: string, customThumbnail?: string): string {
  if (customThumbnail && customThumbnail.trim() !== '') {
    return customThumbnail.trim();
  }

  const trimmed = (videoUrl || '').trim();

  // 1. Google Drive thumbnail
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
  }

  // 2. YouTube thumbnail
  let ytId: string | null = null;
  if (trimmed.includes('youtube.com/watch')) {
    const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (vMatch && vMatch[1]) ytId = vMatch[1];
  } else if (trimmed.includes('youtu.be/')) {
    const idMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) ytId = idMatch[1];
  } else if (trimmed.includes('youtube.com/embed/')) {
    const embedId = trimmed.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0];
    if (embedId) ytId = embedId;
  }
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 3. Fallback high quality photography poster
  return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200';
}
