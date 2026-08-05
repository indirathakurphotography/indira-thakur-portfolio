import { Suspense } from 'react';
import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Explore the photography portfolio of Indira Thakur — newborn, maternity, portrait, and event photography. Based in Mumbai, India.',
  openGraph: {
    title: 'Gallery | Indira Thakur Photography',
    description: 'Explore the photography portfolio of Indira Thakur — newborn, maternity, portrait, and event photography.',
    url: 'https://indirathakurphotography.com/gallery',
  },
};

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
