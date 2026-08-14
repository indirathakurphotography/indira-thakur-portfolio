import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import ThemeSettings from '@/models/ThemeSettings';
import BrandSettings from '@/models/BrandSettings';
import AppProviders from './AppProviders';

import { fetchSiteConfig, sanitizeConfig } from '@/lib/siteConfigStorage';

interface ServerData {
  config: any;
  theme: any;
  brand: any;
}

const CORRECT_CONTACT = {
  email: 'photography@indirathakur.com',
  phone: '+916281332271',
  location: 'Mumbai, Maharashtra, India',
};

function migrateConfig(config: any): any {
  if (!config) return config;
  const sanitized = sanitizeConfig(config);
  if (sanitized.contact) {
    if (!sanitized.contact.email || /devil|queen|sorry/i.test(sanitized.contact.email) || !sanitized.contact.email.includes('@') || sanitized.contact.email.includes('hello@indirathakur')) {
      sanitized.contact.email = CORRECT_CONTACT.email;
    }
    if (!sanitized.contact.phone || /devil|queen|sorry/i.test(sanitized.contact.phone) || /9876543210|8885674172|99999/.test(sanitized.contact.phone)) {
      sanitized.contact.phone = CORRECT_CONTACT.phone;
    }
    if (!sanitized.contact.location || /devil|queen|sorry/i.test(sanitized.contact.location) || /bangalore|bengaluru/i.test(sanitized.contact.location)) {
      sanitized.contact.location = CORRECT_CONTACT.location;
    }
  }
  if (sanitized.footer) {
    if (!sanitized.footer.email || /devil|queen|sorry/i.test(sanitized.footer.email) || !sanitized.footer.email.includes('@') || sanitized.footer.email.includes('hello@indirathakur')) {
      sanitized.footer.email = CORRECT_CONTACT.email;
    }
    if (!sanitized.footer.phone || /devil|queen|sorry/i.test(sanitized.footer.phone) || /9876543210|8885674172|99999/.test(sanitized.footer.phone)) {
      sanitized.footer.phone = CORRECT_CONTACT.phone;
    }
    if (!sanitized.footer.location || /devil|queen|sorry/i.test(sanitized.footer.location) || /bangalore|bengaluru/i.test(sanitized.footer.location)) {
      sanitized.footer.location = CORRECT_CONTACT.location;
    }
  }
  if (sanitized.seo) {
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
  if (!brand) return brand;
  if (!brand.contactEmail || /devil|queen|sorry/i.test(brand.contactEmail) || !brand.contactEmail.includes('@') || brand.contactEmail.includes('hello@indirathakur')) {
    brand.contactEmail = CORRECT_CONTACT.email;
  }
  if (!brand.contactPhone || /devil|queen|sorry/i.test(brand.contactPhone) || /9876543210|8885674172|99999/.test(brand.contactPhone)) {
    brand.contactPhone = CORRECT_CONTACT.phone;
  }
  if (!brand.contactLocation || /devil|queen|sorry/i.test(brand.contactLocation) || /bangalore|bengaluru/i.test(brand.contactLocation)) {
    brand.contactLocation = CORRECT_CONTACT.location;
  }
  return brand;
}

export function invalidateServerDataCache() {
  // No-op for compatibility; cache is not retained across requests
}

async function fetchServerData(): Promise<ServerData> {
  const t0 = performance.now();
  let config = null;
  let theme = null;
  let brand = null;

  try {
    const [siteConfigResult, themeDoc, brandDoc] = await Promise.all([
      fetchSiteConfig(),
      process.env.MONGODB_URI ? ThemeSettings.findOne().lean().catch(() => null) : Promise.resolve(null),
      process.env.MONGODB_URI ? BrandSettings.findOne().lean().catch(() => null) : Promise.resolve(null),
    ]);

    config = sanitizeConfig(migrateConfig(siteConfigResult));
    theme = themeDoc;
    brand = migrateBrandConfig(brandDoc);
  } catch {
    // Graceful fallback to default client-side configuration when DB is not available
  }

  const result = { config, theme, brand };

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