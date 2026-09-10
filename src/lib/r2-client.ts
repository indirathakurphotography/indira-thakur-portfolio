/**
 * Client-safe Cloudflare R2 URL resolution utilities.
 * Can be safely imported in both 'use client' components and server modules.
 */

export function getR2MediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';

  const clean = pathOrUrl.trim();

  // If already an R2 dev domain or custom domain, return as is
  if (clean.includes('.r2.dev') || clean.includes('.r2.cloudflarestorage.com')) {
    return clean;
  }

  // Convert legacy Supabase public or authenticated URLs to R2 / media proxy
  const supabaseStorageMatch = clean.match(/\.supabase\.co\/storage\/v1\/object\/(?:public|authenticated)\/[^/]+\/(.+)$/);
  if (supabaseStorageMatch) {
    const subPath = supabaseStorageMatch[1];
    const customDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_DOMAIN;
    if (customDomain) {
      return `${customDomain.replace(/\/$/, '')}/${subPath.replace(/^\//, '')}`;
    }
    return `/api/media/${subPath.replace(/^\//, '')}`;
  }

  // If already an absolute HTTP URL, return as is
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Relative storage path: route through R2 public domain or proxy
  const customDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_DOMAIN;
  if (customDomain) {
    return `${customDomain.replace(/\/$/, '')}/${clean.replace(/^\//, '')}`;
  }

  return `/api/media/${clean.replace(/^\//, '')}`;
}
