import EditorialServices from '@/components/sections/EditorialServices';
import EditorialFAQ from '@/components/sections/EditorialFAQ';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services & Experience | Indira Thakur Photography',
  description: 'Curated photography experiences for newborn, maternity, fine art portraits, and editorial events.',
};

export default function ServicesPage() {
  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <EditorialServices />
      <EditorialFAQ />
    </div>
  );
}
