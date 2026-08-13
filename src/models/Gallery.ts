import mongoose, { Schema, Document } from 'mongoose';

export interface IGallery extends Document {
  src: string;
  publicId: string;
  alt: string;
  title: string;
  description: string;
  width: number;
  height: number;
  category: string;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    src: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    width: { type: Number, default: 800 },
    height: { type: Number, default: 1000 },
    category: { type: String, default: 'Portrait' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Gallery || mongoose.model<IGallery>('Gallery', GallerySchema);
