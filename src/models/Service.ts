import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  title: string;
  slug: string;
  tagline?: string;
  subtitle?: string;
  description: string;
  heroImage: string;
  publicId: string;
  benefits: string[];
  gallery: string[];
  price: string;
  cta: string;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    publicId: { type: String, default: '' },
    benefits: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    price: { type: String, default: '' },
    cta: { type: String, default: 'Book Now' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'services' }
);

export default (mongoose.models.Service as mongoose.Model<IService>) || mongoose.model<IService>('Service', ServiceSchema);
