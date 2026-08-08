import type { Metadata } from 'next';

export interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  type?: 'website' | 'article' | 'profile';
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
  ],
  local: [
    'Photographer in Mumbai',
    'Professional Photographer Mumbai',
    'Photography Studio Mumbai',
    'Maternity Photographer Bandra',
    'Newborn Photographer Bandra',
    'Family Photographer Bandra',
    'Photographer in Bandra West',
    'Photography Studio Bandra West',
  ],
  longTail: [
    'Luxury Maternity Photoshoot in Mumbai',
    'Best Pregnancy Photographer in Mumbai',
    'Fine Art Maternity Photography Mumbai',
    'Professional Newborn Photography Mumbai',
    'Luxury Family Photography Mumbai',
    'Baby Photography Studio in Mumbai',
    'Personal Branding Photographer Mumbai',
    'Corporate Photography Services Mumbai',
  ],
};

export const SITE_METADATA = {
  baseUrl: 'https://www.indirathakur.com',
  siteName: 'Indira Thakur Photography',
  tagline: 'Fine Art, Maternity, Newborn & Family Photography in Mumbai',
  founder: 'Indira Thakur',
  email: 'photography@indirathakur.com',
  phone: '+91 9819620484',
  location: 'Chembur West, Mumbai, Maharashtra, India',
  streetAddress: 'Chembur West',
  addressLocality: 'Mumbai',
  addressRegion: 'Maharashtra',
  postalCode: '400071',
  country: 'IN',
  latitude: '19.0622',
  longitude: '72.8973',
  defaultOgImage: '',
  twitterHandle: '@indirathakur',
  socialLinks: {
    instagram: 'https://www.instagram.com/indirathakurphotography/',
    facebook: 'https://www.facebook.com/indirathakurphotography/',
    linkedin: 'https://www.linkedin.com/in/indirathakur',
    whatsapp: 'https://wa.me/919819620484',
  },
  targetedKeywords: [
    ...SEO_KEYWORDS.primary,
    ...SEO_KEYWORDS.local,
  ],
};

