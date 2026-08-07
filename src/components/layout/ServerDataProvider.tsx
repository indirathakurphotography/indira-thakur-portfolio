import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import ThemeSettings from '@/models/ThemeSettings';
import BrandSettings from '@/models/BrandSettings';
import AppProviders from './AppProviders';

interface ServerData {
  config: any;
  theme: any;
  brand: any;
}

const CORRECT_CONTACT = {
  email: 'photography@indirathakur.com',
  phone: '+91 9819620484',
  location: 'Mumbai, Maharashtra, India',
};

function migrateConfig(config: any): any {
  if (!config) return config;
  if (config.contact) {
    if (config.contact.email === 'hello@indirathakurphotography.com' || config.contact.email === 'hello@indirathakur.com') {
      config.contact.email = CORRECT_CONTACT.email;
    }
    if (config.contact.phone === '+91-9876543210' || config.contact.phone === '+91 8885674172' || config.contact.phone === '+91 99999 99999') {
      config.contact.phone = CORRECT_CONTACT.phone;
    }
    if (!config.contact.location || /bangalore|bengaluru/i.test(config.contact.location)) {
      config.contact.location = CORRECT_CONTACT.location;
    }
  }
  if (config.footer) {
    if (config.footer.email === 'hello@indirathakurphotography.com' || config.footer.email === 'hello@indirathakur.com') {
      config.footer.email = CORRECT_CONTACT.email;
    }
    if (config.footer.phone === '+91-9876543210' || config.footer.phone === '+91 8885674172' || config.footer.phone === '+91 99999 99999') {
      config.footer.phone = CORRECT_CONTACT.phone;
    }
    if (!config.footer.location || /bangalore|bengaluru/i.test(config.footer.location)) {
      config.footer.location = CORRECT_CONTACT.location;
    }
  }
  if (config.seo) {
    if (config.seo.description && /bangalore|bengaluru/i.test(config.seo.description)) {
      config.seo.description = config.seo.description.replace(/bangalore|bengaluru/gi, 'Mumbai, Maharashtra, India');
    }
    if (Array.isArray(config.seo.keywords)) {
      config.seo.keywords = config.seo.keywords.map((k: string) => /bangalore|bengaluru/i.test(k) ? 'mumbai' : k);
    }
  }
  return config;
}

function migrateBrandConfig(brand: any): any {
  if (!brand) return brand;
  if (brand.contactEmail === 'hello@indirathakurphotography.com' || brand.contactEmail === 'hello@indirathakur.com') {
    brand.contactEmail = CORRECT_CONTACT.email;
  }
  if (brand.contactPhone === '+91-9876543210' || brand.contactPhone === '+91 8885674172') {
    brand.contactPhone = CORRECT_CONTACT.phone;
  }
  if (!brand.contactLocation || /bangalore|bengaluru/i.test(brand.contactLocation)) {
    brand.contactLocation = CORRECT_CONTACT.location;
  }
  return brand;
}

let cachedData: ServerData | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30s in-memory cache

export function invalidateServerDataCache() {
  cachedData = null;
  lastFetchTime = 0;
}

async function fetchServerData(): Promise<ServerData> {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedData;
  }

  const t0 = performance.now();
  let config = null;
  let theme = null;
  let brand = null;

  try {
    if (process.env.MONGODB_URI) {
      const conn = await connectToDatabase();
      if (conn && mongoose.connection.readyState === 1) {
        const [configDoc, themeDoc, brandDoc] = await Promise.all([
          SiteConfig.findOne().lean(),
          ThemeSettings.findOne().lean(),
          BrandSettings.findOne().lean(),
        ]);

        config = migrateConfig(configDoc);
        theme = themeDoc;
        brand = migrateBrandConfig(brandDoc);
      }
    }
  } catch {
    // Graceful fallback to default client-side configuration when DB is not available
  }

  const result = { config, theme, brand };
  if (config || theme || brand) {
    cachedData = result;
    lastFetchTime = Date.now();
  }

  console.log(`[PERF][Server] fetchServerData took ${(performance.now() - t0).toFixed(2)}ms`);
  return result;
}

export default async function ServerDataProvider({ children }: { children: React.ReactNode }) {
  console.log('[ServerDataProvider] render');
  const { config, theme, brand } = await fetchServerData();

  const mergedConfig = config
    ? { ...config, brand: brand || config.brand || {} }
    : (brand ? { brand } : null);

  return (
    <AppProviders initialConfig={mergedConfig} initialTheme={theme} initialBrand={brand}>
      {children}
    </AppProviders>
  );
}