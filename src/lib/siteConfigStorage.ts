import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import BrandSettings from '@/models/BrandSettings';
import { fetchAllServices } from '@/lib/servicesStorage';
import { DEFAULT_FULL_SITE_CONFIG } from '@/lib/siteConfigDefaults';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

const DEVIL_QUEEN_REGEX = /devil|queen|sorry/i;
const CORRECT_EMAIL = 'photography@indirathakur.com';
const CORRECT_PHONE = '+91 9819620484';
const CORRECT_LOCATION = 'Tilak Nagar, Chembur, Mumbai, Maharashtra, India';

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

  const DEPRECATED_HERO_URLS = [
    '1785573149313-47.jpg',
    '1785573522517-IMG_4416_copy_b_w.jpg',
  ];

  if (cleaned.home) {
    const rawHero = cleaned.home.heroImages;
    if (Array.isArray(rawHero)) {
      const filtered = rawHero.filter((img: any) =>
        img &&
        typeof img.url === 'string' &&
        img.url.trim().length > 0 &&
        !img.url.toLowerCase().includes('logo') &&
        !DEPRECATED_HERO_URLS.some(dep => img.url.includes(dep))
      );
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

export async function fetchSiteConfig() {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Site configuration cannot be read.');
  }

  const configDoc: any = await SiteConfig.findOne().lean();
  if (!configDoc) {
    return null;
  }

  const brandDoc = await BrandSettings.findOne().lean().catch(() => null);
  const liveServices = await fetchAllServices().catch(() => []);

  let merged = {
    ...configDoc,
    brand: brandDoc || configDoc.brand || DEFAULT_FULL_SITE_CONFIG.brand,
  };

  if (liveServices && liveServices.length > 0) {
    merged.services = { ...(merged.services || {}), services: liveServices };
  }

  merged._id = undefined;
  merged.__v = undefined;

  return sanitizeConfig(merged);
}

export async function updateSiteConfigData(body: any) {
  assertNoProhibitedLanguage(body);
  delete body._id;
  delete body.__v;
  delete body.createdAt;
  delete body.updatedAt;

  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection failed. Unable to persist site configuration.');
  }

  const existingDoc: any = await SiteConfig.findOne().lean();

  const deepMerge = (target: any, source: any): any => {
    const output = { ...target };
    if (target && typeof target === 'object' && !Array.isArray(target) && source && typeof source === 'object' && !Array.isArray(source)) {
      Object.keys(source).forEach((key) => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  };

  const payloadToSave = existingDoc ? deepMerge(existingDoc, body) : deepMerge(DEFAULT_FULL_SITE_CONFIG, body);

  delete payloadToSave._id;
  delete payloadToSave.__v;

  const savedDoc: any = await SiteConfig.findOneAndUpdate(
    {},
    { $set: payloadToSave },
    {
      new: true,
      upsert: true,
      runValidators: false,
    }
  );

  if (!savedDoc) {
    throw new Error('MongoDB update query failed to persist SiteConfig document.');
  }

  // Read-after-write verification from MongoDB
  const verifiedDoc: any = await SiteConfig.findOne().lean();
  if (!verifiedDoc) {
    throw new Error('Read-after-write verification failed: Saved SiteConfig document not found in MongoDB.');
  }

  return sanitizeConfig(verifiedDoc);
}
