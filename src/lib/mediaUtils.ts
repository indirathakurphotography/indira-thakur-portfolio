/**
 * Normalizes external media URLs including YouTube and Google Drive links.
 */

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const regExp = /\/file\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/;
  const match = url.match(regExp);
  return match ? match[1] || match[2] : null;
}

export function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Handle Google Drive
  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // Handle YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  return trimmed;
}

export function getYouTubeEmbedUrl(url: string): string {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
  }
  return url;
}

export function getGoogleDriveEmbedUrl(url: string): string {
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  return url;
}
