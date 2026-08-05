import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Praise & Reviews | Indira Thakur Photography',
  description: 'Kind words and testimonials from families, mothers, and clients who have commissioned Indira Thakur Photography.',
};

export default function TestimonialsPage() {
  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <EditorialTestimonials />
    </div>
  );
}
