import { Suspense } from 'react';
import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getImageObjectJsonLd } from '@/lib/schema';
import { getGalleryImagesServer } from '@/lib/getGalleryImagesServer';

export const metadata: Metadata = {
  title: 'Fine Art Portfolio Gallery | Indira Thakur Photography Mumbai',
  description: 'Explore the luxury photography portfolio of Indira Thakur in Mumbai — newborn, maternity, birth, toddler, portrait, and event storytelling.',
  alternates: {
    canonical: 'https://indirathakurphotography.com/gallery',
  },
  openGraph: {
    title: 'Fine Art Portfolio Gallery | Indira Thakur Photography Mumbai',
    description: 'Explore the photography portfolio of Indira Thakur — newborn, maternity, portrait, and event photography.',
    url: 'https://indirathakurphotography.com/gallery',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fine Art Photography Gallery | Indira Thakur Mumbai',
    description: 'Explore newborn, maternity, and portrait photography portfolios.',
  },
};

const sampleGalleryImages = [
  { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg', title: 'Luxury Maternity Fine Art Portrait', caption: 'Fine art maternity portraiture in Mumbai by Indira Thakur' },
  { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg', title: 'Sleeping Infant Newborn Art', caption: 'Peaceful certified newborn portraiture in Mumbai studio' },
  { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg', title: 'Executive Personal Branding Portrait', caption: 'Editorial portraiture in Bandra West studio' },
];

function GalleryFallback() {
  return (
    <div className="bg-white min-h-screen pt-36 pb-28 text-center">
      <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto" />
    </div>
  );
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }> | { category?: string };
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const categoryParam = resolvedParams?.category || '';

  // Fetch full master dataset (all images) for fast, smooth client-side filtering and category tab switching
  const initialImages = await getGalleryImagesServer(null, 9);

  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Portfolio Gallery', url: '/gallery' },
  ]);

  const imageSchema = getImageObjectJsonLd(sampleGalleryImages);

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={imageSchema} />
      <Suspense fallback={<GalleryFallback />}>
        <GalleryClient initialImages={initialImages} initialCategory={categoryParam} />
      </Suspense>
    </>
  );
}
