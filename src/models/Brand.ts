import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  logo: {
    url: string;
    alt?: string;
  };
  websiteUrl?: string;
  category?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    logo: {
      url: { type: String, required: true },
      alt: { type: String, default: '' },
    },
    websiteUrl: { type: String, default: '' },
    category: { type: String, default: 'Featured In' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema, 'brands');
