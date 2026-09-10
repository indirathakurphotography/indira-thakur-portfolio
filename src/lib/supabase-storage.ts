/**
 * Storage adapter transitioning from Supabase Storage to Cloudflare R2.
 * All uploads and public URLs are routed through Cloudflare R2.
 */
export * from './r2-storage';
