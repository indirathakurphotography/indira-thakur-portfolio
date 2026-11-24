import type { Metadata } from 'next';

export interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage?: string;
  type?: 'website' | 'article' | 'profile' | 'video.other';
}

export interface ResolvedImageMeta {
  url: string;
  secureUrl: string;
  type: string;
  width?: number;
  height?: number;
  alt: string;
}

export const SEO_KEYWORDS = {
  primary: [
    'Mumbai Maternity Photographer',
    'Best Maternity Photographer in Mumbai',
    'Luxury Maternity Photographer Mumbai',
    'Newborn Photographer Mumbai',
    'Best Newborn Photographer in Mumbai',
    'Birth Photographer Mumbai',
    'Baby Photographer Mumbai',
    'Family Photographer Mumbai',
    'Fine Art Photography Mumbai',
    'Luxury Photography Mumbai',
    'Corporate Photographer Mumbai',
    'Brand Photography Mumbai',
    'Portrait Photographer Mumbai',
    'Wedding Photographer Mumbai',
    'Event Photographer Mumbai',
    'Editorial Photographer Mumbai',
  ],
  secondary: [
    'Maternity Photoshoot Mumbai',
    'Pregnancy Photoshoot Mumbai',
    'Pregnancy Photography Mumbai',
    'Newborn Baby Photoshoot Mumbai',
    'Baby Photoshoot Mumbai',
    'Motherhood Photography Mumbai',
    'Lifestyle Family Photography Mumbai',
    'Editorial Photography Mumbai',
    'Creative Portrait Photography Mumbai',
    'Corporate Team Photography Mumbai',
    'Personal Branding Photography Mumbai',
    'Fine Art Portraiture Mumbai',
    'Custom Family Heirlooms Mumbai',
  ],
  local: [
    'Photographer in Tilak Nagar',
    'Photography Studio Tilak Nagar Chembur',
    'Maternity Photographer Chembur',
    'Newborn Photographer Chembur',
    'Family Photographer Chembur',
    'Photographer in Chembur Mumbai',
    'Photography Studio Chembur',
    'Photographer Near Me Chembur',
    'Best Photographer in Chembur',
    'Photographer in Mumbai',
    'Professional Photographer Mumbai',
    'Photography Studio Mumbai',
    'Photographer Near Me Mumbai',
    'Maternity Photographer Tilak Nagar',
    'Newborn Photographer Tilak Nagar',
    'Family Photographer Tilak Nagar',
    'Newborn Baby Photoshoot Chembur',
    'Maternity Photoshoot Chembur',
    'Portrait Photographer Chembur',
    'Wedding Photographer Chembur',
    'Event Photographer Chembur',
    'Photographer in Ghatkopar',
    'Photographer in Kurla',
    'Photographer in Sion',
    'Photographer in Bandra',
    'Photographer in Powai',
  ],
  longTail: [
    'Luxury Maternity Photoshoot in Tilak Nagar Chembur',
    'Best Pregnancy Photographer in Chembur Mumbai',
    'Fine Art Maternity Photography Chembur',
    'Professional Newborn Photography Chembur Mumbai',
    'Luxury Family Photography Tilak Nagar Chembur',
    'Baby Photography Studio in Chembur Mumbai',
    'Personal Branding Photographer Chembur Mumbai',
    'Corporate Photography Services Chembur Mumbai',
    'Best Newborn Baby Photoshoot Studio near Tilak Nagar',
    'Top Fine Art Photographer near Chembur',
  ],
};

export const SITE_METADATA = {
  baseUrl: 'https://www.indirathakur.com',
  siteName: 'Indira Thakur Photography',
  tagline: 'Fine Art, Maternity, Newborn & Family Photography in Tilak Nagar, Chembur, Mumbai',
  founder: 'Indira Thakur',
  email: 'photography@indirathakur.com',
  phone: '+91 98196 20484',
  location: 'Tilak Nagar, Chembur, Mumbai, Maharashtra, India',
  streetAddress: 'Tilak Nagar, Chembur',
  addressLocality: 'Chembur, Mumbai',
  addressRegion: 'Maharashtra',
  postalCode: '400089',
  country: 'IN',
  latitude: '19.0664',
  longitude: '72.8980',
  twitterHandle: '@indirathakur',
  socialLinks: {
    instagram: 'https://www.instagram.com/indirathakurphotography/',
    facebook: 'https://www.facebook.com/indirathakurphotography/',
    linkedin: 'https://www.linkedin.com/in/indirathakur',
    whatsapp: 'https://wa.me/919819620484',
  },
  targetedKeywords: [
    ...SEO_KEYWORDS.primary,
    ...SEO_KEYWORDS.secondary,
    ...SEO_KEYWORDS.local,
    ...SEO_KEYWORDS.longTail,
  ],
  metaPixelId: '1533647998184514',
};

