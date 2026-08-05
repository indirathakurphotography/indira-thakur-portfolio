'use client';

/**
 * URL normalization utilities for CMS links
 * Ensures internal routes always have leading slash, preserves external/anchor URLs
 */

// Patterns that should NOT be normalized (already absolute, external, or special)
const EXTERNAL_URL_PATTERN = /^(https?:)?\/\//i;
const MAILTO_PATTERN = /^mailto:/i;
const TEL_PATTERN = /^tel:/i;
const ANCHOR_PATTERN = /^#/;
const ROOT_PATTERN = /^\/$/;

/**
 * Check if a URL is external, anchor, or special (should not be normalized)
 */
export function isExternalOrSpecialUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    EXTERNAL_URL_PATTERN.test(trimmed) ||
    MAILTO_PATTERN.test(trimmed) ||
    TEL_PATTERN.test(trimmed) ||
    ANCHOR_PATTERN.test(trimmed) ||
    ROOT_PATTERN.test(trimmed)
  );
}

/**
 * Check if a URL is an internal route that should be normalized
 */
export function isInternalRoute(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return !isExternalOrSpecialUrl(trimmed) && trimmed !== '';
}

/**
 * Normalize a URL for internal routes
 * - Adds leading slash if missing for internal routes
 * - Preserves external URLs, mailto:, tel:, #anchors, and root "/"
 * - Trims whitespace
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  const trimmed = url.trim();
  
  // Preserve empty string
  if (trimmed === '') return trimmed;
  
  // Preserve external, anchor, mailto, tel, and root
  if (isExternalOrSpecialUrl(trimmed)) return trimmed;
  
  // Normalize internal route: ensure leading slash
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Normalize an array of SectionButton links
 */
export function normalizeButtonLinks(buttons: Array<{ link: string }>): Array<{ link: string }> {
  return buttons.map(btn => ({
    ...btn,
    link: normalizeUrl(btn.link)
  }));
}

/**
 * Deep normalize all button links in a section and its nested items
 */
export function normalizeSectionLinks(section: any): any {
  if (!section) return section;
  
  const normalized = { ...section };
  
  // Normalize section buttons
  if (Array.isArray(normalized.buttons)) {
    normalized.buttons = normalized.buttons.map((btn: any) => ({
      ...btn,
      link: normalizeUrl(btn.link)
    }));
  }
  
  // Normalize items in sections that have items (cards, testimonials, faq, timeline)
  if (Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map((item: any) => {
      const normalizedItem = { ...item };
      // Some items might have buttons or links
      if (normalizedItem.buttons && Array.isArray(normalizedItem.buttons)) {
        normalizedItem.buttons = normalizedItem.buttons.map((btn: any) => ({
          ...btn,
          link: normalizeUrl(btn.link)
        }));
      }
      // Items might have direct links
      if (normalizedItem.link) {
        normalizedItem.link = normalizeUrl(normalizedItem.link);
      }
      return normalizedItem;
    });
  }
  
  // Normalize CTA buttons if present
  if (normalized.cta && normalized.cta.buttons && Array.isArray(normalized.cta.buttons)) {
    normalized.cta.buttons = normalized.cta.buttons.map((btn: any) => ({
      ...btn,
      link: normalizeUrl(btn.link)
    }));
  }
  
  return normalized;
}

/**
 * Deep normalize all sections in an array
 */
export function normalizeAllSectionLinks(sections: any[]): any[] {
  return sections.map(normalizeSectionLinks);
}

