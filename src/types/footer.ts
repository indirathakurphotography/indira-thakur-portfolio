import { TypographyConfig } from './typography';

export interface FooterConfigData {
  tagline: string;
  description: string;
  email: string;
  phone: string;
  location: string;
  copyright: string;
  bookButtonText: string;
  bookButtonLink: string;
  instagramUrl: string;
  whatsappUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  pinterestUrl: string;
  keywords: string[];
  brandTitleTypography?: TypographyConfig;
  taglineTypography?: TypographyConfig;
  descriptionTypography?: TypographyConfig;
  columnHeaderTypography?: TypographyConfig;
  navLinksTypography?: TypographyConfig;
  copyrightTypography?: TypographyConfig;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfigData = {
  tagline: 'FINE ART PHOTOGRAPHY',
  description:
    'Photography for me is all about preserving emotions, celebrating families, documenting milestones, and creating timeless memories that people will treasure for generations.',
  email: 'photography@indirathakur.com',
  phone: '+91 98196 20484',
  location: 'Tilak Nagar, Chembur, Mumbai, Maharashtra, India',
  copyright: `© ${new Date().getFullYear()} Indira Thakur Photography. All Rights Reserved.`,
  bookButtonText: 'Book a Session',
  bookButtonLink: '/contact',
  instagramUrl: 'https://www.instagram.com/indirathakurphotography/',
  whatsappUrl: '+919819620484',
  youtubeUrl: '',
  facebookUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  pinterestUrl: '',
  keywords: [
    'Newborn Photography Mumbai',
    'Fine Art Maternity Shoot Chembur',
    'Luxury Baby Portraits Mumbai',
    'High-End Family Photography India',
    'Cinematic Milestone Films',
  ],
  brandTitleTypography: {
    fontFamily: 'serif',
    fontSize: 'huge',
    fontWeight: '400',
    color: '#FAF6F3',
  },
  taglineTypography: {
    fontFamily: 'mono',
    fontSize: 'compact',
    fontWeight: '500',
    color: '#C39E96',
  },
  descriptionTypography: {
    fontFamily: 'sans',
    fontSize: 'normal',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  columnHeaderTypography: {
    fontFamily: 'mono',
    fontSize: 'compact',
    fontWeight: '500',
    color: '#C39E96',
  },
  navLinksTypography: {
    fontFamily: 'sans',
    fontSize: 'compact',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  copyrightTypography: {
    fontFamily: 'serif',
    fontSize: 'normal',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
};

