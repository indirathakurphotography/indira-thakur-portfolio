import type { TypographyConfig } from './typography';

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
};
