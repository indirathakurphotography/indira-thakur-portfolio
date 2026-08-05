import EditorialAbout from '@/components/sections/EditorialAbout';
import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Story | Indira Thakur Photography',
  description: 'Learn about Indira Thakur, fine art photographer specializing in newborn, maternity, and expressive portraiture in Bangalore.',
};

export default function AboutPage() {
  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <EditorialAbout />
      <EditorialTestimonials />
    </div>
  );
}
