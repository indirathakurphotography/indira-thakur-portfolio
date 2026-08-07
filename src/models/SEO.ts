import mongoose, { Schema, Document } from 'mongoose';

export interface ISEO extends Document {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  twitterHandle: string;
  canonicalUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const SEOSchema = new Schema<ISEO>(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterHandle: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.SEO || mongoose.model<ISEO>('SEO', SEOSchema);