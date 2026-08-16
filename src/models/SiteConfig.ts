import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface IHeroSection {
  tagline: string;
  heading: string;
  headingItalic: string;
  subtext: string;
  categories: string[];
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  backgroundGradient: string;
  images: {
    heroMain: ISiteImage;
    heroSecondary: ISiteImage;
    background: ISiteImage;
  };
  heroImages: (ISiteImage & { duration?: number; animation?: string })[];
  slideshowDuration: number;
  transitionDuration: number;
  kenBurnsEnabled: boolean;
  overlayIntensity: number;
}

export interface IContactSection {
  eyebrow: string;
  heading: string;
  description: string;
  email: string;
  phone: string;
  location: string;
  googleFormUrl?: string;
  socialLinks: {
    platform: string;
    url: string;
  }[];
  bannerImage: ISiteImage;
  studioImage: ISiteImage;
}

export interface IBookingSection {
  eyebrow: string;
  heading: string;
  description: string;
  bannerImage: ISiteImage;
  sectionImage: ISiteImage;
}

export interface IFooterSection {
  tagline: string;
  description: string;
  email: string;
  phone: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  backgroundFooter: ISiteImage;
  logo: ISiteImage;
}

export interface ISEOSection {
  title: string;
  description: string;
  keywords: string[];
  ogImage: ISiteImage;
}

export interface ISiteConfig extends Document {
  home: IHeroSection;
  contact: IContactSection;
  booking: IBookingSection;
  footer: IFooterSection;
  seo: ISEOSection;
  createdAt: Date;
  updatedAt: Date;
}

const SiteImageSchema = new Schema<ISiteImage>(
  {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    home: {
      type: {
        tagline: { type: String, default: '' },
        heading: { type: String, default: 'Every Frame' },
        headingItalic: { type: String, default: 'Tells a Story' },
        subtext: { type: String, default: 'Newborn\nMaternity\nPortrait\nEvents' },
        categories: { type: [String], default: ['Newborn', 'Maternity', 'Portrait', 'Events'] },
        ctaText: { type: String, default: 'Book Now' },
        ctaLink: { type: String, default: '/#contact' },
        secondaryCtaText: { type: String, default: 'Portfolio' },
        secondaryCtaLink: { type: String, default: '/gallery' },
        backgroundGradient: { type: String, default: 'from-[#1A1110] via-[#2C1810] to-rich-black' },
        images: {
          type: {
            heroMain: { type: SiteImageSchema, default: () => ({}) },
            heroSecondary: { type: SiteImageSchema, default: () => ({}) },
            background: { type: SiteImageSchema, default: () => ({}) },
          },
          default: () => ({}),
        },
        heroImages: {
          type: [{
            url: { type: String, default: '' },
            alt: { type: String, default: '' },
            duration: { type: Number, default: 8 },
            animation: { type: String, default: 'auto' },
          }],
          default: [],
        },
        slideshowDuration: { type: Number, default: 8 },
        transitionDuration: { type: Number, default: 2 },
        kenBurnsEnabled: { type: Boolean, default: true },
        overlayIntensity: { type: Number, default: 0.7 },
      },
      default: () => ({}),
    },
    contact: {
      type: {
        eyebrow: { type: String, default: "Let's Create" },
        heading: { type: String, default: 'Begin Your Story' },
        description: { type: String, default: 'Every beautiful photograph begins with a conversation.' },
        email: { type: String, default: 'photography@indirathakur.com' },
        phone: { type: String, default: '+91 9819620484' },
        location: { type: String, default: 'Mumbai, India' },
        googleFormUrl: { type: String, default: 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform' },
        socialLinks: {
          type: [
            {
              platform: { type: String, default: '' },
              url: { type: String, default: '' },
            },
          ],
          default: [],
        },
        bannerImage: { type: SiteImageSchema, default: () => ({}) },
        studioImage: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
    booking: {
      type: {
        eyebrow: { type: String, default: 'Book a Session' },
        heading: { type: String, default: 'Reserve Your Moment' },
        description: { type: String, default: '' },
        bannerImage: { type: SiteImageSchema, default: () => ({}) },
        sectionImage: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
    footer: {
      type: {
        tagline: { type: String, default: 'Photography' },
        description: {
          type: String,
          default: "Documenting life's most precious moments with warmth, artistry, and an unwavering attention to detail.",
        },
        email: { type: String, default: 'photography@indirathakur.com' },
        phone: { type: String, default: '+91 9819620484' },
        instagramUrl: { type: String, default: 'https://instagram.com' },
        facebookUrl: { type: String, default: '' },
        linkedinUrl: { type: String, default: '' },
        backgroundFooter: { type: SiteImageSchema, default: () => ({}) },
        logo: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
    seo: {
      type: {
        title: { type: String, default: 'Indira Thakur Photography | Capturing Life\'s Precious Moments' },
        description: {
          type: String,
          default: 'Professional photographer specializing in newborn, maternity, portrait, and event photography. Based in Mumbai, India.',
        },
        keywords: {
          type: [String],
          default: ['photographer', 'newborn', 'maternity', 'portrait', 'mumbai'],
        },
        ogImage: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