export const PAGE_SEO_CONFIGS: Record<string, PageSEOConfig> = {
  home: {
    title: 'Indira Thakur Photography | Best Maternity & Newborn Photographer in Tilak Nagar, Chembur, Mumbai',
    description: 'Premier Mumbai maternity photographer, best newborn photographer in Chembur, birth photographer, and luxury family portrait studio in Tilak Nagar, Chembur, Mumbai by Indira Thakur.',
    keywords: [
      'Mumbai Maternity Photographer',
      'Best Maternity Photographer in Chembur',
      'Newborn Photographer Tilak Nagar',
      'Best Newborn Photographer in Mumbai',
      'Fine Art Photography Chembur',
      'Luxury Photography Mumbai',
      'Photographer in Tilak Nagar Chembur',
      'Photography Studio Chembur Mumbai',
      'Luxury Maternity Photoshoot in Mumbai',
      'Professional Newborn Photography Chembur',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/`,
  },
  about: {
    title: 'About Indira Thakur | Fine Art Portrait Photographer in Chembur, Mumbai',
    description: 'Meet Indira Thakur, premier Mumbai maternity photographer and best newborn photographer in Tilak Nagar, Chembur, Mumbai. Discover our journalism background and fine art storytelling.',
    keywords: [
      'Indira Thakur',
      'Mumbai Maternity Photographer',
      'Newborn Photographer Chembur',
      'Portrait Photographer Tilak Nagar',
      'Motherhood Photography Mumbai',
      'Photographer in Chembur Mumbai',
      'Professional Photographer Tilak Nagar',
      'Fine Art Photography Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/about`,
    type: 'profile',
  },
  services: {
    title: 'Services & Commissions | Luxury Maternity, Newborn & Family Photography Chembur, Mumbai',
    description: 'Explore bespoke photography services in Tilak Nagar, Chembur, Mumbai: Luxury maternity photoshoot, newborn baby photoshoot, birth photography, family portraits, and corporate photography services.',
    keywords: [
      'Luxury Maternity Photographer Chembur',
      'Newborn Photographer Tilak Nagar',
      'Birth Photographer Mumbai',
      'Family Photographer Chembur',
      'Baby Photographer Tilak Nagar',
      'Corporate Photographer Mumbai',
      'Brand Photography Chembur',
      'Pregnancy Photoshoot Chembur',
      'Baby Photography Studio in Chembur',
      'Corporate Photography Services Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/services`,
  },
  gallery: {
    title: 'Portfolio Gallery | Fine Art Maternity, Baby & Newborn Photography Chembur, Mumbai',
    description: 'View the fine art photography portfolio of Indira Thakur featuring luxury maternity photoshoots, newborn baby photoshoots, birth portraits, and family photography in Tilak Nagar, Chembur, Mumbai.',
    keywords: [
      'Fine Art Photography Chembur',
      'Baby Photographer Tilak Nagar',
      'Newborn Baby Photoshoot Chembur',
      'Mumbai Maternity Photographer',
      'Family Photographer Chembur',
      'Luxury Photography Mumbai',
      'Creative Portrait Photography Chembur',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/gallery`,
  },
  films: {
    title: 'Cinematography & Films | Fine Art Family & Editorial Films Chembur, Mumbai',
    description: 'Experience cinematic documentaries and fine art films by Indira Thakur Photography in Tilak Nagar, Chembur, Mumbai. Editorial moving portraits and luxury family storytelling.',
    keywords: [
      'Editorial Photography Chembur',
      'Fine Art Photography Mumbai',
      'Luxury Photography Chembur',
      'Brand Photography Mumbai',
      'Photography Studio Tilak Nagar Chembur',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/films`,
    type: 'video.other',
  },
  contact: {
    title: 'Inquire & Contact | Book Best Maternity & Newborn Photographer in Chembur, Mumbai',
    description: 'Connect with Indira Thakur to reserve your luxury maternity photoshoot or newborn session at our Tilak Nagar, Chembur, Mumbai studio. Book your fine art photography experience today.',
    keywords: [
      'Maternity Photographer Chembur',
      'Newborn Photographer Tilak Nagar',
      'Photographer in Chembur Mumbai',
      'Best Pregnancy Photographer in Chembur',
      'Photography Studio Tilak Nagar',
      'Book Newborn Photographer Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/contact`,
  },
  faq: {
    title: 'Frequently Asked Questions | Maternity & Newborn Photographer Chembur, Mumbai',
    description: 'Find answers regarding luxury maternity photoshoots, newborn baby sessions, studio wardrobe, and location shoots in Tilak Nagar, Chembur, Mumbai with Indira Thakur Photography.',
    keywords: [
      'Best Newborn Photographer in Chembur',
      'Luxury Maternity Photoshoot in Tilak Nagar',
      'Maternity Photography Studio Chembur',
      'Pregnancy Photography Mumbai FAQs',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/faq`,
  },
  testimonials: {
    title: 'Client Praise & Reviews | Best Maternity & Newborn Photographer Chembur, Mumbai',
    description: 'Read reviews and testimonials for Indira Thakur, top Mumbai maternity photographer and best newborn photographer in Tilak Nagar, Chembur, Mumbai.',
    keywords: [
      'Best Maternity Photographer in Chembur reviews',
      'Best Newborn Photographer in Tilak Nagar reviews',
      'Luxury Family Photography Mumbai praise',
      'Photographer in Chembur reviews',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/testimonials`,
  },
};

export function inferImageMimeType(url: string, headerContentType?: string | null): string {
  const ct = (headerContentType || '').split(';')[0].trim().toLowerCase();
  if (ct.startsWith('image/')) {
    return ct === 'image/jpg' ? 'image/jpeg' : ct;
  }

  const pathname = (url || '').split('?')[0].split('#')[0].toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.gif')) return 'image/gif';
  if (pathname.endsWith('.avif')) return 'image/avif';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

/**
 * Pure-TypeScript binary header parser for JPEG, PNG, GIF, and WebP.
 * Avoids native sharp failures inside serverless metadata lambdas so
 * og:image:width and og:image:height are always emitted reliably.
 */
export function readImageDimensionsFromBuffer(
  buffer: Buffer
): { width: number; height: number; contentType?: string } | null {
  if (!buffer || buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR width/height at offsets 16..23
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) {
      return { width, height, contentType: 'image/png' };
    }
  }

  // GIF: "GIF87a" or "GIF89a", width/height at offsets 6..9 LE
  if (
    buffer.length >= 10 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    if (width > 0 && height > 0) {
      return { width, height, contentType: 'image/gif' };
    }
  }

  // WebP: "RIFF"...."WEBP"
  if (
    buffer.length >= 30 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunkType = buffer.toString('ascii', 12, 16);
    if (chunkType === 'VP8X' && buffer.length >= 30) {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      if (width > 0 && height > 0) return { width, height, contentType: 'image/webp' };
    }
    if (chunkType === 'VP8 ' && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      if (width > 0 && height > 0) return { width, height, contentType: 'image/webp' };
    }
    if (chunkType === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      const width = 1 + (b0 | ((b1 & 0x3f) << 8));
      const height = 1 + (((b1 & 0xc0) >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10));
      if (width > 0 && height > 0) return { width, height, contentType: 'image/webp' };
    }
  }

  // JPEG: starts with FF D8, scan SOF0..SOF3 / SOF5..SOF7 / SOF9..SOF11 / SOF13..SOF15
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < buffer.length && buffer[offset] === 0xff) {
        offset += 1;
      }
      if (offset >= buffer.length) break;
      const marker = buffer[offset];
      offset += 1;

      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        continue;
      }
      if (marker === 0xda) {
        // Start of Scan reached without SOF
        break;
      }
      if (offset + 2 > buffer.length) break;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) break;

      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSof && segmentLength >= 7 && offset + 7 <= buffer.length) {
        const height = buffer.readUInt16BE(offset + 3);
        const width = buffer.readUInt16BE(offset + 5);
        if (width > 0 && height > 0) {
          return { width, height, contentType: 'image/jpeg' };
        }
      }
      offset += segmentLength;
    }
  }

  return null;
}

