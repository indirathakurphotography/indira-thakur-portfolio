import mongoose, { Schema, Document } from 'mongoose';

export interface IAboutImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface IAbout extends Document {
  eyebrow: string;
  heading: string;
  subheading: string;
  story: string;
  storyContinued: string;
  philosophy: string;
  philosophyContinued: string;
  journey: string;
  journeyContinued: string;
  welcomeMessage: string;
  signature: string;
  specializations: string[];
  achievements: { title: string; description: string; year?: string }[];
  stats: { label: string; value: string }[];
  values: { title: string; description: string }[];
  ctaText: string;
  ctaLink: string;
  images: {
    founderPortrait: IAboutImage;
    journeyImage: IAboutImage;
    storyImage: IAboutImage;
    achievementImage: IAboutImage;
    behindTheScenes: IAboutImage;
    welcomeImage: IAboutImage;
    editorial1: IAboutImage;
    editorial2: IAboutImage;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AboutImageSchema = new Schema<IAboutImage>(
  {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const AboutSchema = new Schema<IAbout>(
  {
    eyebrow: { type: String, default: 'The Story' },
    heading: { type: String, default: 'A Once-in-a-Lifetime Experience' },
    subheading: { type: String, default: '' },
    story: { type: String, default: '' },
    storyContinued: { type: String, default: '' },
    philosophy: { type: String, default: '' },
    philosophyContinued: { type: String, default: '' },
    journey: { type: String, default: '' },
    journeyContinued: { type: String, default: '' },
    welcomeMessage: { type: String, default: '' },
    signature: { type: String, default: 'Indira Thakur' },
    specializations: { type: [String], default: [] },
    achievements: {
      type: [{ title: String, description: String, year: String }],
      default: [],
    },
    stats: {
      type: [{ label: String, value: String }],
      default: [],
    },
    values: {
      type: [{ title: String, description: String }],
      default: [],
    },
    ctaText: { type: String, default: 'View Portfolio' },
    ctaLink: { type: String, default: '/gallery' },
    images: {
      type: {
        founderPortrait: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Indira Thakur Founder Portrait' }) },
        journeyImage: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Creative Journey' }) },
        storyImage: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Photography Story' }) },
        achievementImage: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Achievements' }) },
        behindTheScenes: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Behind the Scenes' }) },
        welcomeImage: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Welcome' }) },
        editorial1: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Editorial Fine Art I' }) },
        editorial2: { type: AboutImageSchema, default: () => ({ url: '', alt: 'Editorial Fine Art II' }) },
      },
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.models.About || mongoose.model<IAbout>('About', AboutSchema);
