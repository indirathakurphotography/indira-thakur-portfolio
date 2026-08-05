import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import BrandSettings from '@/models/BrandSettings';
import { requireAuth } from '@/lib/auth';
import { triggerRevalidation } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

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
    if (config.contact.phone === '+91-9876543210' || config.contact.phone === '+91 8885674172') {
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
    if (config.footer.phone === '+91-9876543210' || config.footer.phone === '+91 8885674172') {
      config.footer.phone = CORRECT_CONTACT.phone;
    }
    if (!config.footer.location || /bangalore|bengaluru/i.test(config.footer.location)) {
      config.footer.location = CORRECT_CONTACT.location;
    }
  }
  if (config.seo) {
    if (config.seo.email === 'hello@indirathakurphotography.com' || config.seo.email === 'hello@indirathakur.com') {
      config.seo.email = CORRECT_CONTACT.email;
    }
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

export async function GET() {
  try {
    await connectToDatabase();
    // Auto-migrate any MongoDB records containing legacy Bangalore/Bengaluru locations
    await SiteConfig.updateMany(
      { $or: [{ 'contact.location': /bangalore|bengaluru/i }, { 'footer.location': /bangalore|bengaluru/i }, { 'seo.description': /bangalore|bengaluru/i }, { 'seo.keywords': /bangalore|bengaluru/i }] },
      { $set: { 'contact.location': 'Mumbai, Maharashtra, India', 'footer.location': 'Mumbai, Maharashtra, India', 'seo.description': 'Professional photographer specializing in newborn, maternity, portrait, and event photography. Based in Mumbai, Maharashtra, India.', 'seo.keywords': ['photographer', 'newborn', 'maternity', 'portrait', 'mumbai', 'maharashtra', 'india'] } }
    ).catch(() => {});
    await BrandSettings.updateMany(
      { contactLocation: /bangalore|bengaluru/i },
      { $set: { contactLocation: 'Mumbai, Maharashtra, India' } }
    ).catch(() => {});

    let config = await SiteConfig.findOne().lean();
    if (!config) {
      config = await SiteConfig.create({});
    }
    config = migrateConfig(config);
    const brand = migrateBrandConfig(await BrandSettings.findOne().lean());
    return NextResponse.json({ ...config, brand: brand || {} });
  } catch (error) {
    console.error('SiteConfig GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch site configuration' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    const config = await SiteConfig.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    triggerRevalidation();

    return NextResponse.json(config);
  } catch (error) {
    console.error('SiteConfig PUT error:', error);
    return NextResponse.json({ error: 'Failed to update site configuration' }, { status: 500 });
  }
}
