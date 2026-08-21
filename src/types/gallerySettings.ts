import { normalizeCategory, formatCategory } from '@/lib/categoryUtils';
import type { TypographyConfig } from '@/types/typography';

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
export type GalleryImageGap = 'small' | 'medium' | 'large' | 'none';
export type GalleryBorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type GalleryThumbnailSize =
  | 'small'
  | 'compact'
  | 'normal'
  | 'large'
  | 'extra-large'
  | 'spacious'
  | 'custom';
export type GalleryFontFamily = 'serif' | 'sans' | 'cormorant' | 'playfair';
export type GalleryHeadingSize = 'compact' | 'normal' | 'large' | 'display';

export interface ICategoryIntro {
  eyebrow: string;
  heading: string;
  description: string;
}

export type CategoryIntroductionsMap = Record<string, ICategoryIntro>;

export interface IGallerySettings {
  eyebrow: string;
  heading: string;
  subtitle: string;
  categoryIntroductions?: CategoryIntroductionsMap;
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
  thumbnailSize?: GalleryThumbnailSize;
  customThumbnailSize?: number;
  fontFamily?: GalleryFontFamily;
  headingSize?: GalleryHeadingSize;
  eyebrowColor?: string;
  headingColor?: string;
  subtitleColor?: string;
  eyebrowTypography?: TypographyConfig;
  headingTypography?: TypographyConfig;
  subtitleTypography?: TypographyConfig;
  customTypographies?: Record<string, TypographyConfig>;
}

export const DEFAULT_CATEGORY_INTRODUCTIONS: Record<string, ICategoryIntro> = {
  all: {
    eyebrow: 'PORTFOLIO',
    heading: 'The Gallery',
    description:
      'Where vision becomes visual language and every detail carries meaning —\nimagery crafted to make a brand feel as memorable as it truly is.',
  },
  newborn: {
    eyebrow: 'NEWBORN',
    heading: 'Tiny Beginnings',
    description:
      'Tiny details, tender beginnings and the quiet wonder of new life —\nheld softly in photographs your family can grow up with.',
  },
  maternity: {
    eyebrow: 'MATERNITY',
    heading: 'The Art of Motherhood',
    description:
      'A season of anticipation, tenderness and becoming —\nbeautifully preserved before a new chapter begins.',
  },
  portrait: {
    eyebrow: 'PORTRAIT',
    heading: 'In Their Element',
    description:
      'More than a likeness, a glimpse of your presence and story —\nportraits created with ease, honesty and quiet confidence.',
  },
  wedding: {
    eyebrow: 'WEDDINGS',
    heading: 'Forever, Framed',
    description:
      'A celebration of two lives, every glance and joyful in-between —\ndocumented with feeling, to be experienced again for years to come.',
  },
  weddings: {
    eyebrow: 'WEDDINGS',
    heading: 'Forever, Framed',
    description:
      'A celebration of two lives, every glance and joyful in-between —\ndocumented with feeling, to be experienced again for years to come.',
  },
  events: {
    eyebrow: 'EVENTS',
    heading: 'Moments in Motion',
    description:
      'The energy, laughter and unscripted moments that shape a gathering —\npreserved with the atmosphere and warmth of the day intact.',
  },
  event: {
    eyebrow: 'EVENTS',
    heading: 'Moments in Motion',
    description:
      'The energy, laughter and unscripted moments that shape a gathering —\npreserved with the atmosphere and warmth of the day intact.',
  },
  brand: {
    eyebrow: 'BRAND',
    heading: 'Visual Identity',
    description:
      'Where vision becomes visual language and every detail carries meaning —\nimagery crafted to make a brand feel as memorable as it truly is.',
  },
  family: {
    eyebrow: 'FAMILY',
    heading: 'Tender Bonds',
    description:
      'Honest connections and shared warmth — photographs that capture your family in your truest rhythm.',
  },
  couples: {
    eyebrow: 'COUPLES',
    heading: 'Two of a Kind',
    description:
      'Quiet intimacy, unforced laughter, and genuine connection preserved in timeless frames.',
  },
  couple: {
    eyebrow: 'COUPLES',
    heading: 'Two of a Kind',
    description:
      'Quiet intimacy, unforced laughter, and genuine connection preserved in timeless frames.',
  },
};

export const DEFAULT_GALLERY_SETTINGS: IGallerySettings = {
  eyebrow: 'PORTFOLIO',
  heading: 'The Gallery',
  subtitle:
    'Where vision becomes visual language and every detail carries meaning —\nimagery crafted to make a brand feel as memorable as it truly is.',
  categoryIntroductions: {
    all: { ...DEFAULT_CATEGORY_INTRODUCTIONS.all },
    newborn: { ...DEFAULT_CATEGORY_INTRODUCTIONS.newborn },
    maternity: { ...DEFAULT_CATEGORY_INTRODUCTIONS.maternity },
    portrait: { ...DEFAULT_CATEGORY_INTRODUCTIONS.portrait },
    weddings: { ...DEFAULT_CATEGORY_INTRODUCTIONS.weddings },
    events: { ...DEFAULT_CATEGORY_INTRODUCTIONS.events },
    brand: { ...DEFAULT_CATEGORY_INTRODUCTIONS.brand },
  },
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
  thumbnailSize: 'normal',
  fontFamily: 'serif',
  headingSize: 'normal',
  eyebrowColor: '#C39E96',
  headingColor: '#2B2625',
  subtitleColor: '#6D625F',
};

export function resolveCategoryIntro(
  category?: string | null,
  settings?: IGallerySettings | null
): ICategoryIntro {
  const norm = normalizeCategory(category);
  const key = !norm || norm === 'all' ? 'all' : norm;

  const intros = settings?.categoryIntroductions;
  let custom: ICategoryIntro | undefined = intros?.[key];

  if (!custom) {
    if (key === 'wedding' && intros?.['weddings']) custom = intros['weddings'];
    else if (key === 'weddings' && intros?.['wedding']) custom = intros['wedding'];
    else if (key === 'events' && intros?.['event']) custom = intros['event'];
    else if (key === 'event' && intros?.['events']) custom = intros['events'];
  }

  const customEyebrow = custom?.eyebrow?.trim();
  const customHeading = custom?.heading?.trim();
  const customDesc = custom?.description?.trim();

  // For 'all' category:
  if (key === 'all') {
    return {
      eyebrow: settings?.eyebrow?.trim() || customEyebrow || DEFAULT_GALLERY_SETTINGS.eyebrow,
      heading: settings?.heading?.trim() || customHeading || DEFAULT_GALLERY_SETTINGS.heading,
      description: settings?.subtitle?.trim() || customDesc || DEFAULT_GALLERY_SETTINGS.subtitle,
    };
  }

  // Category specific defaults
  const defaultEntry = DEFAULT_CATEGORY_INTRODUCTIONS[key] || {
    eyebrow: (category ? formatCategory(category) : key).toUpperCase(),
    heading: `${category ? formatCategory(category) : key} Portfolio`,
    description: 'Capturing timeless moments and authentic stories with elegance and care.',
  };

  return {
    eyebrow: customEyebrow || defaultEntry.eyebrow || settings?.eyebrow?.trim() || 'PORTFOLIO',
    heading: customHeading || defaultEntry.heading || settings?.heading?.trim() || 'The Gallery',
    description:
      customDesc ||
      defaultEntry.description ||
      settings?.subtitle?.trim() ||
      DEFAULT_GALLERY_SETTINGS.subtitle,
  };
}
