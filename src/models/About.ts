import mongoose, { Schema, Document } from 'mongoose';

export interface IAbout extends Document {
  eyebrow: string;
  heading: string;
  subheading: string;
  heroImage: string;
  image: string;
  publicId: string;
  story: string;
  storyContinued: string;
  philosophy: string;
  philosophyContinued?: string;
  journey: string;
  journeyContinued?: string;
  extendedBio?: string;
  welcomeMessage: string;
  images: Record<string, { url: string; alt: string }>;
  values: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  achievements: string[];
  signature: string;
  typography?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AboutSchema = new Schema<IAbout>(
  {
    eyebrow: { type: String, default: '' },
    heading: { type: String, default: '' },
    subheading: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    image: { type: String, default: '' },
    publicId: { type: String, default: '' },
    story: { type: String, default: '' },
    storyContinued: { type: String, default: '' },
    philosophy: { type: String, default: '' },
    philosophyContinued: { type: String, default: '' },
    journey: { type: String, default: '' },
    journeyContinued: { type: String, default: '' },
    extendedBio: { type: String, default: '' },
    welcomeMessage: { type: String, default: '' },
    images: { type: Schema.Types.Mixed, default: {} },
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
    typography: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, strict: false }
);

if (mongoose.models && (mongoose.models as any).About) {
  delete (mongoose.models as any).About;
}

export default mongoose.model<IAbout>('About', AboutSchema);
