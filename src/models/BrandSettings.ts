import mongoose, { Schema, Document } from 'mongoose';

export interface IBrandSettings extends Document {
  siteName: string;
  tagline: string;
  logo: { url: string; alt: string };
  preloaderLogo: { url: string; alt: string };
  favicon: { url: string; alt: string };
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  instagramUrl: string;
  facebookUrl: string;
  copyright: string;
  defaultOgImage: { url: string; alt: string };
  updatedAt: Date;
}

const BrandSettingsSchema = new Schema<IBrandSettings>(
  {
    siteName: { type: String, default: 'Indira Thakur Photography' },
    tagline: { type: String, default: 'Capturing Life\'s Precious Moments' },
    logo: { type: { url: { type: String, default: '' }, alt: { type: String, default: '' } }, default: () => ({ url: '', alt: '' }) },
    preloaderLogo: { type: { url: { type: String, default: '' }, alt: { type: String, default: '' } }, default: () => ({ url: '', alt: '' }) },
    favicon: { type: { url: { type: String, default: '' }, alt: { type: String, default: '' } }, default: () => ({ url: '', alt: '' }) },
    contactEmail: { type: String, default: 'hello@indirathakur.com' },
    contactPhone: { type: String, default: '+91 99999 99999' },
    contactLocation: { type: String, default: 'Bangalore, India' },
    instagramUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    copyright: { type: String, default: '© 2025 Indira Thakur Photography. All rights reserved.' },
    defaultOgImage: { type: { url: { type: String, default: '' }, alt: { type: String, default: '' } }, default: () => ({ url: '', alt: '' }) },
  },
  { timestamps: true }
);

export default mongoose.models.BrandSettings || mongoose.model<IBrandSettings>('BrandSettings', BrandSettingsSchema);