/**
 * Resolves a page's canonical / og:url strictly onto the active primary domain.
 * Prevents legacy/unreachable database canonicalUrl overrides (e.g. indirathakurphotography.com)
 * from breaking WhatsApp/Meta og:url reconciliation on https://www.indirathakur.com.
 */
export function resolveCanonicalUrl(rawDbCanonical?: string | null, canonicalPath: string = '/'): string {
  const defaultCanonical = `${SITE_METADATA.baseUrl}${canonicalPath === '/' ? '' : canonicalPath}`;
  if (!rawDbCanonical || typeof rawDbCanonical !== 'string') {
    return defaultCanonical;
  }

  const trimmed = rawDbCanonical.trim();
  if (!trimmed) return defaultCanonical;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    if (host === 'www.indirathakur.com' || host === 'indirathakur.com') {
      const normalizedPath = canonicalPath === '/' ? '' : canonicalPath;
      return `${SITE_METADATA.baseUrl}${normalizedPath}`;
    }
  } catch {
    // Ignore invalid URL and use primary base URL
  }

  return defaultCanonical;
}

export function resolveSiteAssetUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('http://')) {
    if (trimmed.toLowerCase().includes('indirathakur.com')) {
      return trimmed.replace(/^http:\/\//i, 'https://');
    }
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${SITE_METADATA.baseUrl}${cleanPath}`;
}

/**
 * Resolves the authoritative Open Graph / Twitter image URL strictly from
 * Admin Panel SEO settings, ensuring absolute HTTPS URLs and cache-busting.
 * Returns an empty string if no Admin image is configured — never silently
 * substitutes a favicon or a static placeholder image.
 */
export function resolveSeoOgImage(rawUrl?: string | null, updatedAt?: string | Date | null): string {
  const url = resolveSiteAssetUrl(rawUrl);
  if (!url) return '';

  if (updatedAt && !url.includes('?')) {
    const ts = new Date(updatedAt).getTime();
    if (!Number.isNaN(ts)) {
      return `${url}?v=${ts}`;
    }
  }

  return url;
}

const LEGACY_MONOCHROME_FILENAMES = new Set([
  'favicon.ico',
  'icon.png',
  'apple-touch-icon.png',
  'logo.png',
  'og-image.jpg',
  'og-image-v2.jpg',
]);

export function isLegacyMonochromeAssetUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const pathname = rawUrl.trim().split('?')[0].split('#')[0].toLowerCase();
  if (!pathname) return false;
  const base = pathname.split('/').pop() || '';
  return LEGACY_MONOCHROME_FILENAMES.has(base);
}

/**
 * Resolves the authoritative full-colour favicon / app icon strictly from Admin Panel
 * SEO / Brand settings, rejecting legacy monochrome icons and falling back only to the
 * original full-colour Admin brand image.
 */
export function resolveBrandFaviconUrl(params: {
  seoFavicon?: string | null;
  brandFaviconUrl?: string | null;
  brandLogoUrl?: string | null;
  seoOgImage?: string | null;
  updatedAt?: string | Date | null;
}): { url: string; type: string } {
  const candidates = [
    params.seoFavicon,
    params.brandFaviconUrl,
    params.brandLogoUrl,
    params.seoOgImage,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed || isLegacyMonochromeAssetUrl(trimmed)) continue;
    const resolved = resolveSeoOgImage(trimmed, params.updatedAt);
    if (resolved) {
      return { url: resolved, type: inferImageMimeType(resolved) };
    }
  }

  return {
    url: `${SITE_METADATA.baseUrl}/icon.jpeg`,
    type: 'image/jpeg',
  };
}

export function capSeoKeywords(
  keywords?: string[] | string | null,
  maxItems: number = 12
): string[] | undefined {
  if (!keywords) return undefined;
  const list = Array.isArray(keywords)
    ? keywords
    : String(keywords).split(',');
  const cleaned = Array.from(
    new Set(list.map((k) => String(k || '').trim()).filter(Boolean))
  );
  if (cleaned.length === 0) return undefined;
  return cleaned.slice(0, maxItems);
}

export function buildOpenGraphImageDescriptor(params: {
  url: string;
  alt: string;
  type?: string;
  width?: number;
  height?: number;
}): ResolvedImageMeta | null {
  if (!params.url) return null;
  const secureUrl = params.url.startsWith('http://')
    ? params.url.replace(/^http:\/\//i, 'https://')
    : params.url;

  return {
    url: params.url,
    secureUrl,
    type: inferImageMimeType(params.url, params.type),
    ...(params.width && params.width > 0 ? { width: params.width } : {}),
    ...(params.height && params.height > 0 ? { height: params.height } : {}),
    alt: params.alt,
  };
}

export function getMetadataForPage(pageKey: string, customConfig?: Partial<PageSEOConfig>): Metadata {
  const base = PAGE_SEO_CONFIGS[pageKey] || PAGE_SEO_CONFIGS.home;
  const config = { ...base, ...customConfig };
  const ogDesc = config.ogImage
    ? buildOpenGraphImageDescriptor({ url: config.ogImage, alt: config.title })
    : null;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords.join(', '),
    metadataBase: new URL(SITE_METADATA.baseUrl),
    alternates: {
      canonical: config.canonicalUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.canonicalUrl,
      siteName: SITE_METADATA.siteName,
      locale: 'en_IN',
      type: config.type || 'website',
      ...(ogDesc ? { images: [ogDesc] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      creator: SITE_METADATA.twitterHandle,
      ...(ogDesc ? { images: [{ url: ogDesc.url, alt: ogDesc.alt }] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
  };
}
