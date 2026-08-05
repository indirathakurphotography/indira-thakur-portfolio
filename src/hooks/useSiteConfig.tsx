'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

interface SiteImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface SiteConfigData {
  home: {
    tagline: string;
    heading: string;
    headingItalic: string;
    subtext: string;
    categories: string[];
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundGradient: string;
    images: {
      heroMain: SiteImage;
      heroSecondary: SiteImage;
      background: SiteImage;
    };
    heroImages: (SiteImage & { duration?: number; animation?: string })[];
    slideshowDuration: number;
    transitionDuration: number;
    kenBurnsEnabled: boolean;
    overlayIntensity: number;
  };
  about: {
    eyebrow: string;
    heading: string;
    subheading: string;
    story: string;
    storyContinued: string;
    philosophy: string;
    philosophyContinued: string;
    journey: string;
    journeyContinued: string;
    welcomeMessage: string;
    signature: string;
    specializations: string[];
    achievements: { title: string; description: string; year?: string }[];
    stats: { label: string; value: string }[];
    values: { title: string; description: string }[];
    ctaText: string;
    ctaLink: string;
    images: {
      founderPortrait: SiteImage;
      journeyImage: SiteImage;
      storyImage: SiteImage;
      achievementImage: SiteImage;
      behindTheScenes: SiteImage;
      welcomeImage: SiteImage;
      editorial1: SiteImage;
      editorial2: SiteImage;
    };
  };
  services: {
    eyebrow: string;
    heading: string;
    description?: string;
    services: { title: string; subtitle: string; description: string; gradient: string; image: SiteImage; tagline?: string; features?: string[] }[];
    bannerImage: SiteImage;
  };
  galleryPreview: {
    eyebrow: string;
    heading: string;
    featuredImages: SiteImage[];
    ctaText: string;
    ctaLink: string;
  };
  testimonials: {
    eyebrow: string;
    heading: string;
    testimonials: { quote: string; author: string; role?: string; rating?: number; avatar: SiteImage }[];
    backgroundImage: SiteImage;
  };
  faq: {
    eyebrow: string;
    heading: string;
    faqs: { question: string; answer: string }[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    description: string;
    email: string;
    phone: string;
    location: string;
    socialLinks: { platform: string; url: string }[];
    bannerImage: SiteImage;
    studioImage: SiteImage;
  };
  footer: {
    tagline: string;
    description: string;
    email: string;
    phone: string;
    instagramUrl: string;
    facebookUrl: string;
    linkedinUrl: string;
    backgroundFooter: SiteImage;
    logo: SiteImage;
  };
  booking: {
    eyebrow: string;
    heading: string;
    description: string;
    bannerImage: SiteImage;
    sectionImage: SiteImage;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: SiteImage;
  };
  brand?: {
    name?: string;
    siteName?: string;
    tagline?: string;
    logo?: SiteImage;
    preloaderLogo?: SiteImage;
    favicon?: SiteImage;
    copyright?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactLocation?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    linkedinUrl?: string;
    defaultOgImage?: SiteImage;
  };
  hero?: Record<string, unknown>;
  [key: string]: unknown;
}

export const DEFAULT_SITE_CONFIG: SiteConfigData = {
  home: {
    tagline: '',
    heading: '',
    headingItalic: '',
    subtext: '',
    categories: [],
    ctaText: '',
    ctaLink: '',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    backgroundGradient: 'from-[#1A1110] via-[#2C1810] to-rich-black',
    images: {
      heroMain: { url: '', alt: '' },
      heroSecondary: { url: '', alt: '' },
      background: { url: '', alt: '' },
    },
    heroImages: [],
    slideshowDuration: 7,
    transitionDuration: 1.5,
    kenBurnsEnabled: true,
    overlayIntensity: 0.5,
  },
  about: {
    eyebrow: '',
    heading: '',
    subheading: '',
    story: '',
    storyContinued: '',
    philosophy: '',
    philosophyContinued: '',
    journey: '',
    journeyContinued: '',
    welcomeMessage: '',
    signature: '',
    specializations: [],
    achievements: [],
    stats: [],
    values: [],
    ctaText: '',
    ctaLink: '',
    images: {
      founderPortrait: { url: '', alt: '' },
      journeyImage: { url: '', alt: '' },
      storyImage: { url: '', alt: '' },
      achievementImage: { url: '', alt: '' },
      behindTheScenes: { url: '', alt: '' },
      welcomeImage: { url: '', alt: '' },
      editorial1: { url: '', alt: '' },
      editorial2: { url: '', alt: '' },
    },
  },
  services: {
    eyebrow: 'WHAT I OFFER',
    heading: 'Bespoke Experience & Services',
    services: [],
    bannerImage: { url: '', alt: '' },
  },
  galleryPreview: {
    eyebrow: 'PORTFOLIO',
    heading: 'Featured Work',
    featuredImages: [],
    ctaText: 'View Full Gallery',
    ctaLink: '/gallery',
  },
  testimonials: {
    eyebrow: 'KIND WORDS',
    heading: 'What Families Say',
    testimonials: [],
    backgroundImage: { url: '', alt: '' },
  },
  faq: {
    eyebrow: 'QUESTIONS',
    heading: 'Commonly Asked',
    faqs: [],
  },
  contact: {
    eyebrow: '',
    heading: '',
    description: '',
    email: '',
    phone: '',
    location: '',
    socialLinks: [],
    bannerImage: { url: '', alt: '' },
    studioImage: { url: '', alt: '' },
  },
  footer: {
    tagline: '',
    description: '',
    email: '',
    phone: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    backgroundFooter: { url: '', alt: '' },
    logo: { url: '', alt: '' },
  },
  booking: {
    eyebrow: '',
    heading: '',
    description: '',
    bannerImage: { url: '', alt: '' },
    sectionImage: { url: '', alt: '' },
  },
  seo: {
    title: '',
    description: '',
    keywords: [],
    ogImage: { url: '', alt: '' },
  },
  brand: {
    siteName: '',
    tagline: '',
    logo: { url: '', alt: '' },
    favicon: { url: '', alt: '' },
  },
};

interface SiteConfigContextType {
  config: SiteConfigData | null;
  loading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: DEFAULT_SITE_CONFIG,
  loading: false,
});

