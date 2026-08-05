import mongoose, { Schema, Document } from 'mongoose';

export interface IAbout extends Document {
  heroImage: string;
  image: string;
  publicId: string;
  story: string;
  philosophy: string;
  journey: string;
  values: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  achievements: string[];
  signature: string;
  createdAt: Date;
  updatedAt: Date;
}

const AboutSchema = new Schema<IAbout>(
  {
    heroImage: { type: String, default: '' },
    image: { type: String, default: '' },
    publicId: { type: String, default: '' },
    story: { type: String, default: '' },
    philosophy: { type: String, default: '' },
    journey: { type: String, default: '' },
    values: {
      type: [{ title: String, description: String }],
      default: [],
    },
    stats: {
      type: [{ label: String, value: String }],
      default: [],
    },
    achievements: { type: [String], default: [] },
    signature: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.About || mongoose.model<IAbout>('About', AboutSchema);
