import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import About from '@/models/About';

export const DEFAULT_ABOUT = {
  eyebrow: 'THE ARTIST & STORYTELLER',
  heading: 'Indira Thakur',
  subheading: 'Lifestyle Stills & Films',
  story: "Hello!\nI am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2014, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.",
  storyContinued: "I am a certified newborn photographer and specialise in child photography, maternity, birth photography and portrait photography.\nPhotography, for me, is much more than taking pictures.\nIt is about preserving emotions, celebrating life, documenting milestones, and creating timeless memories that people will treasure for generations.",
  philosophy: "I believe every family is unique, and every session deserves infinite patience, warmth, creative styling, and artistic care.",
  philosophyContinued: "From hand-selecting organic newborn wraps to guiding expectant mothers through effortless poses, every detail is handled with masterly intention.",
  journey: "One of the proudest milestones in my journey was creating a film for Dadasaheb Phalke Chitranagri (Filmcity), Goregaon, which premiered at the Chitrapataka Film Festival.",
  journeyContinued: "Over the past decade, I have had the honor of documenting over 500 family stories across India and internationally.",
  welcomeMessage: "I warmly invite you to become a part of the Indira Thakur Photography family. Let us create something timeless together.",
  signature: 'Indira Thakur',
  specializations: ['Newborn Photography', 'Maternity Photography', 'Portraits', 'Wedding Photography', 'Events', 'Brand Collaboration'],
  achievements: [
    { title: 'Filmcity Premiere', description: 'Documentary film created for Dadasaheb Phalke Chitranagri premiered at Chitrapataka Film Festival.', year: '2021' },
    { title: 'Master Newborn Specialist', description: 'Certified newborn art specialist with over 500+ infant sessions conducted.', year: '2019' },
    { title: 'Journalism & PR Excellence', description: 'Transformed storycraft from media journalism into high-end portrait photography.', year: '2014' },
  ],
  stats: [
    { label: 'Years of Experience', value: '11+' },
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
};

const FALLBACK_FILE_PATH = path.join('/tmp', 'about_fallback_store.json');
let memoryConfig: Record<string, unknown> | null = null;

function loadFallbackStore() {
  if (memoryConfig) return memoryConfig;
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const content = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        memoryConfig = parsed;
        return memoryConfig;
      }
    }
  } catch (err) {
    console.warn('[aboutStorage] Error reading fallback store:', err);
  }
  memoryConfig = { ...DEFAULT_ABOUT };
  saveFallbackStore(memoryConfig);
  return memoryConfig;
}

function saveFallbackStore(data: Record<string, unknown>) {
  memoryConfig = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[aboutStorage] Error writing fallback store:', err);
  }
}

export function sanitizeAboutData(data: any): Record<string, unknown> {
  if (!data || typeof data !== 'object') return { ...DEFAULT_ABOUT };
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    const val = sanitized[key];
    if (typeof val === 'string' && /devil|queen/i.test(val)) {
      sanitized[key] = (DEFAULT_ABOUT as any)[key] || '';
    }
  }
  return sanitized;
}

export async function fetchAboutData() {
  try {
    const { fetchSiteConfig } = await import('@/lib/siteConfigStorage');
    const siteConfig = await fetchSiteConfig();
    if (siteConfig && siteConfig.about && Object.keys(siteConfig.about).length > 0) {
      const clean = sanitizeAboutData(siteConfig.about);
      saveFallbackStore(clean);
      return clean;
    }

    const db = await connectToDatabase();
    if (db) {
      const mongoAbout = await (About as unknown as { findOne: () => { lean: () => Promise<Record<string, unknown>> } }).findOne().lean();
      if (mongoAbout) {
        const clean = sanitizeAboutData(mongoAbout);
        saveFallbackStore(clean);
        return clean;
      }
    }
  } catch (err) {
    console.warn('[aboutStorage] MongoDB fetch failed, using fallback store:', err);
  }

  return sanitizeAboutData(loadFallbackStore());
}

export async function updateAboutData(body: Record<string, unknown>) {
  delete body._id;
  delete body.__v;

  const current = loadFallbackStore();
  const updated = { ...current, ...body };
  saveFallbackStore(updated);

  try {
    const { updateSiteConfigData } = await import('@/lib/siteConfigStorage');
    await updateSiteConfigData({ about: body });

    const db = await connectToDatabase();
    if (db) {
      const saved = await (About as unknown as { findOneAndUpdate: (filter: object, doc: object, options: object) => Promise<Record<string, unknown>> }).findOneAndUpdate({}, body, { new: true, upsert: true });
      if (saved) return saved;
    }
  } catch (err) {
    console.warn('[aboutStorage] MongoDB update failed, saved to fallback:', err);
  }

  return updated;
}
