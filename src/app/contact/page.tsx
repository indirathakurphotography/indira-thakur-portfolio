import EditorialContact from '@/components/sections/EditorialContact';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getFaqJsonLd } from '@/lib/schema';
import EditorialFAQ from '@/components/sections/EditorialFAQ';
import { FAQ_CONTENT } from '@/lib/faqContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inquire & Contact | Indira Thakur Photography Studio Mumbai',
  description: 'Inquire about reserving your luxury photography session or film commission with Indira Thakur in Mumbai. Phone/WhatsApp: +91 98196 20484.',
  alternates: {
    canonical: 'https://www.indirathakur.com/contact',
  },
  openGraph: {
    title: 'Inquire & Contact | Indira Thakur Photography Studio Mumbai',
    description: 'Reserve your fine art photography session or film with Indira Thakur in Mumbai.',
    url: 'https://www.indirathakur.com/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Indira Thakur Photography Studio Mumbai',
    description: 'Book online or message directly on WhatsApp (+91 98196 20484).',
  },
};

export default function ContactPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Inquire & Contact', url: '/contact' },
  ]);

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Inquire & Contact | Indira Thakur Photography',
    url: 'https://www.indirathakur.com/contact',
    mainEntity: {
      '@type': 'LocalBusiness',
      name: 'Indira Thakur Photography',
      telephone: '+91 98196 20484',
      email: 'photography@indirathakur.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Mumbai',
        addressRegion: 'Maharashtra',
        addressCountry: 'IN',
      },
    },
  };

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={contactSchema} />
      <JsonLd schema={getFaqJsonLd(FAQ_CONTENT.contact)} />
      <EditorialFAQ scope="contact" />
      <EditorialContact />
    </div>
  );
}
