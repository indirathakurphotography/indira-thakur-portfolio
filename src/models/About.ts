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
  journey: string;
  welcomeMessage: string;
  images: Record<string, { url: string; alt: string }>;
  values: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  achievements: string[];
  signature: string;
  eyebrowTypography?: any;
  headingTypography?: any;
  subheadingTypography?: any;
  bodyTypography?: any;
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
    journey: { type: String, default: '' },
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
    eyebrowTypography: { type: Schema.Types.Mixed, default: () => ({}) },
    headingTypography: { type: Schema.Types.Mixed, default: () => ({}) },
    subheadingTypography: { type: Schema.Types.Mixed, default: () => ({}) },
    bodyTypography: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true, strict: false }
);

export default (mongoose.models.About as mongoose.Model<IAbout>) || mongoose.model<IAbout>('About', AboutSchema);
