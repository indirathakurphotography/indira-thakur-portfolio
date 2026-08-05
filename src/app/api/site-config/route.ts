import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import BrandSettings from '@/models/BrandSettings';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
    if (config.contact.phone === '+91-9876543210' || config.contact.phone === '+91 8885674172') {
      config.contact.phone = CORRECT_CONTACT.phone;
    }
    if (config.contact.location?.includes('Bangalore')) {
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
    if (config.footer.location?.includes('Bangalore')) {
      config.footer.location = 'Mumbai & Bangalore, India';
    }
  }
  if (config.seo) {
    if (config.seo.email === 'hello@indirathakurphotography.com' || config.seo.email === 'hello@indirathakur.com') {
      config.seo.email = CORRECT_CONTACT.email;
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

export async function GET() {
  try {
    await connectToDatabase();
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

    return NextResponse.json(config);
  } catch (error) {
    console.error('SiteConfig PUT error:', error);
    return NextResponse.json({ error: 'Failed to update site configuration' }, { status: 500 });
  }
}
