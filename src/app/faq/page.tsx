import EditorialFAQ from '@/components/sections/EditorialFAQ';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getFaqJsonLd } from '@/lib/schema';
import { fetchAllFAQs } from '@/lib/faqsStorage';
import type { Metadata } from 'next';
import { buildDynamicPageMetadata } from '@/lib/seoMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildDynamicPageMetadata({
    title: 'Frequently Asked Questions (FAQ) | Indira Thakur Photography Mumbai',
    description:
      'Find answers regarding maternity sessions, newborn safety, studio locations, wardrobe, pricing, and booking process in Mumbai.',
    canonicalPath: '/faq',
    ogTitle: 'Frequently Asked Questions (FAQ) | Indira Thakur Photography Mumbai',
    ogDescription:
      'Frequently asked questions regarding sessions, studio locations, safety, wardrobe, and booking.',
    twitterTitle: 'FAQ | Indira Thakur Photography Studio Mumbai',
    twitterDescription:
      'Answers to all your questions on sessions, newborn safety, and studio wardrobe.',
  });
}

export default async function FAQPage() {
  // The public FAQ page renders the SAME MongoDB source of truth the admin
  // CMS writes to. No hardcoded FAQ list, no truncation.
  const faqs = await fetchAllFAQs().catch(() => []);

  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Frequently Asked Questions', url: '/faq' },
  ]);

  const faqSchema = getFaqJsonLd(
    faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }))
  );

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={faqSchema} />
      <EditorialFAQ initialFaqs={faqs} scope="all" showCategoryFilter={true} />
    </div>
  );
}