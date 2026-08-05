import { Suspense } from 'react';
import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import StructuredData from '@/components/layout/StructuredData';
import { BreadcrumbNav } from '@/components/ui/BreadcrumbNav';
import { getMetadataForPage } from '@/lib/seoConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = getMetadataForPage('gallery');

function GalleryFallback() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin" />
    </div>
  );
}

export default function GalleryPage() {
  console.log('[GalleryPage] render');
  return (
    <Suspense fallback={<GalleryFallback />}>
      <GalleryClient />
    </Suspense>
  );
}