export const PAGE_SEO_CONFIGS: Record<string, PageSEOConfig> = {
  home: {
    title: 'Indira Thakur Photography | Best Maternity & Newborn Photographer in Mumbai',
    description: 'Premier Mumbai maternity photographer, best newborn photographer in Mumbai, birth photographer, and luxury family portrait studio in Bandra West, Mumbai by Indira Thakur.',
    keywords: [
      'Mumbai Maternity Photographer',
      'Best Maternity Photographer in Mumbai',
      'Newborn Photographer Mumbai',
      'Best Newborn Photographer in Mumbai',
      'Fine Art Photography Mumbai',
      'Luxury Photography Mumbai',
      'Photographer in Mumbai',
      'Photography Studio Bandra West',
      'Luxury Maternity Photoshoot in Mumbai',
      'Professional Newborn Photography Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/`,
    ogImage: SITE_METADATA.defaultOgImage,
  },
  about: {
    title: 'About Indira Thakur | Fine Art Portrait Photographer in Mumbai',
    description: 'Meet Indira Thakur, premier Mumbai maternity photographer and best newborn photographer in Bandra West, Mumbai. Discover our journalism background and fine art storytelling.',
    keywords: [
      'Indira Thakur',
      'Mumbai Maternity Photographer',
      'Newborn Photographer Mumbai',
      'Portrait Photographer Mumbai',
      'Motherhood Photography Mumbai',
      'Photographer in Bandra West',
      'Professional Photographer Mumbai',
      'Fine Art Photography Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/about`,
    ogImage: '',
  },
  services: {
    title: 'Services & Commissions | Luxury Maternity, Newborn & Family Photography Mumbai',
    description: 'Explore bespoke photography services in Mumbai: Luxury maternity photoshoot, newborn baby photoshoot, birth photography, family portraits, and corporate photography services in Bandra West.',
    keywords: [
      'Luxury Maternity Photographer Mumbai',
      'Newborn Photographer Mumbai',
      'Birth Photographer Mumbai',
      'Family Photographer Mumbai',
      'Baby Photographer Mumbai',
      'Corporate Photographer Mumbai',
      'Brand Photography Mumbai',
      'Pregnancy Photoshoot Mumbai',
      'Baby Photography Studio in Mumbai',
      'Corporate Photography Services Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/services`,
    ogImage: '',
  },
  gallery: {
    title: 'Portfolio Gallery | Fine Art Maternity, Baby & Newborn Photography Mumbai',
    description: 'View the fine art photography portfolio of Indira Thakur featuring luxury maternity photoshoots, newborn baby photoshoots, birth portraits, and family photography in Bandra West, Mumbai.',
    keywords: [
      'Fine Art Photography Mumbai',
      'Baby Photographer Mumbai',
      'Newborn Baby Photoshoot Mumbai',
      'Mumbai Maternity Photographer',
      'Family Photographer Bandra',
      'Luxury Photography Mumbai',
      'Creative Portrait Photography Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/gallery`,
    ogImage: '',
  },
  films: {
    title: 'Cinematography & Films | Fine Art Family & Editorial Films Mumbai',
    description: 'Experience cinematic documentaries and fine art films by Indira Thakur Photography in Mumbai. Editorial moving portraits and luxury family storytelling in Bandra West.',
    keywords: [
      'Editorial Photography Mumbai',
      'Fine Art Photography Mumbai',
      'Luxury Photography Mumbai',
      'Brand Photography Mumbai',
      'Photography Studio Bandra West',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/films`,
    ogImage: '',
  },
  contact: {
    title: 'Inquire & Contact | Book Best Maternity & Newborn Photographer in Mumbai',
    description: 'Connect with Indira Thakur to reserve your luxury maternity photoshoot or newborn session at our Bandra West, Mumbai studio. Book your fine art photography experience today.',
    keywords: [
      'Maternity Photographer Bandra',
      'Newborn Photographer Bandra',
      'Photographer in Bandra West',
      'Best Pregnancy Photographer in Mumbai',
      'Photography Studio Mumbai',
      'Book Newborn Photographer Mumbai',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/contact`,
    ogImage: SITE_METADATA.defaultOgImage,
  },
  faq: {
    title: 'Frequently Asked Questions | Maternity & Newborn Photographer Mumbai',
    description: 'Find answers regarding luxury maternity photoshoots, newborn baby sessions, studio wardrobe, and location shoots in Bandra West, Mumbai with Indira Thakur Photography.',
    keywords: [
      'Best Newborn Photographer in Mumbai',
      'Luxury Maternity Photoshoot in Mumbai',
      'Maternity Photography Studio Bandra West',
      'Pregnancy Photography Mumbai FAQs',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/faq`,
    ogImage: SITE_METADATA.defaultOgImage,
  },
  testimonials: {
    title: 'Client Praise & Reviews | Best Maternity & Newborn Photographer Mumbai',
    description: 'Read reviews and testimonials for Indira Thakur, top Mumbai maternity photographer and best newborn photographer in Bandra West, Mumbai.',
    keywords: [
      'Best Maternity Photographer in Mumbai reviews',
      'Best Newborn Photographer in Mumbai reviews',
      'Luxury Family Photography Mumbai praise',
      'Photographer in Bandra West reviews',
    ],
    canonicalUrl: `${SITE_METADATA.baseUrl}/testimonials`,
    ogImage: SITE_METADATA.defaultOgImage,
  },
};

export function getMetadataForPage(pageKey: string, customConfig?: Partial<PageSEOConfig>): Metadata {
  const base = PAGE_SEO_CONFIGS[pageKey] || PAGE_SEO_CONFIGS.home;
  const config = { ...base, ...customConfig };

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
      locale: 'en_US',
      type: config.type || 'website',
      images: [
        {
          url: config.ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      creator: SITE_METADATA.twitterHandle,
      images: [config.ogImage],
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
