import EditorialAbout from '@/components/sections/EditorialAbout';
import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getFaqJsonLd } from '@/lib/schema';
import EditorialFAQ from '@/components/sections/EditorialFAQ';
import { FAQ_CONTENT } from '@/lib/faqContent';
import type { Metadata } from 'next';
import { buildDynamicPageMetadata } from '@/lib/seoMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildDynamicPageMetadata({
    title: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
    description:
      'Learn about Indira Thakur — premier fine art photographer and filmmaker in Mumbai with over 10 years of experience in newborn, maternity, portrait, and event storytelling.',
    canonicalPath: '/about',
    ogTitle: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
    ogDescription:
      'Learn about Indira Thakur, fine art photographer specializing in newborn, maternity, and expressive portraiture in Mumbai, Maharashtra, India.',
    ogType: 'profile',
    twitterTitle: 'About Indira Thakur | Photographer in Mumbai',
    twitterDescription: '10+ years capturing 1,000+ luxury family stories in Mumbai, India.',
    imageAlt: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
  });
}

export default function AboutPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'About Indira Thakur', url: '/about' },
  ]);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={getFaqJsonLd(FAQ_CONTENT.about)} />
      <EditorialAbout isDedicatedPage={true} />
      <EditorialTestimonials />
      <EditorialFAQ scope="about" />
    </div>
  );
}
