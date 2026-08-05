import EditorialFilms from '@/components/sections/EditorialFilms';
import StructuredData from '@/components/layout/StructuredData';
import { BreadcrumbNav } from '@/components/ui/BreadcrumbNav';
import { getMetadataForPage } from '@/lib/seoConfig';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = getMetadataForPage('films');

export default function FilmsPage() {
  return (
    <main className="pt-28 md:pt-32 bg-[#151211]">
      <StructuredData pageType="films" />
      <EditorialFilms />
    </main>
  );
}
