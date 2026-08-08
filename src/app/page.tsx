import dynamic from 'next/dynamic';
import HeroEditorial from '@/components/sections/HeroEditorial';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import JsonLd from '@/components/seo/JsonLd';
import { getFaqJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';

const EditorialAbout = dynamic(() => import('@/components/sections/EditorialAbout'));
const EditorialServices = dynamic(() => import('@/components/sections/EditorialServices'));
const EditorialFilms = dynamic(() => import('@/components/sections/EditorialFilms'));
const EditorialVideoTestimonials = dynamic(() => import('@/components/sections/EditorialVideoTestimonials'));
const EditorialTestimonials = dynamic(() => import('@/components/sections/EditorialTestimonials'));
const EditorialFAQ = dynamic(() => import('@/components/sections/EditorialFAQ'));
const EditorialContact = dynamic(() => import('@/components/sections/EditorialContact'));

export const metadata: Metadata = {
  title: 'Indira Thakur Photography | Luxury Newborn, Maternity & Portrait Studio Mumbai',
  description: 'Indira Thakur Photography is Mumbai\'s premier fine art studio for luxury maternity, newborn, birth, toddler, event storytelling, and film cinematography.',
  alternates: {
    canonical: 'https://indirathakur.com',
  },
  openGraph: {
    title: 'Indira Thakur Photography | Luxury Newborn & Maternity Studio Mumbai',
    description: 'Specializing in newborn safety, fine art maternity, expressive portraiture, and cinematography in Mumbai, Maharashtra, India.',
    url: 'https://indirathakur.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indira Thakur Photography Studio Mumbai',
    description: 'Premier fine art photography and films by Indira Thakur in Mumbai.',
  },
};

const homeFaqs = [
  {
    question: "Who is Indira Thakur and where is her photography studio located?",
    answer: "Indira Thakur is an award-winning luxury photographer and filmmaker with over 10 years of experience. Her studio is based in Chembur West, Mumbai, Maharashtra, India (official website: https://indirathakur.com), serving Chembur, Bandra, Juhu, South Mumbai, Powai, Andheri, and Navi Mumbai."
  },
  {
    question: "What photography services are offered by Indira Thakur Photography?",
    answer: "Indira Thakur Photography offers bespoke commissions in Maternity Photography, Newborn & Infant Photography, Birth Photography, Toddler & Milestone Sessions, Wedding & Event Storytelling, and Corporate & Personal Brand Portraiture."
  },
  {
    question: "How do I book a photography session or inquire about pricing?",
    answer: "You can submit an online booking inquiry at indirathakur.com/contact, contact directly via WhatsApp at +91 9819620484, or email photography@indirathakur.com. Complimentary telephone consultations and price guides are provided upon request."
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
      <EditorialFilms />
      <EditorialVideoTestimonials />
      <EditorialTestimonials />
      <EditorialFAQ />
      <AeoQuickAnswers />
      <EditorialContact />
    </>
  );
}
