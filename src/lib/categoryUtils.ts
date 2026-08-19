/**
 * Category Normalization and Matching Utilities
 * 
 * Used for normalizing category strings from URL query parameters and MongoDB records.
 */

export function normalizeCategory(raw?: string | null): string {
  if (!raw) return '';

  // 1. Lowercase and trim
  let clean = String(raw).toLowerCase().trim();

  // 2. Strip non-alphanumeric characters
  clean = clean.replace(/[^a-z0-9]/g, '');

  if (!clean) return '';

  // 3. Map canonical categories & aliases
  if (clean.includes('brand') || clean.includes('collaboration') || clean.includes('commercial') || clean.includes('branding')) {
    return 'brand';
  }
  if (clean.includes('newborn') || clean.includes('baby') || clean.includes('infant')) {
    return 'newborn';
  }
  if (clean.includes('maternity') || clean.includes('pregnancy')) {
    return 'maternity';
  }
  if (clean.includes('portrait') || clean.includes('portraits')) {
    return 'portrait';
  }
  if (clean.includes('family') || clean.includes('families')) {
    return 'family';
  }
  if (clean.includes('event')) {
    return 'events';
  }
  if (clean.includes('wedding')) {
    return 'weddings';
  }
  if (clean.includes('couple')) {
    return 'couples';
  }

  // 4. Generic stemming for singular / plural fallback
  if (clean.endsWith('ies')) {
    return clean.slice(0, -3) + 'y';
  }
  if (clean.endsWith('s') && clean.length > 3) {
    return clean.slice(0, -1);
  }

  return clean;
}

/**
 * Checks whether two category strings match after normalization.
 */
export function isCategoryMatch(cat1?: string | null, cat2?: string | null): boolean {
  if (!cat1 || !cat2) return false;

  const norm1 = normalizeCategory(cat1);
  const norm2 = normalizeCategory(cat2);

  if (!norm1 || !norm2) return false;
  if (norm2 === 'all') return true;
  if ((norm1 === 'portrait' && norm2 === 'family') || (norm1 === 'family' && norm2 === 'portrait')) {
    return true;
  }
  return norm1 === norm2;
}

/**
 * Returns a clean, beautifully formatted display label for a category.
 */
export function formatCategory(raw?: string | null): string {
  if (!raw) return '';
  const norm = normalizeCategory(raw);

  const displayMap: Record<string, string> = {
    newborn: 'Newborn',
    maternity: 'Maternity',
    brand: 'Brand',
    portrait: 'Portrait',
    wedding: 'Weddings',
    weddings: 'Weddings',
    events: 'Events',
    event: 'Events',
    couple: 'Couples',
    couples: 'Couples',
  };

  if (displayMap[norm]) return displayMap[norm];

  const trimmed = String(raw).trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Strips unwanted metadata strings (e.g., "Devil Queen") across the website
 * while leaving legitimate content untouched.
 */
export function sanitizeMetadataText(text?: string | null, fallback = ''): string {
  if (!text || typeof text !== 'string') return fallback;
  if (/devil/i.test(text)) {
    return fallback;
  }
  return text;
}
