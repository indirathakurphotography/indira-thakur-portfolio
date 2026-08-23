/**
 * Category Normalization and Matching Utilities
 * 
 * Dynamic, CMS-driven utility for normalizing, matching, and formatting
 * category strings from URLs, MongoDB records, and Admin panels.
 */

export function normalizeCategory(raw?: string | null): string {
  if (!raw) return '';

  // 1. Lowercase and trim
  let clean = String(raw).toLowerCase().trim();

  // Strip trailing -photography or ' photography'
  clean = clean.replace(/[-_\s]*photography$/i, '').trim();

  // Replace special characters with hyphens
  clean = clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (!clean) return '';
  if (clean === 'all') return 'all';

  // Map exact canonical singular/plural variants
  const canonicalExactMap: Record<string, string> = {
    weddings: 'weddings',
    wedding: 'weddings',
    events: 'events',
    event: 'events',
    couples: 'couples',
    couple: 'couples',
    portraits: 'portrait',
    portrait: 'portrait',
    maternity: 'maternity',
    newborn: 'newborn',
    newborns: 'newborn',
    family: 'family',
    families: 'family',
    brand: 'brand',
    branding: 'brand',
    commercial: 'brand',
  };

  if (canonicalExactMap[clean]) {
    return canonicalExactMap[clean];
  }

  // Handle generic English plurals without corrupting custom words
  if (clean.endsWith('ies')) {
    return clean.slice(0, -3) + 'y';
  }
  if (clean.endsWith('s') && clean.length > 3 && !clean.endsWith('ss')) {
    return clean.slice(0, -1);
  }

  return clean;
}

/**
 * Checks whether two category strings match after normalization.
 */
export function isCategoryMatch(cat1?: string | null, cat2?: string | null): boolean {
  if (!cat1 || !cat2) return false;

  const raw1 = String(cat1).trim().toLowerCase();
  const raw2 = String(cat2).trim().toLowerCase();

  if (raw1 === 'all' || raw2 === 'all') return true;
  if (raw1 === raw2) return true;

  const norm1 = normalizeCategory(cat1);
  const norm2 = normalizeCategory(cat2);

  if (!norm1 || !norm2) return false;
  if (norm1 === 'all' || norm2 === 'all') return true;
  if (norm1 === norm2) return true;

  // Partial match for hyphenated multi-word categories (e.g., 'toddler-child' matching 'toddler')
  const norm1Parts = norm1.split('-');
  const norm2Parts = norm2.split('-');
  if (norm1Parts.some((p) => norm2Parts.includes(p))) {
    return true;
  }

  return false;
}

/**
 * Returns a clean, beautifully formatted display label for any category.
 * Dynamically handles standard and custom categories without hardcoding.
 */
export function formatCategory(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'all') return 'All';

  // Specific canonical display names
  const displayMap: Record<string, string> = {
    all: 'All',
    newborn: 'Newborn',
    maternity: 'Maternity',
    brand: 'Brand',
    portrait: 'Portrait',
    weddings: 'Weddings',
    wedding: 'Weddings',
    events: 'Events',
    event: 'Events',
    family: 'Family',
    couples: 'Couples',
    couple: 'Couples',
  };

  const lower = trimmed.toLowerCase();
  if (displayMap[lower]) return displayMap[lower];

  // If already formatted with mixed case and spaces, return as is
  if (/[A-Z]/.test(trimmed) && trimmed.includes(' ')) {
    return trimmed;
  }

  // Strip trailing -photography for clean badge display if needed
  const base = trimmed.replace(/[-_\s]*photography$/i, '').trim() || trimmed;

  // Split by hyphens, underscores, or spaces and capitalize each word
  return base
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const wLower = word.toLowerCase();
      if (wLower === '&' || wLower === 'and') return '&';
      if (['of', 'in', 'the', 'for'].includes(wLower)) return wLower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Strips unwanted metadata strings across the website
 * while leaving legitimate content untouched.
 */
export function sanitizeMetadataText(text?: string | null, fallback = ''): string {
  if (!text || typeof text !== 'string') return fallback;
  if (/devil/i.test(text)) {
    return fallback;
  }
  return text;
}
