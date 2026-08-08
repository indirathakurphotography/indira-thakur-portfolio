import EditorialServices from '@/components/sections/EditorialServices';
import EditorialFAQ from '@/components/sections/EditorialFAQ';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photography Services & Packages | Indira Thakur Photography Mumbai',
  description: 'Explore fine art photography services in Mumbai: Maternity, Newborn, Birth, Toddler, Event Storytelling, and Corporate Portraiture.',
  alternates: {
    canonical: 'https://indirathakur.com/services',
  },
  openGraph: {
    title: 'Photography Services & Packages | Indira Thakur Photography Mumbai',
    description: 'Curated luxury photography experiences for newborn, maternity, fine art portraits, and editorial events in Mumbai.',
    url: 'https://indirathakur.com/services',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fine Art Photography Services Mumbai',
    description: 'Luxury maternity, newborn, portrait, and event photography in Mumbai.',
  },
};

export default function ServicesPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Services & Commissions', url: '/services' },
  ]);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <EditorialServices />
      <EditorialFAQ />
      <AeoQuickAnswers
        title="Services & Packages — Direct Overview"
        subtitle="Detailed information on session offerings, wardrobe, and deliverables"
      />
    </div>
  );
}
