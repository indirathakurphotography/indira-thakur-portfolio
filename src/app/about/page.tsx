import EditorialAbout from '@/components/sections/EditorialAbout';
import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import StructuredData from '@/components/layout/StructuredData';
import { BreadcrumbNav } from '@/components/ui/BreadcrumbNav';
import { getMetadataForPage } from '@/lib/seoConfig';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = getMetadataForPage('about');

export default function AboutPage() {
  return (
    <div className="pt-28 md:pt-32 bg-[#FAF6F3]">
      <StructuredData pageType="about" />
      <EditorialAbout />
      <EditorialTestimonials />
    </div>
  );
}