let cachedConfig: SiteConfigData | null = null;
let fetchPromise: Promise<SiteConfigData | null> | null = null;

export function SiteConfigProvider({
  initialConfig,
  children,
}: {
  initialConfig: SiteConfigData | null;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<SiteConfigData | null>(() => {
    if (initialConfig) {
      cachedConfig = initialConfig;
      return initialConfig;
    }
    return cachedConfig || DEFAULT_SITE_CONFIG;
  });
  const [loading, setLoading] = useState<boolean>(!initialConfig && !cachedConfig);

  useEffect(() => {
    async function loadConfig(bypassCache = false) {
      if (bypassCache) {
        fetchPromise = null;
      }
      if (!fetchPromise) {
        fetchPromise = fetch(`/api/site-config?t=${Date.now()}`, { cache: 'no-store' })
          .then((response) => {
            if (response.ok) return response.json();
            return null;
          })
          .catch(() => null)
          .then((data) => {
            if (data) cachedConfig = data;
            fetchPromise = null;
            return data;
          });
      }

      const data = await fetchPromise;
      if (data) setConfig(data);
      setLoading(false);
    }

    if (!initialConfig && !cachedConfig) {
      loadConfig();
    }

    const handleUpdate = () => {
      loadConfig(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('site-config-updated', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('site-config-updated', handleUpdate);
      }
    };
  }, [initialConfig]);

  return (
    <SiteConfigContext.Provider value={{ config: config || DEFAULT_SITE_CONFIG, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context && context.config) {
    return context;
  }
  return {
    config: cachedConfig || DEFAULT_SITE_CONFIG,
    loading: !cachedConfig,
  };
}

export function invalidateSiteConfigCache() {
  cachedConfig = null;
  fetchPromise = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-config-updated'));
  }
}

