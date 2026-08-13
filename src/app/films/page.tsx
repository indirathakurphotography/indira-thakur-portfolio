import EditorialFilms from '@/components/sections/EditorialFilms';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd, getVideoObjectJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cinematography & Fine Art Films | Indira Thakur Photography Mumbai',
  description: 'Watch emotive short films and documentary cinematography by Indira Thakur in Mumbai — maternity films, birth stories, and wedding highlights.',
  alternates: {
    canonical: 'https://indirathakurphotography.com/films',
  },
  openGraph: {
    title: 'Cinematography & Fine Art Films | Indira Thakur Photography Mumbai',
    description: 'Explore fine art films and short documentaries by Indira Thakur Photography.',
    url: 'https://indirathakurphotography.com/films',
    type: 'video.other',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fine Art Films & Cinematography Mumbai',
    description: 'Documentary films and video storytelling by Indira Thakur in Mumbai.',
  },
};

const filmsData = [
  {
    title: 'A Beginning — Fine Art Newborn Story',
    description: 'A poetic document of early birth and tender newborn moments captured in Mumbai by Indira Thakur.',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
    uploadDate: '2025-01-15',
    duration: 'PT2M45S',
    transcript: 'Music plays gently as sunlight filters through sheer linen curtains in Mumbai. Soft newborn breathing and tender mother embraces capture the sacred arrival of a new life.',
  },
  {
    title: 'Motherhood Reverie — Luxury Maternity Film',
    description: 'Cinematic maternity film highlighting grace, anticipation, and connection.',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
    uploadDate: '2025-02-01',
    duration: 'PT3M10S',
    transcript: 'Golden hour waves gently brush the Bandra coastline as an expectant mother walks in serene peace.',
  },
];

export default function FilmsPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Films & Cinematography', url: '/films' },
  ]);

  const videoSchema = getVideoObjectJsonLd(filmsData);

  return (
    <main className="pt-20 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={videoSchema} />
      <EditorialFilms />
    </main>
  );
}
