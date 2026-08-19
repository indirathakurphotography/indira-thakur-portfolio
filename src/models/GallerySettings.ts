import mongoose, { Schema, Document } from 'mongoose';
import {
  IGallerySettings,
  DEFAULT_GALLERY_SETTINGS,
} from '@/types/gallerySettings';

export * from '@/types/gallerySettings';

export interface IGallerySettingsDocument extends IGallerySettings, Document {
  createdAt: Date;
  updatedAt: Date;
}

export const GallerySettingsSchema = new Schema<IGallerySettingsDocument>(
  {
    eyebrow: { type: String, default: DEFAULT_GALLERY_SETTINGS.eyebrow },
    heading: { type: String, default: DEFAULT_GALLERY_SETTINGS.heading },
    subtitle: { type: String, default: DEFAULT_GALLERY_SETTINGS.subtitle },
    categoryIntroductions: {
      type: Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_GALLERY_SETTINGS.categoryIntroductions }),
    },
    displayStyle: {
      type: String,
      enum: [
        'editorial-grid',
        'masonry',
        'uniform-grid',
        'large-editorial',
        'horizontal-scroll',
        'circular',
        'polaroid',
        'filmstrip',
      ],
      default: DEFAULT_GALLERY_SETTINGS.displayStyle,
    },
    imageInteraction: {
      type: String,
      enum: [
        'static',
        'subtle-zoom',
        'lift',
        'reveal',
        'scroll-motion',
        'circular-motion',
        'cinematic',
      ],
      default: DEFAULT_GALLERY_SETTINGS.imageInteraction,
    },
    clickBehavior: {
      type: String,
      enum: ['lightbox', 'full-image', 'none'],
      default: DEFAULT_GALLERY_SETTINGS.clickBehavior,
    },
    aspectRatio: {
      type: String,
      enum: ['original', '1:1', '4:5', '3:4', '2:3', '3:2', '16:9'],
      default: DEFAULT_GALLERY_SETTINGS.aspectRatio,
    },
    desktopColumns: { type: Number, default: DEFAULT_GALLERY_SETTINGS.desktopColumns },
    tabletColumns: { type: Number, default: DEFAULT_GALLERY_SETTINGS.tabletColumns },
    mobileColumns: { type: Number, default: DEFAULT_GALLERY_SETTINGS.mobileColumns },
    imageGap: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: DEFAULT_GALLERY_SETTINGS.imageGap,
    },
    borderRadius: {
      type: String,
      enum: ['none', 'small', 'medium', 'large', 'full'],
      default: DEFAULT_GALLERY_SETTINGS.borderRadius,
    },
    categoryStyle: {
      type: String,
      enum: ['text-tabs', 'underline-tabs', 'pills', 'minimal-buttons'],
      default: DEFAULT_GALLERY_SETTINGS.categoryStyle,
    },
    headerAlignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: DEFAULT_GALLERY_SETTINGS.headerAlignment,
    },
    headerSpacing: {
      type: String,
      enum: ['compact', 'normal', 'spacious'],
      default: DEFAULT_GALLERY_SETTINGS.headerSpacing,
    },
    introWidth: {
      type: String,
      enum: ['narrow', 'medium', 'wide'],
      default: DEFAULT_GALLERY_SETTINGS.introWidth,
    },
  },
  { timestamps: true }
);

export default (mongoose.models.GallerySettings as mongoose.Model<IGallerySettingsDocument>) ||
  mongoose.model<IGallerySettingsDocument>('GallerySettings', GallerySettingsSchema);
