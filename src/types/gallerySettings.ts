export type GalleryDisplayStyle =
  | 'editorial-grid'
  | 'masonry'
  | 'uniform-grid'
  | 'large-editorial'
  | 'horizontal-scroll'
  | 'circular'
  | 'polaroid'
  | 'filmstrip';

export type GalleryImageInteraction =
  | 'static'
  | 'subtle-zoom'
  | 'lift'
  | 'reveal'
  | 'scroll-motion'
  | 'circular-motion'
  | 'cinematic';

export type GalleryClickBehavior = 'lightbox' | 'full-image' | 'none';

export type GalleryAspectRatio =
  | 'original'
  | '1:1'
  | '4:5'
  | '3:4'
  | '2:3'
  | '3:2'
  | '16:9';

export type GalleryCategoryStyle =
  | 'text-tabs'
  | 'underline-tabs'
  | 'pills'
  | 'minimal-buttons';

export type GalleryHeaderAlignment = 'left' | 'center' | 'right';
export type GalleryHeaderSpacing = 'compact' | 'normal' | 'spacious';
export type GalleryIntroWidth = 'narrow' | 'medium' | 'wide';
export type GalleryImageGap = 'small' | 'medium' | 'large';
export type GalleryBorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface IGallerySettings {
  eyebrow: string;
  heading: string;
  subtitle: string;
  displayStyle: GalleryDisplayStyle;
  imageInteraction: GalleryImageInteraction;
  clickBehavior: GalleryClickBehavior;
  aspectRatio: GalleryAspectRatio;
  desktopColumns: number;
  tabletColumns: number;
  mobileColumns: number;
  imageGap: GalleryImageGap;
  borderRadius: GalleryBorderRadius;
  categoryStyle: GalleryCategoryStyle;
  headerAlignment: GalleryHeaderAlignment;
  headerSpacing: GalleryHeaderSpacing;
  introWidth: GalleryIntroWidth;
}

export const DEFAULT_GALLERY_SETTINGS: IGallerySettings = {
  eyebrow: 'PORTFOLIO',
  heading: 'The Gallery',
  subtitle:
    'Where vision becomes visual language and every detail carries meaning —\nimagery crafted to make a brand feel as memorable as it truly is.',
  displayStyle: 'editorial-grid',
  imageInteraction: 'subtle-zoom',
  clickBehavior: 'lightbox',
  aspectRatio: 'original',
  desktopColumns: 4,
  tabletColumns: 3,
  mobileColumns: 1,
  imageGap: 'medium',
  borderRadius: 'small',
  categoryStyle: 'text-tabs',
  headerAlignment: 'center',
  headerSpacing: 'normal',
  introWidth: 'medium',
};
