import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BrandSettings from '@/models/BrandSettings';
import { requireAdmin } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
import { sanitizeConfig, fetchSiteConfig, updateSiteConfigData } from '@/lib/siteConfigStorage';
import { DEFAULT_FULL_SITE_CONFIG } from '@/lib/siteConfigDefaults';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORRECT_CONTACT = {
  email: 'photography@indirathakur.com',
  phone: '+91 98196 20484',
  location: 'Mumbai, Maharashtra, India',
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
    if (!sanitized.contact.phone || /devil|queen|sorry/i.test(sanitized.contact.phone) || /9876543210|8885674172|99999/.test(sanitized.contact.phone)) {
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
    if (!sanitized.footer.phone || /devil|queen|sorry/i.test(sanitized.footer.phone) || /9876543210|8885674172|99999/.test(sanitized.footer.phone)) {
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
  if (!merged.contactPhone || /devil|queen|sorry/i.test(merged.contactPhone) || /9876543210|8885674172|99999/.test(merged.contactPhone)) {
    merged.contactPhone = CORRECT_CONTACT.phone;
  }
  if (!merged.contactLocation || /devil|queen|sorry/i.test(merged.contactLocation) || /bangalore|bengaluru/i.test(merged.contactLocation)) {
    merged.contactLocation = CORRECT_CONTACT.location;
  }
  return merged;
}

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
    return NextResponse.json(
      { error: 'Failed to read site configuration.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

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
      { status: error?.status || 500, headers: NO_CACHE_HEADERS }
    );
  }
}
