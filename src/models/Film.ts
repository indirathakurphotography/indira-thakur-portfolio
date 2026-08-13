import mongoose, { Schema, Document } from 'mongoose';

export interface IFilm extends Document {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  publicId?: string;
  category: string;
  duration?: string;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FilmSchema = new Schema<IFilm>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    category: { type: String, default: 'Films' },
    duration: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Film || mongoose.model<IFilm>('Film', FilmSchema);
