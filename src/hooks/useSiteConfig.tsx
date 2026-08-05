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
    defaultOgImage?: SiteImage;
  };
  hero?: Record<string, unknown>;
  [key: string]: unknown;
}

export const DEFAULT_SITE_CONFIG: SiteConfigData = {
  home: {
    tagline: 'FINE ART & EDITORIAL PHOTOGRAPHY',
    heading: 'INDIRA THAKUR',
    headingItalic: 'Preserving Pure & Timeless Emotion',
    subtext: 'Specializing in newborn, maternity, portraiture, films, and fine-art storytelling in Mumbai.',
    categories: ['Newborn', 'Maternity', 'Portraiture', 'Films', 'Events'],
    ctaText: 'Book An Experience',
    ctaLink: '/contact',
    secondaryCtaText: 'View Portfolios',
    secondaryCtaLink: '/gallery',
    backgroundGradient: 'from-[#1A1110] via-[#2C1810] to-rich-black',
    images: {
      heroMain: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Indira Thakur Photography' },
      heroSecondary: { url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=1200', alt: 'Newborn Fine Art' },
      background: { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600', alt: 'Portraiture' },
    },
    heroImages: [
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Indira Thakur Portrait' },
      { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600', alt: 'Fine Art Photography' },
      { url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=1600', alt: 'Newborn Storytelling' },
      { url: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1600', alt: 'Maternity Glow' },
    ],
    slideshowDuration: 7,
    transitionDuration: 1.5,
    kenBurnsEnabled: true,
    overlayIntensity: 0.5,
  },
  about: {
    eyebrow: 'THE STORY & VISION',
    heading: 'Preserving Life\'s Most Precious Moments',
    subheading: 'With Grace & Artistic Precision',
    story: 'Hello! I am Indira Thakur, a passionate storyteller and fine art photographer based in Mumbai.',
    storyContinued: 'In 2013, I transformed that passion into photography — capturing the delicate beauty of newborn beginnings, the radiance of maternity, and intimate family milestones.',
    philosophy: 'I believe every family is unique, and every session deserves patience, warmth, creativity, and genuine care.',
    philosophyContinued: 'Every photograph is crafted with meticulous attention to natural lighting, hand-selected wardrobe textures, and a comfortable, relaxed atmosphere.',
    journey: '',
    journeyContinued: '',
    welcomeMessage: '',
    signature: 'Indira Thakur',
    specializations: ['Newborn Photography', 'Maternity Photography', 'Fine Art Portraits', 'Cinematic Films'],
    achievements: [
      { title: '12+ Years Experience', description: 'Fine Art Photography', year: '12+' },
      { title: '1,500+ Families Served', description: 'Worldwide Trust', year: '1,500+' },
      { title: 'Filmcity Premier', description: 'Chitrapataka Festival', year: 'Awarded' },
    ],
    stats: [
      { label: 'Years Experience', value: '12+' },
      { label: 'Families Served', value: '1,500+' },
      { label: 'Awards & Honors', value: '15+' },
    ],
    values: [],
    ctaText: 'Inquire With Indira',
    ctaLink: '/contact',
    images: {
      founderPortrait: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Indira Thakur' },
      journeyImage: { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', alt: 'Journey' },
      storyImage: { url: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1200', alt: 'Story' },
      achievementImage: { url: '', alt: '' },
      behindTheScenes: { url: '', alt: '' },
      welcomeImage: { url: '', alt: '' },
      editorial1: { url: '', alt: '' },
      editorial2: { url: '', alt: '' },
    },
  },
  services: {
    eyebrow: 'BESPOKE SERVICES & EXPERIENCES',
    heading: 'Tailored Photography Collections',
    description: 'Thoughtfully curated luxury photography collections crafted with artistic precision, warmth, and quiet elegance.',
    services: [
      {
        title: 'Newborn Photography',
        subtitle: 'Gentle, soothing, and timeless first memories',
        description: 'Artistic newborn sessions crafted with warmth, utmost safety, and quiet grace in our serene studio environment.',
        gradient: 'from-[#2C1810] to-[#1A1110]',
        image: { url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=1200', alt: 'Newborn Photography' },
        tagline: 'Gentle & Safe Studio Sessions',
        features: ['Studio or Home Session', 'Wardrobe & Props Provided', 'Master Retouched Digitals'],
      },
      {
        title: 'Maternity Storytelling',
        subtitle: 'Celebrating the quiet majesty of new life',
        description: 'Fine-art maternity portraits capturing the strength, beauty, and intimate radiance of motherhood.',
        gradient: 'from-[#2C1810] to-[#1A1110]',
        image: { url: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1200', alt: 'Maternity Storytelling' },
        tagline: 'Radiant Fine-Art Portraits',
        features: ['Designer Gowns & Styling', 'Partner & Family Included', 'Sunset or Studio Lighting'],
      },
      {
        title: 'Fine Art Portraiture',
        subtitle: 'Personal and editorial portrait collections',
        description: 'Bespoke individual and legacy family portraits designed with cinematic lighting and editorial elegance.',
        gradient: 'from-[#2C1810] to-[#1A1110]',
        image: { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', alt: 'Fine Art Portraiture' },
        tagline: 'Timeless Family Legacy',
        features: ['Personal Creative Direction', 'Heirloom Printing Options', 'Private Online Gallery'],
      },
      {
        title: 'Cinematic Films & Highlights',
        subtitle: 'Moving pictures and living emotions',
        description: 'Short heirloom film stories preserving laughter, vows, voices, and emotional nuance in glorious motion.',
        gradient: 'from-[#2C1810] to-[#1A1110]',
        image: { url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200', alt: 'Cinematic Films' },
        tagline: 'Living Emotion in Motion',
        features: ['4K Video Production', 'Professional Audio & Scoring', 'Social & Heirloom Edits'],
      },
      {
        title: 'Family & Milestone Memories',
        subtitle: 'Capturing generations of warmth and connection',
        description: 'Authentic family milestone sessions designed to preserve genuine smiles and bonds across generations.',
        gradient: 'from-[#2C1810] to-[#1A1110]',
        image: { url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200', alt: 'Family & Milestone' },
        tagline: 'Generational Keepsakes',
        features: ['Multi-generational Groups', 'Indoor or Outdoor Setting', 'Heirloom Albums'],
      },
      {
        title: 'Celebration & Event Storytelling',
        subtitle: 'Preserving grand moments with artistic nuance',
        description: 'Discreet and comprehensive photo coverage for intimate luxury celebrations, baby showers, and anniversaries.',
        gradient: 'from-[#2C1810] to-[#1A1110]',
        image: { url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200', alt: 'Celebration & Event' },
        tagline: 'Artistic Event Coverage',
        features: ['Candid & Formal Portraits', 'Full Day Coverage', 'High-Res Digital Archive'],
      },
    ],
    bannerImage: { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600', alt: 'Services' },
  },
  galleryPreview: {
    eyebrow: 'PORTFOLIO',
    heading: 'Featured Work',
    featuredImages: [
      { url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=800', alt: 'Newborn' },
      { url: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=800', alt: 'Maternity' },
      { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800', alt: 'Portrait' },
    ],
    ctaText: 'View Full Gallery',
    ctaLink: '/gallery',
  },
  testimonials: {
    eyebrow: 'KIND WORDS',
    heading: 'What Families Say',
    testimonials: [
      {
        quote: 'Indira has an incredible gift for capturing stillness and emotion. Her gentle handling of our 10-day-old baby and her artistic eye produced photographs that belong in a museum.',
        author: 'Kavita & Vikram Mehta',
        role: 'Newborn & Family Session',
        rating: 5,
        avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', alt: 'Kavita Mehta' },
      },
      {
        quote: 'The experience was effortless, intimate, and truly luxurious. Every frame feels like a classic painting. I will cherish these portraits for the rest of my life.',
        author: 'Radhika Sen',
        role: 'Fine Art Portraiture',
        rating: 5,
        avatar: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200', alt: 'Radhika Sen' },
      },
      {
        quote: 'From the initial consultation to receiving our hand-crafted album, Indira provided a serene and unforgettable service. Her work is pure poetry.',
        author: 'Nikhil & Sunita Deshmukh',
        role: 'Maternity Storytelling',
        rating: 5,
        avatar: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200', alt: 'Nikhil Deshmukh' },
      },
      {
        quote: 'Our maternity portraits are breathtaking. Indira guided us with patience and warmth, making us feel completely comfortable in front of the lens.',
        author: 'Ananya & Devraj Kapoor',
        role: 'Maternity Session',
        rating: 5,
        avatar: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', alt: 'Ananya Kapoor' },
      },
      {
        quote: 'The fine-art quality of the prints and album exceeded all expectations. She captured our family bond in the most graceful way possible.',
        author: 'Dr. Sneha & Varun Iyer',
        role: 'Legacy Family Portraiture',
        rating: 5,
        avatar: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', alt: 'Dr. Sneha Iyer' },
      },
    ],
    backgroundImage: { url: '', alt: '' },
  },
  faq: {
    eyebrow: 'QUESTIONS & ANSWERS',
    heading: 'Session Details & Philosophy',
    faqs: [
      {
        question: 'When is the best time to schedule a newborn photography session?',
        answer: 'Newborn sessions are ideally conducted within the first 5 to 14 days after birth, when babies are naturally sleepier and comfortably curl into sweet poses.',
      },
      {
        question: 'Where do the photography sessions take place?',
        answer: 'Sessions take place either in our serene climate-controlled Mumbai studio, in the comfort of your home, or at selected sunlit outdoor locations.',
      },
      {
        question: 'What is included in a bespoke collection?',
        answer: 'Every collection includes high-resolution master-retouched digital images, private online galleries, personal styling consultation, and options for luxury hand-bound heirloom albums.',
      },
      {
        question: 'How far in advance should I reserve my maternity or newborn session?',
        answer: 'We recommend booking during your second trimester for maternity (scheduled around weeks 28–34) to secure availability in our calendar.',
      },
      {
        question: 'Do you offer videography and cinematic film coverage?',
        answer: 'Yes! We create high-definition cinematic short films alongside fine-art photography, preserving authentic laughter, ambient audio, and living emotion.',
      },
      {
        question: 'Are wardrobe and props provided for studio sessions?',
        answer: 'Yes, we maintain a curated luxury studio wardrobe with organic wraps, gowns, and hand-crafted props designed specifically for maternity and newborn sessions.',
      },
      {
        question: 'How and when will I receive my retouched photos and album?',
        answer: 'Soft proof galleries are delivered within 10 days of your shoot. Fully retouched high-resolution digitals and custom print heirlooms are delivered within 3–4 weeks.',
      },
      {
        question: 'Can family members and siblings participate in the session?',
        answer: 'Absolutely! Partner, sibling, and immediate family portraits are warmly included in all our maternity, newborn, and milestone sessions.',
      },
      {
        question: 'What safety protocols are followed during newborn shoots?',
        answer: 'Baby safety is our highest priority. All wraps and blankets are sanitized before every session, the studio is temperature-regulated, and Indira is trained in newborn safe-handling techniques.',
      },
      {
        question: 'Do you travel outside Mumbai for photo and film shoots?',
        answer: 'Yes, Indira is available for destination portraiture and event storytelling across India and internationally upon request.',
      },
    ],
  },
  contact: {
    eyebrow: 'GET IN TOUCH',
    heading: 'Begin Your Story',
    description: 'Reach out to inquire about availability, bespoke collections, or to schedule a personal consultation.',
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    location: 'Mumbai, Maharashtra, India',
    socialLinks: [
      { platform: 'Instagram', url: 'https://instagram.com' },
      { platform: 'Facebook', url: 'https://facebook.com' },
    ],
    bannerImage: { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600', alt: 'Contact' },
    studioImage: { url: 'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1200', alt: 'Studio' },
  },
  footer: {
    tagline: 'Fine Art Photography & Cinematic Films',
    description: 'Specializing in newborn, maternity, portraiture, family storytelling, and films in Mumbai, Maharashtra, India.',
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    instagramUrl: 'https://instagram.com',
    facebookUrl: 'https://facebook.com',
    backgroundFooter: { url: '', alt: '' },
    logo: { url: '', alt: '' },
  },
  booking: {
    eyebrow: 'RESERVATIONS',
    heading: 'Reserve Your Session',
    description: 'Select your preferred collection and date.',
    bannerImage: { url: '', alt: '' },
    sectionImage: { url: '', alt: '' },
  },
  seo: {
    title: 'Indira Thakur Photography | Fine Art, Editorial & Films',
    description: 'Indira Thakur Photography — Luxury newborn, maternity, portrait, event storytelling, and films in Mumbai, Maharashtra, India.',
    keywords: ['photographer', 'newborn', 'maternity', 'portrait', 'mumbai', 'films', 'maharashtra', 'india'],
    ogImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Indira Thakur Photography' },
  },
  brand: {
    siteName: 'Indira Thakur Photography',
    tagline: 'Fine Art, Editorial & Films',
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
    async function loadConfig() {
      fetchPromise = fetch('/api/site-config', { cache: 'no-store' })
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

      const data = await fetchPromise;
      if (data) setConfig(data);
      setLoading(false);
    }

    loadConfig();

    const handleUpdate = () => {
      loadConfig();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'site-config-updated') {
        loadConfig();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('site-config-updated', handleUpdate);
      window.addEventListener('storage', handleStorage);
      window.addEventListener('focus', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('site-config-updated', handleUpdate);
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('focus', handleUpdate);
      }
    };
  }, []);

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
    try {
      localStorage.setItem('site-config-updated', Date.now().toString());
    } catch {}
    window.dispatchEvent(new CustomEvent('site-config-updated'));
  }
}

