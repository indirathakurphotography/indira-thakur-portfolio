import dynamic from 'next/dynamic';
import HeroEditorial from '@/components/sections/HeroEditorial';
import HashScrollHandler from '@/components/navigation/HashScrollHandler';
import JsonLd from '@/components/seo/JsonLd';
import { getFaqJsonLd } from '@/lib/schema';
import { FAQ_CONTENT } from '@/lib/faqContent';
import type { Metadata } from 'next';
import { SITE_METADATA } from '@/lib/seoConfig';
import { buildDynamicPageMetadata } from '@/lib/seoMetadata';

const EditorialAbout = dynamic(() => import('@/components/sections/EditorialAbout'));
const EditorialServices = dynamic(() => import('@/components/sections/EditorialServices'));
const BrandsSection = dynamic(() => import('@/components/sections/BrandsSection'));
const EditorialFilms = dynamic(() => import('@/components/sections/EditorialFilms'));
const EditorialVideoTestimonials = dynamic(() => import('@/components/sections/EditorialVideoTestimonials'));
const EditorialTestimonials = dynamic(() => import('@/components/sections/EditorialTestimonials'));
const EditorialFAQ = dynamic(() => import('@/components/sections/EditorialFAQ'));
const EditorialContact = dynamic(() => import('@/components/sections/EditorialContact'));

export async function generateMetadata(): Promise<Metadata> {
  return buildDynamicPageMetadata({
    title: 'Indira Thakur Photography | Luxury Newborn, Maternity & Portrait Studio Mumbai',
    description:
      "Indira Thakur Photography is Mumbai's premier fine art studio for luxury maternity, newborn, birth, toddler, event storytelling, and film cinematography.",
    keywords: SITE_METADATA.targetedKeywords,
    canonicalPath: '/',
    ogTitle: 'Indira Thakur Photography | Luxury Newborn & Maternity Studio Mumbai',
    ogDescription:
      'Specializing in newborn safety, fine art maternity, expressive portraiture, and cinematography in Mumbai, Maharashtra, India.',
    twitterTitle: 'Indira Thakur Photography Studio Mumbai',
    twitterDescription: 'Premier fine art photography and films by Indira Thakur in Mumbai.',
    imageAlt: 'Indira Thakur Photography Studio Mumbai',
    useDbMetaOverrides: true,
  });
}

const homeFaqs = FAQ_CONTENT.home;

export default function Home() {
  const faqSchema = getFaqJsonLd(homeFaqs);

  return (
    <>
      <JsonLd schema={faqSchema} />
      <HashScrollHandler />
      <HeroEditorial />
      <EditorialAbout />
      <EditorialServices />
      <BrandsSection />
      <EditorialFilms />
      <EditorialVideoTestimonials />
      <EditorialTestimonials />
      <EditorialFAQ />
      <EditorialContact />
    </>
  );
}




