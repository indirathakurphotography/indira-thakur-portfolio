export interface NavLink {
  label: string;
  href: string;
}

export interface Service {
  _id?: string;
  id: string;
  title: string;
  slug: string;
  description: string;
  heroImage: string;
  benefits: string[];
  gallery: string[];
  price: string;
  cta: string;
  featured: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryImage {
  _id?: string;
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  category: string;
  title?: string;
  description?: string;
  featured: boolean;
  order: number;
  createdAt?: string;
}

export interface Testimonial {
  _id?: string;
  id: string;
  name: string;
  role: string;
  image: string;
  content: string;
  rating: number;
  featured: boolean;
  order: number;
  createdAt?: string;
}

export interface Review {
  _id?: string;
  id: string;
  name: string;
  rating: number;
  content: string;
  source: 'google' | 'facebook' | 'website';
  date: string;
  featured: boolean;
}

export interface FAQ {
  _id?: string;
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface Booking {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
}

export interface ContactMessage {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt?: string;
}

export interface AboutData {
  _id?: string;
  heroImage: string;
  story: string;
  philosophy: string;
  journey: string;
  values: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  achievements: string[];
  image: string;
  signature?: string;
}

export interface Collaboration {
  _id?: string;
  id: string;
  name: string;
  logo: string;
  description: string;
  url?: string;
  featured: boolean;
  order: number;
}

export interface SEOSettings {
  _id?: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  twitterHandle?: string;
}

export interface HeroContent {
  _id?: string;
  heading: string;
  subheading: string;
  cta: string;
  ctaLink: string;
  image: string;
  overlayText?: string;
}

export interface SiteSettings {
  _id?: string;
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
  businessHours: string;
  googleMapsEmbed?: string;
}

export interface AdminUser {
  _id?: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'superadmin';
  createdAt?: string;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  count?: number;
}
