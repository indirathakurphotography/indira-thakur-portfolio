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

export interface IAboutSection {
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
  achievements: {
    title: string;
    description: string;
    year?: string;
  }[];
  stats: {
    label: string;
    value: string;
  }[];
  values: {
    title: string;
    description: string;
  }[];
  ctaText: string;
  ctaLink: string;
  images: {
    founderPortrait: ISiteImage;
    journeyImage: ISiteImage;
    storyImage: ISiteImage;
    achievementImage: ISiteImage;
    behindTheScenes: ISiteImage;
    welcomeImage: ISiteImage;
    editorial1: ISiteImage;
    editorial2: ISiteImage;
  };
}

export interface IServicePreview {
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  image: ISiteImage;
}

export interface IServicesSection {
  eyebrow: string;
  heading: string;
  services: IServicePreview[];
  bannerImage: ISiteImage;
}

export interface IGalleryPreviewSection {
  eyebrow: string;
  heading: string;
  featuredImages: ISiteImage[];
  ctaText: string;
  ctaLink: string;
}

export interface ITestimonialsSection {
  eyebrow: string;
  heading: string;
  testimonials: {
    quote: string;
    author: string;
    role?: string;
    rating?: number;
    avatar: ISiteImage;
  }[];
  backgroundImage: ISiteImage;
}

export interface IFAQSection {
  eyebrow: string;
  heading: string;
  faqs: {
    question: string;
    answer: string;
  }[];
}

export interface IContactSection {
  eyebrow: string;
  heading: string;
  description: string;
  email: string;
  phone: string;
  location: string;
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
  about: IAboutSection;
  services: IServicesSection;
  galleryPreview: IGalleryPreviewSection;
  testimonials: ITestimonialsSection;
  faq: IFAQSection;
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
    about: {
      type: {
        eyebrow: { type: String, default: 'The Story' },
        heading: { type: String, default: 'A Once-in-a-Lifetime Experience' },
        subheading: { type: String, default: '' },
        story: {
          type: String,
          default: 'Hello! I am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2013, I transformed that passion into photography, and what started as a creative journey soon became my life\'s purpose.',
        },
        storyContinued: {
          type: String,
          default: 'Photography, for me, is much more than taking pictures. It is about preserving emotions, celebrating families, documenting milestones, and creating timeless memories that people will treasure for generations.',
        },
        philosophy: {
          type: String,
          default: 'I believe every family is unique, and every session deserves patience, warmth, creativity, and genuine care. My goal is not just to deliver photographs but to create memories that families will revisit with love for decades.',
        },
        philosophyContinued: {
          type: String,
          default: '',
        },
        journey: {
          type: String,
          default: 'One of the proudest milestones in my journey was creating a film for Dadasaheb Phalke Chitranagri (Filmcity), Goregaon. The film premiered at the Chitrapataka Film Festival. Since my very first project, I have earned the trust of countless families by providing a personalized and comfortable experience during every shoot.',
        },
        journeyContinued: {
          type: String,
          default: '',
        },
        welcomeMessage: {
          type: String,
          default: 'I warmly invite you to become a part of the Indira Thakur Photography family. Let us create something beautiful together.',
        },
        signature: { type: String, default: 'Indira Thakur' },
        specializations: {
          type: [String],
          default: ['Maternity Photography', 'Birth Photography', 'Newborn Photography', 'Family Portraits', 'Child Photography'],
        },
        achievements: {
          type: [
            {
              title: { type: String, default: '' },
              description: { type: String, default: '' },
              year: { type: String, default: '' },
            },
          ],
          default: [],
        },
        stats: {
          type: [
            {
              label: { type: String, default: '' },
              value: { type: String, default: '' },
            },
          ],
          default: [],
        },
        values: {
          type: [
            {
              title: { type: String, default: '' },
              description: { type: String, default: '' },
            },
          ],
          default: [],
        },
        ctaText: { type: String, default: 'View Portfolio' },
        ctaLink: { type: String, default: '/gallery' },
        images: {
          type: {
            founderPortrait: { type: SiteImageSchema, default: () => ({}) },
            journeyImage: { type: SiteImageSchema, default: () => ({}) },
            storyImage: { type: SiteImageSchema, default: () => ({}) },
            achievementImage: { type: SiteImageSchema, default: () => ({}) },
            behindTheScenes: { type: SiteImageSchema, default: () => ({}) },
            welcomeImage: { type: SiteImageSchema, default: () => ({}) },
            editorial1: { type: SiteImageSchema, default: () => ({}) },
            editorial2: { type: SiteImageSchema, default: () => ({}) },
          },
          default: () => ({}),
        },
      },
      default: () => ({}),
    },
    services: {
      type: {
        eyebrow: { type: String, default: 'What I Offer' },
        heading: { type: String, default: 'Services' },
        services: {
          type: [
            {
              title: { type: String, default: '' },
              subtitle: { type: String, default: '' },
              description: { type: String, default: '' },
              gradient: { type: String, default: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]' },
              image: { type: SiteImageSchema, default: () => ({}) },
            },
          ],
          default: [],
        },
        bannerImage: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
    galleryPreview: {
      type: {
        eyebrow: { type: String, default: 'Portfolio' },
        heading: { type: String, default: 'Featured Work' },
        featuredImages: { type: [SiteImageSchema], default: [] },
        ctaText: { type: String, default: 'View Full Gallery' },
        ctaLink: { type: String, default: '/gallery' },
      },
      default: () => ({}),
    },
    testimonials: {
      type: {
        eyebrow: { type: String, default: 'Kind Words' },
        heading: { type: String, default: 'What Families Say' },
        testimonials: {
          type: [
            {
              quote: { type: String, default: '' },
              author: { type: String, default: '' },
              role: { type: String, default: '' },
              rating: { type: Number, default: 5 },
              avatar: { type: SiteImageSchema, default: () => ({}) },
            },
          ],
          default: [],
        },
        backgroundImage: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
    faq: {
      type: {
        eyebrow: { type: String, default: 'Questions' },
        heading: { type: String, default: 'Commonly Asked' },
        faqs: {
          type: [
            {
              question: { type: String, default: '' },
              answer: { type: String, default: '' },
            },
          ],
          default: [],
        },
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
          default: "Capturing life's most precious moments with warmth, artistry, and an unwavering attention to detail.",
        },
        email: { type: String, default: 'photography@indirathakur.com' },
        phone: { type: String, default: '+91 9819620484' },
        instagramUrl: { type: String, default: 'https://instagram.com' },
        facebookUrl: { type: String, default: '' },
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
          default: ['photographer', 'newborn', 'maternity', 'portrait', 'bangalore'],
        },
        ogImage: { type: SiteImageSchema, default: () => ({}) },
      },
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
