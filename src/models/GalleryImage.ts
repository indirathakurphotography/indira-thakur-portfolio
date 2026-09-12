import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryImage extends Document {
  src: string;
  publicId: string;
  sourceKey?: string;
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

const GalleryImageSchema = new Schema<IGalleryImage>(
  {
    src: { type: String, required: true },
    publicId: { type: String, default: '' },
    sourceKey: { type: String, default: '', index: true, sparse: true },
    alt: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    width: { type: Number, default: 800 },
    height: { type: Number, default: 1000 },
    category: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GalleryImageSchema.index({ order: 1, createdAt: -1 });
GalleryImageSchema.index({ category: 1, order: 1, createdAt: -1 });
GalleryImageSchema.index({ featured: -1 });
GalleryImageSchema.index({ sourceKey: 1 }, { sparse: true });

export default (mongoose.models.GalleryImage as mongoose.Model<IGalleryImage>) || mongoose.model<IGalleryImage>('GalleryImage', GalleryImageSchema);
