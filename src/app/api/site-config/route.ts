import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import BrandSettings from '@/models/BrandSettings';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';
import { sanitizeConfig } from '@/lib/siteConfigStorage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;



const CORRECT_CONTACT = {
  email: 'photography@indirathakur.com',
  phone: '+91 9819620484',
  location: 'Mumbai, Maharashtra, India',
};

export const DEFAULT_FULL_SITE_CONFIG = {
  home: {
    tagline: 'FINE ART PHOTOGRAPHY',
    heading: 'Every Frame',
    headingItalic: 'Tells a Story',
    subtext: 'Newborn • Maternity • Fine Art Portrait • Events & Collaborations',
    categories: ['Newborn', 'Maternity', 'Portrait', 'Events'],
    ctaText: 'Reserve Your Session',
    ctaLink: '/#contact',
    secondaryCtaText: 'Explore Gallery',
    secondaryCtaLink: '/gallery',
    backgroundGradient: 'from-[#1A1110] via-[#2C1810] to-rich-black',
    images: {
      heroMain: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg', alt: 'Maternity Fine Art' },
      heroSecondary: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Newborn Slumber' },
      background: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Wedding & Family Portraits' },
    },
    heroImages: [
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Wedding & Family Collection', duration: 7, animation: 'kenburns' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Newborn Storytelling', duration: 7, animation: 'kenburns' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523941414-newborn_family_shoot.jpg', alt: 'Newborn & Family Session', duration: 7, animation: 'kenburns' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg', alt: 'Fine Art Portraiture', duration: 7, animation: 'kenburns' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg', alt: 'Naming Ceremony Event', duration: 7, animation: 'kenburns' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg', alt: 'Newborn Family Portrait', duration: 7, animation: 'kenburns' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg', alt: 'Maternity Collection', duration: 7, animation: 'kenburns' },
    ],
    slideshowDuration: 7,
    transitionDuration: 1.5,
    kenBurnsEnabled: true,
    overlayIntensity: 0.5,
  },
  about: {
    eyebrow: 'THE ARTIST & STORYTELLER',
    heading: 'A Once-in-a-Lifetime Experience',
    subheading: 'Preserving Emotion, Heritage, and Pure Grace',
    story: "Hello! I am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for human emotions and unscripted narratives. In 2013, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.",
    storyContinued: "Photography is much more than taking pictures—it is about honoring families, capturing delicate beginnings, and creating heirloom memories that will be passed down through generations.",
    philosophy: "I believe every family is unique, and every session deserves infinite patience, warmth, creative styling, and artistic care.",
    philosophyContinued: "From hand-selecting organic newborn wraps to guiding expectant mothers through effortless poses, every detail is handled with masterly intention.",
    journey: "One of the proudest milestones in my journey was creating a film for Dadasaheb Phalke Chitranagri (Filmcity), Goregaon, which premiered at the Chitrapataka Film Festival.",
    journeyContinued: "Over the past decade, I have had the honor of documenting over 500 family stories across India and internationally.",
    welcomeMessage: "I warmly invite you to become a part of the Indira Thakur Photography family. Let us create something timeless together.",
    signature: 'Indira Thakur',
    specializations: ['Newborn Photography', 'Maternity Photography', 'Portraits', 'Wedding Photography', 'Events', 'Brand Collaboration'],
    achievements: [
      { title: 'Filmcity Premiere', description: 'Documentary film created for Dadasaheb Phalke Chitranagri premiered at Chitrapataka Film Festival.', year: '2021' },
      { title: 'Master Newborn Specialist', description: 'Safety-certified newborn art specialist with over 500+ infant sessions conducted.', year: '2019' },
      { title: 'Journalism & PR Excellence', description: 'Transformed storycraft from media journalism into high-end portrait photography.', year: '2013' },
    ],
    stats: [
      { label: 'Years of Experience', value: '12+' },
      { label: 'Families Documented', value: '500+' },
      { label: 'Publications & Festivals', value: '15+' },
      { label: 'Satisfaction Rating', value: '100%' },
    ],
    values: [
      { title: 'Safety & Comfort First', description: 'Infant safety certified with climate-controlled, ultra-hygienic studio settings.' },
      { title: 'Timeless Aesthetic', description: 'Soft, natural tones and painterly lighting that never go out of style.' },
      { title: 'Heirloom Quality', description: 'Museum-grade fine art prints and handcrafted leather albums built for lifetimes.' },
    ],
    ctaText: 'Explore My Work',
    ctaLink: '/gallery',
    images: {
      founderPortrait: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Indira Thakur Portrait' },
      journeyImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Wedding & Family Portraits' },
      storyImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Maternity Photography in Nature' },
      achievementImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/films/1785569204452-thumbnail.jpg', alt: 'Filmcity Premiere Film' },
      behindTheScenes: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg', alt: 'Studio Fine Art Session' },
      welcomeImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Newborn & Family Session' },
      editorial1: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg', alt: 'Naming Ceremony Celebration' },
      editorial2: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg', alt: 'Newborn Storytelling' },
    },
  },
  services: {
    eyebrow: 'WHAT I OFFER',
    heading: 'Bespoke Experience & Services',
    services: [
      {
        title: 'Newborn Photography',
        subtitle: 'Gentle & Safe First Slumbers',
        description: 'Safety-certified, peaceful infant art focusing on delicate details, organic textures, and pure family connection in a climate-controlled studio.',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Newborn Photography' },
      },
      {
        title: 'Maternity Photography',
        subtitle: 'Graceful & Timeless Pregnancy Art',
        description: 'Celebrate the extraordinary beauty of motherhood with couture studio gowns, artistic drapery, and romantic golden-hour lighting designed to highlight your strength and glow.',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Maternity Photography' },
      },
      {
        title: 'Portraits',
        subtitle: 'Timeless Heirloom Portraiture',
        description: 'Masterfully lit studio and outdoor portraiture capturing multi-generational grace, quiet intimacy, and authentic personal expression.',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg', alt: 'Portraits' },
      },
      {
        title: 'Wedding Photography',
        subtitle: 'Editorial Wedding Stories',
        description: 'Cinematic, documentary-style wedding coverage capturing sacred rituals, raw emotions, and grand celebrations with artistic flair.',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg', alt: 'Wedding Photography' },
      },
      {
        title: 'Events',
        subtitle: 'Milestone & Celebration Documentaries',
        description: 'Seamless event photography for family milestones, naming ceremonies, anniversaries, and high-profile gatherings.',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg', alt: 'Events' },
      },
      {
        title: 'Brand Collaboration',
        subtitle: 'Couture Brand & Editorial Storycraft',
        description: 'High-end editorial imagery, brand campaigns, and bespoke event documentaries crafted with journalistic precision and artistic flair.',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg', alt: 'Brand Collaboration' },
      },
    ],
    bannerImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Services Banner' },
  },
  galleryPreview: {
    eyebrow: 'CURATED GALLERIES',
    heading: 'Featured Portfolios',
    featuredImages: [
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Royal Maternity Collection' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Newborn Storytelling' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg', alt: 'Fine Art Portraiture' },
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Heritage Family Stories' },
    ],
    ctaText: 'View Full Gallery',
    ctaLink: '/gallery',
  },
  testimonials: {
    eyebrow: 'KIND WORDS & HEIRLOOMS',
    heading: 'Client Stories & Love Notes',
    testimonials: [
      {
        quote: 'Indira has an extraordinary gift. She made us feel so comfortable during our maternity shoot and handled our 8-day-old baby with such gentle warmth. The photographs belong in an art museum!',
        author: 'Aanya & Vikram Mehta',
        role: 'Maternity & Newborn Session',
        rating: 5,
        avatar: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/thumbnails/1785434846593-thumb-1785434844774.jpg', alt: 'Aanya Mehta' },
      },
      {
        quote: 'The patience and care Indira showed during our newborn session was remarkable. The heirloom album we received is our family’s most cherished treasure.',
        author: 'Priya & Rohan Sharma',
        role: 'Newborn Storytelling',
        rating: 5,
        avatar: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Priya Sharma' },
      },
      {
        quote: 'Working with Indira was an empowering experience. Her use of lighting and artistic composition created portraits that feel deeply personal yet timeless.',
        author: 'Kavita Iyer',
        role: 'Fine Art Portraiture',
        rating: 5,
        avatar: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg', alt: 'Kavita Iyer' },
      },
      {
        quote: 'Our maternity portraits are breathtaking. Indira guided us with patience and warmth, making us feel completely comfortable in front of the lens.',
        author: 'Ananya & Devraj Kapoor',
        role: 'Maternity Session',
        rating: 5,
        avatar: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Ananya Kapoor' },
      },
      {
        quote: 'The fine-art quality of the prints and album exceeded all expectations. She captured our family bond in the most graceful way possible.',
        author: 'Nikhil & Sunita Deshmukh',
        role: 'Heritage Family Storytelling',
        rating: 5,
        avatar: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Sunita Deshmukh' },
      },
    ],
    backgroundImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Testimonials Background' },
  },
  faq: {
    eyebrow: 'QUESTIONS & ANSWERS',
    heading: 'Session Details & Philosophy',
    faqs: [
      {
        question: 'When should we book you for birth photography?',
        answer: 'Please book us in your second trimester as it helps us to plan things ahead of time.',
      },
      {
        question: 'When is the best time for newborn shoot?',
        answer: "The best time to do a newborn shoot is within the first 15 days of the baby's birth.",
      },
      {
        question: 'What is the best time for maternity shoot?',
        answer: 'The best time for maternity shoot is between 24 and 28 weeks.',
      },
      {
        question: "Do you provide outfits for maternity shoot?",
        answer: "No, we don't provide outfits for maternity shoot. However, we can connect you to a reliable vendor.",
      },
      {
        question: 'Can you arrange for a MUA and hair stylist for the shoot?',
        answer: 'Yes, we can provide a MUA and a hair stylist.',
      },
      {
        question: 'When can we expect the photos to be delivered?',
        answer: 'The final photos are shared within 2 weeks after the shoot.',
      },
      {
        question: 'Do you have the option of photo prints or albums?',
        answer: 'Yes.',
      },
      {
        question: 'What are your charges?',
        answer: "As we provide a range of photography and videography services, the charges vary. Please fill up the contact form so we can provide you a quote that's tailored to your needs.",
      },
      {
        question: 'Do you provide raw pictures?',
        answer: "We don't provide raw pictures.",
      },
      {
        question: 'Do you travel for shoots?',
        answer: 'Yes, we do travel for shoots.',
      },
    ],
  },
  contact: {
    eyebrow: "LET'S CREATE TOGETHER",
    heading: 'Begin Your Family Story',
    description: 'Every heirloom portrait collection starts with an intimate conversation. Reach out to discuss dates, wardrobe styling, and creative concepts.',
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    location: 'Mumbai, Maharashtra, India',
    socialLinks: [
      { platform: 'Instagram', url: 'https://instagram.com/indirathakurphotography' },
      { platform: 'Facebook', url: 'https://facebook.com/indirathakurphotography' },
      { platform: 'WhatsApp', url: 'https://wa.me/919819620484' },
    ],

    bannerImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg', alt: 'Contact Studio' },
    studioImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg', alt: 'Mumbai Studio Interior' },
  },
  footer: {
    tagline: 'INDIRA THAKUR PHOTOGRAPHY',
    description: "Documenting life's most precious moments with warmth, artistry, and an unwavering attention to detail.",
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    instagramUrl: 'https://instagram.com/indirathakurphotography',
    facebookUrl: 'https://facebook.com/indirathakurphotography',
    backgroundFooter: { url: '', alt: '' },
    logo: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg', alt: 'Indira Thakur Photography Logo' },
  },
  booking: {
    eyebrow: 'RESERVE YOUR COMMISSION',
    heading: 'Session Booking & Experience',
    description: 'Select your preferred photography collection, schedule your date, and prepare for an unforgettable fine art experience.',
    bannerImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg', alt: 'Booking Banner' },
    sectionImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg', alt: 'Booking Section' },
  },
  seo: {
    title: 'Indira Thakur Photography | Fine Art Newborn, Maternity & Portrait Photography Mumbai',
    description: 'Professional photographer specializing in fine art newborn, maternity, portrait, and event photography based in Mumbai, Maharashtra, India.',
    keywords: ['photographer', 'newborn photography', 'maternity portrait', 'fine art portraiture', 'mumbai', 'maharashtra', 'india'],
    ogImage: { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg', alt: 'Indira Thakur Photography' },
  },
  brand: {
    name: 'Indira Thakur Photography',
    siteName: 'Indira Thakur Photography',
    tagline: 'Fine Art Newborn, Maternity & Portraiture',
    contactEmail: 'photography@indirathakur.com',
    contactPhone: '+91 9819620484',
    contactLocation: 'Mumbai, Maharashtra, India',
    instagramUrl: 'https://instagram.com/indirathakurphotography',
    facebookUrl: 'https://facebook.com/indirathakurphotography',
  },
};

function deepMergeDefaults(target: any, defaults: any): any {
  if (!target || typeof target !== 'object') return { ...defaults };
  const merged = { ...defaults, ...target };
  for (const key of Object.keys(defaults)) {
    if (Array.isArray(defaults[key])) {
      if (Array.isArray(target[key])) {
        merged[key] = target[key];
      } else {
        merged[key] = defaults[key];
      }
    } else if (defaults[key] && typeof defaults[key] === 'object') {
      if (target[key] !== undefined && target[key] !== null) {
        merged[key] = deepMergeDefaults(target[key], defaults[key]);
      } else {
        merged[key] = defaults[key];
      }
    } else if (target[key] !== undefined) {
      merged[key] = target[key];
    } else if (defaults[key]) {
      merged[key] = defaults[key];
    }
  }
  return merged;
}

function migrateConfig(config: any): any {
  if (!config) return DEFAULT_FULL_SITE_CONFIG;
  const merged = deepMergeDefaults(config, DEFAULT_FULL_SITE_CONFIG);
  
  // Apply comprehensive sanitation
  const sanitized = sanitizeConfig(merged);

  if (sanitized.contact) {
    if (!sanitized.contact.email || /devil|queen|sorry/i.test(sanitized.contact.email) || !sanitized.contact.email.includes('@') || sanitized.contact.email.includes('hello@indirathakur')) {
      sanitized.contact.email = CORRECT_CONTACT.email;
    }
    if (!sanitized.contact.phone || /devil|queen|sorry/i.test(sanitized.contact.phone) || /9876543210|8885674172|99999|6281332271/.test(sanitized.contact.phone)) {
      sanitized.contact.phone = CORRECT_CONTACT.phone;
    }
    if (!sanitized.contact.location || /devil|queen|sorry/i.test(sanitized.contact.location) || /bangalore|bengaluru/i.test(sanitized.contact.location)) {
      sanitized.contact.location = CORRECT_CONTACT.location;
    }
  }

  if (sanitized.footer) {
    sanitized.footer.backgroundFooter = { url: '', alt: '' };
    if (!sanitized.footer.email || /devil|queen|sorry/i.test(sanitized.footer.email) || !sanitized.footer.email.includes('@') || sanitized.footer.email.includes('hello@indirathakur')) {
      sanitized.footer.email = CORRECT_CONTACT.email;
    }
    if (!sanitized.footer.phone || /devil|queen|sorry/i.test(sanitized.footer.phone) || /9876543210|8885674172|99999|6281332271/.test(sanitized.footer.phone)) {
      sanitized.footer.phone = CORRECT_CONTACT.phone;
    }
    if (!sanitized.footer.location || /devil|queen|sorry/i.test(sanitized.footer.location) || /bangalore|bengaluru/i.test(sanitized.footer.location)) {
      sanitized.footer.location = CORRECT_CONTACT.location;
    }
  }

  if (sanitized.seo) {
    if (!sanitized.seo.email || /devil|queen|sorry/i.test(sanitized.seo.email) || !sanitized.seo.email.includes('@') || sanitized.seo.email.includes('hello@indirathakur')) {
      sanitized.seo.email = CORRECT_CONTACT.email;
    }
    if (sanitized.seo.description && /bangalore|bengaluru/i.test(sanitized.seo.description)) {
      sanitized.seo.description = sanitized.seo.description.replace(/bangalore|bengaluru/gi, 'Mumbai, Maharashtra, India');
    }
    if (Array.isArray(sanitized.seo.keywords)) {
      sanitized.seo.keywords = sanitized.seo.keywords.map((k: string) => /bangalore|bengaluru/i.test(k) ? 'mumbai' : k);
    }
  }

  return sanitized;
}

function migrateBrandConfig(brand: any): any {
  if (!brand) return DEFAULT_FULL_SITE_CONFIG.brand;
  const merged = { ...DEFAULT_FULL_SITE_CONFIG.brand, ...brand };
  if (!merged.contactEmail || /devil|queen|sorry/i.test(merged.contactEmail) || !merged.contactEmail.includes('@') || merged.contactEmail.includes('hello@indirathakur')) {
    merged.contactEmail = CORRECT_CONTACT.email;
  }
  if (!merged.contactPhone || /devil|queen|sorry/i.test(merged.contactPhone) || /9876543210|8885674172|99999|6281332271/.test(merged.contactPhone)) {
    merged.contactPhone = CORRECT_CONTACT.phone;
  }
  if (!merged.contactLocation || /devil|queen|sorry/i.test(merged.contactLocation) || /bangalore|bengaluru/i.test(merged.contactLocation)) {
    merged.contactLocation = CORRECT_CONTACT.location;
  }
  return merged;
}

import { fetchSiteConfig, updateSiteConfigData } from '@/lib/siteConfigStorage';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const config = await fetchSiteConfig();
    const migrated = migrateConfig(config || DEFAULT_FULL_SITE_CONFIG);
    if (migrated.brand) {
      migrated.brand = migrateBrandConfig(migrated.brand);
    } else {
      migrated.brand = DEFAULT_FULL_SITE_CONFIG.brand;
    }

    return NextResponse.json(migrated, {
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error('SiteConfig GET error:', error);
    return NextResponse.json(DEFAULT_FULL_SITE_CONFIG, {
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json();

    const config = await updateSiteConfigData(body);

    // Read-after-write verification from API layer
    const freshConfig = await fetchSiteConfig();
    const verified = migrateConfig(freshConfig || DEFAULT_FULL_SITE_CONFIG);

    // Verify key fields if home was updated
    if (body.home?.heading && verified.home?.heading !== body.home?.heading) {
      throw new Error(`Read-after-write verification mismatch: Heading in DB is "${verified.home?.heading}" but requested "${body.home.heading}"`);
    }

    triggerRevalidation();

    return NextResponse.json(verified, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('SiteConfig PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update site configuration' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
