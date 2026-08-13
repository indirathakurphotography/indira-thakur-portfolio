import mongoose, { Schema, Document } from 'mongoose';

export interface ISEO extends Document {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: string;
  favicon: string;
  createdAt: Date;
  updatedAt: Date;
}

const SEOSchema = new Schema<ISEO>(
  {
    metaTitle: { type: String, default: 'Indira Thakur Photography | Best Maternity & Newborn Photographer in Tilak Nagar, Chembur, Mumbai' },
    metaDescription: { type: String, default: 'Premier Mumbai maternity photographer, best newborn photographer in Chembur, birth photographer, and luxury family portrait studio in Tilak Nagar, Chembur, Mumbai by Indira Thakur.' },
    keywords: { type: String, default: '' },
    canonicalUrl: { type: String, default: 'https://indirathakurphotography.com' },
    ogTitle: { type: String, default: 'Indira Thakur Photography | Fine Art Newborn & Maternity Studio Mumbai' },
    ogDescription: { type: String, default: 'Award-winning luxury photographer specializing in newborn, maternity, portrait, and wedding storytelling in Tilak Nagar, Chembur, Mumbai, Maharashtra, India.' },
    ogImage: { type: String, default: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg' },
    twitterTitle: { type: String, default: 'Indira Thakur Photography | Luxury Photography Studio Mumbai' },
    twitterDescription: { type: String, default: 'Award-winning fine art photographer specializing in newborn, maternity, and portrait photography in Tilak Nagar, Chembur, Mumbai.' },
    twitterImage: { type: String, default: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg' },
    twitterCard: { type: String, default: 'summary_large_image' },
    favicon: { type: String, default: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg' },
  },
  { timestamps: true }
);

export default mongoose.models.SEO || mongoose.model<ISEO>('SEO', SEOSchema);