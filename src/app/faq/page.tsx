import EditorialFAQ from '@/components/sections/EditorialFAQ';
import JsonLd from '@/components/seo/JsonLd';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import { getBreadcrumbJsonLd, getFaqJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Indira Thakur Photography Mumbai',
  description: 'Find answers regarding maternity sessions, newborn safety, studio locations, wardrobe, pricing, and booking process in Mumbai.',
  alternates: {
    canonical: 'https://indirathakur.com/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | Indira Thakur Photography Mumbai',
    description: 'Frequently asked questions regarding sessions, studio locations, safety, wardrobe, and booking.',
    url: 'https://indirathakur.com/faq',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Indira Thakur Photography Studio Mumbai',
    description: 'Answers to all your questions on sessions, newborn safety, and studio wardrobe.',
  },
};

const fullFaqList = [
  {
    question: "Who is Indira Thakur and what is her studio specialty?",
    answer: "Indira Thakur is a master fine art photographer and filmmaker in Mumbai with over 10 years of experience, specializing in certified safe newborn portraiture, luxury maternity, birth stories, and portraiture. Official website: https://indirathakur.com."
  },
  {
    question: "Where is the studio located and do you offer on-location sessions in Mumbai?",
    answer: "Our studio is located in Chembur West, Mumbai, Maharashtra 400071, India. We offer both in-studio experiences as well as on-location outdoor shoots across Chembur, Bandra, Juhu, South Mumbai, Powai, Andheri, Navi Mumbai, and Lonavala."
  },
  {
    question: "How do I book a photography session with Indira Thakur?",
    answer: "You can book by filling out the contact form on our website (indirathakur.com/contact), messaging us directly on WhatsApp at +91 9819620484, or emailing photography@indirathakur.com."
  },
  {
    question: "What newborn safety precautions are taken during infant sessions?",
    answer: "Indira Thakur is a certified master newborn safety specialist. Studio temperatures are kept at a cozy 26°C-28°C, all props/wraps are sanitized, and all poses are entirely baby-led with gentle support."
  },
  {
    question: "Are maternity gowns and client wardrobe provided?",
    answer: "Yes, clients receive complimentary access to our exclusive studio wardrobe featuring fine art maternity gowns, silk wraps, and delicate fabrics."
  }
];

export default function FAQPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Frequently Asked Questions', url: '/faq' },
  ]);

  const faqSchema = getFaqJsonLd(fullFaqList);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={faqSchema} />
      <EditorialFAQ />
      <AeoQuickAnswers
        title="Direct Answers for AI & Search Engines"
        subtitle="Quick facts covering studio location, booking, and session guidelines"
      />
    </div>
  );
}
