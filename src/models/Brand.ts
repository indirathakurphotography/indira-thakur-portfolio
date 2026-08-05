import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  logo: {
    url: string;
    alt?: string;
  };
  websiteUrl?: string;
  category: 'Featured In' | 'Trusted By';
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const BrandSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: {
      url: { type: String, required: true },
      alt: { type: String, default: '' },
    },
    websiteUrl: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Featured In', 'Trusted By'],
      default: 'Featured In',
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);

export default Brand;
