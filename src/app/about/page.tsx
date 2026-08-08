import EditorialAbout from '@/components/sections/EditorialAbout';
import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
  description: 'Learn about Indira Thakur — premier fine art photographer and filmmaker in Mumbai with over 10 years of experience in newborn, maternity, portrait, and event storytelling.',
  alternates: {
    canonical: 'https://indirathakur.com/about',
  },
  openGraph: {
    title: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
    description: 'Learn about Indira Thakur, fine art photographer specializing in newborn, maternity, and expressive portraiture in Mumbai, Maharashtra, India.',
    url: 'https://indirathakur.com/about',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Indira Thakur | Photographer in Mumbai',
    description: '10+ years capturing 1,000+ luxury family stories in Mumbai, India.',
  },
};

export default function AboutPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'About Indira Thakur', url: '/about' },
  ]);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <EditorialAbout />
      <EditorialTestimonials />
      <AeoQuickAnswers
        title="About Indira Thakur — Frequently Asked Questions"
        subtitle="Learn about the artist, studio philosophy, and experience"
      />
    </div>
  );
}
