import EditorialServices from '@/components/sections/EditorialServices';
import EditorialFAQ from '@/components/sections/EditorialFAQ';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getFaqJsonLd } from '@/lib/schema';
import { FAQ_CONTENT } from '@/lib/faqContent';
import type { Metadata } from 'next';
import { buildDynamicPageMetadata } from '@/lib/seoMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildDynamicPageMetadata({
    title: 'Photography Services & Packages | Indira Thakur Photography Mumbai',
    description:
      'Explore fine art photography services in Mumbai: Maternity, Newborn, Birth, Toddler, Event Storytelling, and Corporate Portraiture.',
    canonicalPath: '/services',
    ogTitle: 'Photography Services & Packages | Indira Thakur Photography Mumbai',
    ogDescription:
      'Curated luxury photography experiences for newborn, maternity, fine art portraits, and editorial events in Mumbai.',
    twitterTitle: 'Fine Art Photography Services Mumbai',
    twitterDescription: 'Luxury maternity, newborn, portrait, and event photography in Mumbai.',
  });
}

export default function ServicesPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Services & Commissions', url: '/services' },
  ]);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={getFaqJsonLd(FAQ_CONTENT.services)} />
      <EditorialServices />
      <EditorialFAQ scope="services" />
    </div>
  );
}
