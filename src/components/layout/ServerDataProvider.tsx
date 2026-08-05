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
  location: 'Mumbai, India',
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
    if (!config.contact.location || config.contact.location.includes('Bangalore')) {
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
  }
  if (config.seo) {
    if (config.seo.description?.includes('Bangalore')) {
      config.seo.description = config.seo.description.replace('Bangalore', 'Mumbai');
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
  if (brand.contactLocation?.includes('Bangalore')) {
    brand.contactLocation = CORRECT_CONTACT.location;
  }
  return brand;
}

async function fetchServerData(): Promise<ServerData> {
  let config = null;
  let theme = null;
  let brand = null;

  try {
    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      config = migrateConfig(await SiteConfig.findOne().lean());
      theme = await ThemeSettings.findOne().lean();
      brand = migrateBrandConfig(await BrandSettings.findOne().lean());
    }
  } catch (error) {
    console.warn('[ServerDataProvider] fetch failed', error);
  }

  return { config, theme, brand };
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