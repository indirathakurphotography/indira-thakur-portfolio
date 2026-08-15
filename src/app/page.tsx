import dynamic from 'next/dynamic';
import HeroEditorial from '@/components/sections/HeroEditorial';
import InstagramReels from '@/components/sections/InstagramReels';
import JsonLd from '@/components/seo/JsonLd';
import { getFaqJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import SEO from '@/models/SEO';
import { SITE_METADATA } from '@/lib/seoConfig';

const EditorialAbout = dynamic(() => import('@/components/sections/EditorialAbout'));
const EditorialServices = dynamic(() => import('@/components/sections/EditorialServices'));
const BrandsSection = dynamic(() => import('@/components/sections/BrandsSection'));
const EditorialFilms = dynamic(() => import('@/components/sections/EditorialFilms'));
const EditorialVideoTestimonials = dynamic(() => import('@/components/sections/EditorialVideoTestimonials'));
const EditorialTestimonials = dynamic(() => import('@/components/sections/EditorialTestimonials'));
const EditorialFAQ = dynamic(() => import('@/components/sections/EditorialFAQ'));
const EditorialContact = dynamic(() => import('@/components/sections/EditorialContact'));

import mongoose from 'mongoose';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = await connectToDatabase();
    if (db && mongoose.connection.readyState === 1) {
      const seo = await SEO.findOne().lean().catch(() => null) as any;
      if (seo) {
        const keywordArray = seo.keywords
          ? seo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : SITE_METADATA.targetedKeywords;

        return {
          title: seo.metaTitle || 'Indira Thakur Photography | Luxury Newborn, Maternity & Portrait Studio Mumbai',
          description: seo.metaDescription || 'Indira Thakur Photography is Mumbai\'s premier fine art studio for luxury maternity, newborn, birth, toddler, event storytelling, and film cinematography.',
          keywords: keywordArray,
          alternates: {
            canonical: seo.canonicalUrl || 'https://www.indirathakur.com',
          },
          openGraph: {
            title: seo.ogTitle || seo.metaTitle || 'Indira Thakur Photography | Luxury Newborn & Maternity Studio Mumbai',
            description: seo.ogDescription || seo.metaDescription || 'Specializing in newborn safety, fine art maternity, expressive portraiture, and cinematography in Mumbai, Maharashtra, India.',
            url: seo.canonicalUrl || 'https://www.indirathakur.com',
            type: 'website',
            images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
          },
          twitter: {
            card: (seo.twitterCard as any) || 'summary_large_image',
            title: seo.twitterTitle || seo.ogTitle || seo.metaTitle,
            description: seo.twitterDescription || seo.ogDescription || seo.metaDescription,
            images: seo.twitterImage ? [seo.twitterImage] : undefined,
          },
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching dynamic metadata:', err);
  }

  return {
    title: 'Indira Thakur Photography | Luxury Newborn, Maternity & Portrait Studio Mumbai',
    description: 'Indira Thakur Photography is Mumbai\'s premier fine art studio for luxury maternity, newborn, birth, toddler, event storytelling, and film cinematography.',
    keywords: SITE_METADATA.targetedKeywords,
    alternates: {
      canonical: 'https://www.indirathakur.com',
    },
    openGraph: {
      title: 'Indira Thakur Photography | Luxury Newborn & Maternity Studio Mumbai',
      description: 'Specializing in newborn safety, fine art maternity, expressive portraiture, and cinematography in Mumbai, Maharashtra, India.',
      url: 'https://www.indirathakur.com',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Indira Thakur Photography Studio Mumbai',
      description: 'Premier fine art photography and films by Indira Thakur in Mumbai.',
    },
  };
}

const homeFaqs = [
  {
    question: "Who is Indira Thakur and where is her photography studio located?",
    answer: "Indira Thakur is a fine art photographer and filmmaker with over 10 years of experience. Her Mumbai studio serves Bandra, South Mumbai, Thane, Navi Mumbai and nearby areas, with destination photography assignments available across India."
  },
  {
    question: "What photography services are offered by Indira Thakur Photography?",
    answer: "Indira Thakur Photography offers bespoke commissions in Maternity Photography, Newborn & Infant Photography, Birth Photography, Toddler & Milestone Sessions, Wedding & Event Storytelling, and Corporate & Personal Brand Portraiture."
  },
  {
    question: "How do I book a photography session or inquire about pricing?",
    answer: "You can submit an online booking inquiry at www.indirathakur.com/contact, contact directly via WhatsApp at +91 98196 20484, or email photography@indirathakur.com. Complimentary telephone consultations and price guides are provided upon request."
  },
  {
    question: "What newborn safety measures are practiced during sessions?",
    answer: "Indira Thakur is a certified master newborn safety specialist. All studio wraps, props, and surfaces are thoroughly sanitized, and sessions are conducted in a temperature-controlled, peaceful studio environment."
  }
];

export default function Home() {
  const faqSchema = getFaqJsonLd(homeFaqs);

  return (
    <>
      <JsonLd schema={faqSchema} />
      <HeroEditorial />
      <EditorialAbout />
      <EditorialServices />
      <BrandsSection />
      <InstagramReels category="home" home />
      <EditorialFilms />
      <EditorialVideoTestimonials />
      <EditorialTestimonials />
      <EditorialFAQ />
      <EditorialContact />
    </>
  );
}




