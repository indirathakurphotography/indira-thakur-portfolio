import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import EditorialVideoTestimonials from '@/components/sections/EditorialVideoTestimonials';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getReviewsJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';
import { buildDynamicPageMetadata } from '@/lib/seoMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildDynamicPageMetadata({
    title: 'Client Reviews & Testimonials | Indira Thakur Photography Mumbai',
    description:
      'Read reviews and testimonials from families, mothers, and clients who commissioned Indira Thakur Photography in Mumbai.',
    canonicalPath: '/testimonials',
    ogTitle: 'Client Reviews & Testimonials | Indira Thakur Photography Mumbai',
    ogDescription: 'Kind words and reviews from families and mothers in Mumbai.',
    twitterTitle: 'Client Reviews | Indira Thakur Photography Studio',
    twitterDescription: 'Fine art photography studio in Mumbai.',
  });
}

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
      <EditorialVideoTestimonials />
      <EditorialTestimonials />
    </div>
  );
}
