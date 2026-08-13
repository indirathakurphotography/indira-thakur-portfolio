import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import BrandSettings from '@/models/BrandSettings';
import { fetchAllServices } from '@/lib/servicesStorage';
import { DEFAULT_FULL_SITE_CONFIG } from '@/app/api/site-config/route';

const FALLBACK_SITE_CONFIG_PATH = path.join('/tmp', 'site_config_fallback_store.json');

let memoryConfig: any = null;

const DEVIL_QUEEN_REGEX = /devil|queen|sorry/i;
const CORRECT_EMAIL = 'photography@indirathakur.com';
const CORRECT_PHONE = '+91 9819620484';
const CORRECT_LOCATION = 'Tilak Nagar, Chembur, Mumbai, Maharashtra, India';

function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function recursiveClean(val: any, defaultVal: any): any {
  if (typeof val === 'string') {
    if (DEVIL_QUEEN_REGEX.test(val)) {
      return typeof defaultVal === 'string' ? defaultVal : '';
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item, idx) => {
      const defItem = Array.isArray(defaultVal) ? defaultVal[idx] : undefined;
      return recursiveClean(item, defItem);
    });
  }
  if (val && typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      const defProp = defaultVal && typeof defaultVal === 'object' ? defaultVal[key] : undefined;
      cleaned[key] = recursiveClean(val[key], defProp);
    }
    return cleaned;
  }
  return val;
}

export function sanitizeConfig(config: any) {
  if (!config || typeof config !== 'object') return config;

  let cleaned = recursiveClean(config, DEFAULT_FULL_SITE_CONFIG);

  if (cleaned.contact) {
    if (!cleaned.contact.email || DEVIL_QUEEN_REGEX.test(cleaned.contact.email) || !cleaned.contact.email.includes('@') || cleaned.contact.email.includes('hello@indirathakur')) {
      cleaned.contact.email = CORRECT_EMAIL;
    }
    if (!cleaned.contact.phone || DEVIL_QUEEN_REGEX.test(cleaned.contact.phone) || /9876543210|8885674172|99999|6281332271/.test(cleaned.contact.phone)) {
      cleaned.contact.phone = CORRECT_PHONE;
    }
    if (!cleaned.contact.location || DEVIL_QUEEN_REGEX.test(cleaned.contact.location) || /bangalore|bengaluru/i.test(cleaned.contact.location)) {
      cleaned.contact.location = CORRECT_LOCATION;
    }
  }

  if (cleaned.footer) {
    if (!cleaned.footer.email || DEVIL_QUEEN_REGEX.test(cleaned.footer.email) || !cleaned.footer.email.includes('@') || cleaned.footer.email.includes('hello@indirathakur')) {
      cleaned.footer.email = CORRECT_EMAIL;
    }
    if (!cleaned.footer.phone || DEVIL_QUEEN_REGEX.test(cleaned.footer.phone) || /9876543210|8885674172|99999|6281332271/.test(cleaned.footer.phone)) {
      cleaned.footer.phone = CORRECT_PHONE;
    }
    if (!cleaned.footer.location || DEVIL_QUEEN_REGEX.test(cleaned.footer.location) || /bangalore|bengaluru/i.test(cleaned.footer.location)) {
      cleaned.footer.location = CORRECT_LOCATION;
    }
  }

  if (cleaned.brand) {
    if (!cleaned.brand.contactEmail || DEVIL_QUEEN_REGEX.test(cleaned.brand.contactEmail) || !cleaned.brand.contactEmail.includes('@') || cleaned.brand.contactEmail.includes('hello@indirathakur')) {
      cleaned.brand.contactEmail = CORRECT_EMAIL;
    }
    if (!cleaned.brand.contactPhone || DEVIL_QUEEN_REGEX.test(cleaned.brand.contactPhone) || /9876543210|8885674172|99999|6281332271/.test(cleaned.brand.contactPhone)) {
      cleaned.brand.contactPhone = CORRECT_PHONE;
    }
    if (!cleaned.brand.contactLocation || DEVIL_QUEEN_REGEX.test(cleaned.brand.contactLocation) || /bangalore|bengaluru/i.test(cleaned.brand.contactLocation)) {
      cleaned.brand.contactLocation = CORRECT_LOCATION;
    }
  }

  if (cleaned.home) {
    const rawHero = cleaned.home.heroImages;
    if (Array.isArray(rawHero)) {
      const filtered = rawHero.filter((img: any) => img && typeof img.url === 'string' && img.url.trim().length > 0 && !img.url.toLowerCase().includes('logo'));
      cleaned.home.heroImages = filtered.length > 0 ? filtered : DEFAULT_FULL_SITE_CONFIG.home.heroImages;
    } else {
      cleaned.home.heroImages = DEFAULT_FULL_SITE_CONFIG.home.heroImages;
    }
  }

  if (cleaned.services) {
    if (!Array.isArray(cleaned.services.services)) {
      cleaned.services.services = DEFAULT_FULL_SITE_CONFIG.services.services;
    }
  }

  return cleaned;
}

