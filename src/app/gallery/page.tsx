import { Suspense } from 'react';
import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import JsonLd from '@/components/seo/JsonLd';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import { getBreadcrumbJsonLd, getImageObjectJsonLd } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Fine Art Portfolio Gallery | Indira Thakur Photography Mumbai',
  description: 'Explore the luxury photography portfolio of Indira Thakur in Mumbai — newborn, maternity, birth, toddler, portrait, and event storytelling.',
  alternates: {
    canonical: 'https://indirathakur.com/gallery',
  },
  openGraph: {
    title: 'Fine Art Portfolio Gallery | Indira Thakur Photography Mumbai',
    description: 'Explore the photography portfolio of Indira Thakur — newborn, maternity, portrait, and event photography.',
    url: 'https://indirathakur.com/gallery',
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
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin" />
    </div>
  );
}

export default function GalleryPage() {
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
        <GalleryClient />
      </Suspense>
      <AeoQuickAnswers
        title="Portfolio Categories & Photography Questions"
        subtitle="Learn about session styling, image retouching, and delivery formats"
      />
    </>
  );
}
