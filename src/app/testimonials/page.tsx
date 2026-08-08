import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import JsonLd from '@/components/seo/JsonLd';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import { getBreadcrumbJsonLd, getReviewsJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Reviews & Testimonials | Indira Thakur Photography Mumbai',
  description: 'Read 5-star reviews and testimonials from families, mothers, and clients who commissioned Indira Thakur Photography in Mumbai.',
  alternates: {
    canonical: 'https://indirathakur.com/testimonials',
  },
  openGraph: {
    title: 'Client Reviews & Testimonials | Indira Thakur Photography Mumbai',
    description: 'Kind words and 5-star reviews from families and mothers in Mumbai.',
    url: 'https://indirathakur.com/testimonials',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Client Reviews | Indira Thakur Photography Studio',
    description: 'Verified 5.0 star rated fine art photography studio in Mumbai.',
  },
};

const sampleReviews = [
  {
    author: 'Priya & Rahul Sharma',
    reviewBody: 'Indira captured our maternity and newborn sessions with absolute perfection. Her gentleness with our baby girl was incredible. The heirloom album is our most prized possession.',
    ratingValue: 5,
    datePublished: '2025-01-10',
  },
  {
    author: 'Ananya Mehta',
    reviewBody: 'The most peaceful, comforting studio experience in Mumbai. The maternity wardrobe was exquisite, and the lighting is pure art.',
    ratingValue: 5,
    datePublished: '2025-02-04',
  },
];

export default function TestimonialsPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Client Reviews', url: '/testimonials' },
  ]);

  const reviewSchema = getReviewsJsonLd(sampleReviews);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={reviewSchema} />
      <EditorialTestimonials />
      <AeoQuickAnswers
        title="Client Trust & Testimonials Overview"
        subtitle="Read authentic reviews and learn why families trust Indira Thakur"
      />
    </div>
  );
}