function loadFallbackConfig() {
  if (memoryConfig) return sanitizeConfig(memoryConfig);
  try {
    if (fs.existsSync(FALLBACK_SITE_CONFIG_PATH)) {
      const content = fs.readFileSync(FALLBACK_SITE_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        memoryConfig = sanitizeConfig(parsed);
        return memoryConfig;
      }
    }
  } catch (err) {
    console.warn('[siteConfigStorage] Error reading fallback config:', err);
  }
  memoryConfig = sanitizeConfig({ ...DEFAULT_FULL_SITE_CONFIG });
  saveFallbackConfig(memoryConfig);
  return memoryConfig;
}

function saveFallbackConfig(data: any) {
  memoryConfig = data;
  try {
    fs.writeFileSync(FALLBACK_SITE_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[siteConfigStorage] Error writing fallback config:', err);
  }
}

export async function fetchSiteConfig() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const configDoc: any = await (SiteConfig as any).findOne().lean();
      if (configDoc) {
        const [brandDoc, liveServices] = await Promise.all([
          (BrandSettings as any).findOne().lean().catch(() => null),
          fetchAllServices().catch(() => []),
        ]);

        if (liveServices && liveServices.length > 0) {
          configDoc.services = { ...(configDoc.services || {}), services: liveServices };
        }

        const merged = sanitizeConfig({
          ...configDoc,
          brand: brandDoc || configDoc.brand || DEFAULT_FULL_SITE_CONFIG.brand,
        });
        saveFallbackConfig(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('[siteConfigStorage] MongoDB connection error, using fallback:', err);
  }

  return loadFallbackConfig();
}

export async function updateSiteConfigData(body: any) {
  delete body._id;
  delete body.__v;
  delete body.createdAt;
  delete body.updatedAt;

  let savedDoc: any = null;

  try {
    const db = await connectToDatabase();
    if (db) {
      const existingDoc: any = await (SiteConfig as any).findOne().lean();
      const payloadToSave = existingDoc ? deepMerge(existingDoc, body) : deepMerge(DEFAULT_FULL_SITE_CONFIG, body);

      delete payloadToSave._id;
      delete payloadToSave.__v;

      savedDoc = await (SiteConfig as any).findOneAndUpdate(
        {},
        { $set: payloadToSave },
        {
          new: true,
          upsert: true,
          runValidators: false,
        }
      );
    }
  } catch (err) {
    console.error('[siteConfigStorage] MongoDB update error:', err);
    throw err;
  }

  const finalResult = savedDoc ? (savedDoc.toObject ? savedDoc.toObject() : savedDoc) : body;
  saveFallbackConfig(finalResult);

  // Non-blocking background sync for auxiliary stores
  (async () => {
    // Sync FAQs if present to ensure /api/faqs stays in sync
    if (body.faq && (Array.isArray(body.faq.faqs) || Array.isArray(body.faq.items))) {
      try {
        const { createNewFAQ, updateExistingFAQ, fetchAllFAQs } = await import('@/lib/faqsStorage');
        const faqsList = Array.isArray(body.faq.faqs) ? body.faq.faqs : body.faq.items;
        const existingFaqs = await fetchAllFAQs();
        for (let i = 0; i < faqsList.length; i++) {
          const item = faqsList[i];
          if (!item || !item.question) continue;
          const match = existingFaqs.find(e =>
            (item._id && e._id === item._id) ||
            e.question?.toLowerCase().trim() === item.question?.toLowerCase().trim()
          );
          if (match) {
            await updateExistingFAQ(match._id, { question: item.question, answer: item.answer, order: i + 1 });
          } else {
            await createNewFAQ({ question: item.question, answer: item.answer, order: i + 1 });
          }
        }
      } catch (faqSyncErr) {
        console.warn('[siteConfigStorage] FAQ sync warning:', faqSyncErr);
      }
    }

    // Sync services if present to ensure /api/services stays in sync
    if (body.services && Array.isArray(body.services.services)) {
      try {
        const { updateExistingService, createNewService, fetchAllServices } = await import('@/lib/servicesStorage');
        const existing = await fetchAllServices();

        for (let i = 0; i < body.services.services.length; i++) {
          const item = body.services.services[i];
          if (!item || !item.title) continue;
          const imgUrl = typeof item.image === 'string' ? item.image : (item.image?.url || '');
          const match = existing.find(e =>
            (item._id && e._id === item._id) ||
            e.title?.toLowerCase().trim() === item.title?.toLowerCase().trim() ||
            e.slug?.toLowerCase().trim() === (item.slug || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase().trim()
          );

          const svcData = {
            title: item.title,
            slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            tagline: item.subtitle || item.tagline || '',
            description: item.description || '',
            heroImage: imgUrl,
            image: imgUrl,
            order: i + 1,
          };

          if (match) {
            await updateExistingService(match._id, svcData);
          } else {
            await createNewService(svcData);
          }
        }
      } catch (syncErr) {
        console.warn('[siteConfigStorage] Services sync warning:', syncErr);
      }
    }

    // Sync About if present
    if (body.about) {
      try {
        const { updateAboutData } = await import('@/lib/aboutStorage');
        await updateAboutData(body.about);
      } catch (aboutSyncErr) {
        console.warn('[siteConfigStorage] About sync warning:', aboutSyncErr);
      }
    }
  })().catch(err => console.warn('[siteConfigStorage] Background sync error:', err));

  return finalResult;
}
