import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  name: string;
  rating: number;
  content: string;
  source: 'google' | 'facebook' | 'website';
  date: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    content: { type: String, required: true },
    source: { type: String, enum: ['google', 'facebook', 'website'], default: 'website' },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
