import mongoose, { Schema, Document } from 'mongoose';

export interface IDynamicSectionItem {
  heading?: string;
  body?: string;
  image?: { url: string; alt: string };
  icon?: string;
  label?: string;
}

export interface IDynamicSectionButton {
  text: string;
  link: string;
  style: 'primary' | 'secondary' | 'outline';
}

export interface IDynamicSectionImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface IDynamicSection {
  id: string;
  type: 'hero' | 'text-image' | 'banner' | 'gallery' | 'cards' | 'testimonials' | 'cta' | 'faq' | 'richtext' | 'split' | 'timeline' | 'video';
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;
  heading?: string;
  subheading?: string;
  body?: string;
  richText?: string;
  images: IDynamicSectionImage[];
  primaryImage?: IDynamicSectionImage;
  layout: 'full' | 'contained' | 'split-left' | 'split-right';
  background: 'white' | 'ivory' | 'cream' | 'rich-black' | 'charcoal' | 'gradient';
  backgroundGradient?: string;
  buttons: IDynamicSectionButton[];
  items: IDynamicSectionItem[];
  spacing: 'none' | 'small' | 'medium' | 'large';
  animation: 'none' | 'fade' | 'slide-up' | 'slide-in';
}

export interface IDynamicSectionsDocument extends Document {
  pageKey: string;
  sections: IDynamicSection[];
  updatedAt: Date;
}

const DynamicSectionItemSchema = new Schema<IDynamicSectionItem>(
  {
    heading: { type: String, default: '' },
    body: { type: String, default: '' },
    image: {
      type: {
        url: { type: String, default: '' },
        alt: { type: String, default: '' },
      },
      default: undefined,
    },
    icon: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const DynamicSectionButtonSchema = new Schema<IDynamicSectionButton>(
  {
    text: { type: String, default: '' },
    link: { type: String, default: '' },
    style: { type: String, enum: ['primary', 'secondary', 'outline'], default: 'primary' },
  },
  { _id: false }
);

const DynamicSectionImageSchema = new Schema<IDynamicSectionImage>(
  {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const DynamicSectionSchema = new Schema<IDynamicSection>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['hero', 'text-image', 'banner', 'gallery', 'cards', 'testimonials', 'cta', 'faq', 'richtext', 'split', 'timeline', 'video'],
      required: true,
    },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    heading: { type: String, default: '' },
    subheading: { type: String, default: '' },
    body: { type: String, default: '' },
    richText: { type: String, default: '' },
    images: { type: [DynamicSectionImageSchema], default: [] },
    primaryImage: { type: DynamicSectionImageSchema, default: undefined },
    layout: { type: String, enum: ['full', 'contained', 'split-left', 'split-right'], default: 'full' },
    background: { type: String, enum: ['white', 'ivory', 'cream', 'rich-black', 'charcoal', 'gradient'], default: 'white' },
    backgroundGradient: { type: String, default: '' },
    buttons: { type: [DynamicSectionButtonSchema], default: [] },
    items: { type: [DynamicSectionItemSchema], default: [] },
    spacing: { type: String, enum: ['none', 'small', 'medium', 'large'], default: 'medium' },
    animation: { type: String, enum: ['none', 'fade', 'slide-up', 'slide-in'], default: 'none' },
  },
  { _id: false }
);

const DynamicSectionsDocumentSchema = new Schema<IDynamicSectionsDocument>(
  {
    pageKey: { type: String, required: true, unique: true },
    sections: { type: [DynamicSectionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.DynamicSections ||
  mongoose.model<IDynamicSectionsDocument>('DynamicSections', DynamicSectionsDocumentSchema);
