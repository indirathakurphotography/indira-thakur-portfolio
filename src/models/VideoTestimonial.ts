import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoTestimonial extends Document {
  title: string;
  clientName: string;
  role: string;
  quote: string;
  videoUrl: string;
  thumbnailUrl: string;
  publicId?: string;
  duration?: string;
  fileSize?: number;
  uploadSource: 'device' | 'google-drive' | 'url';
  rating?: number;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoTestimonialSchema = new Schema<IVideoTestimonial>(
  {
    title: { type: String, default: '' },
    clientName: { type: String, required: true },
    role: { type: String, default: '' },
    quote: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    duration: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    uploadSource: { 
      type: String, 
      enum: ['device', 'google-drive', 'url'], 
      default: 'device' 
    },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.VideoTestimonial || 
  mongoose.model<IVideoTestimonial>('VideoTestimonial', VideoTestimonialSchema);
