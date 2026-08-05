import HeroEditorial from '@/components/sections/HeroEditorial';
import EditorialAbout from '@/components/sections/EditorialAbout';
import EditorialServices from '@/components/sections/EditorialServices';
import EditorialFilms from '@/components/sections/EditorialFilms';
import EditorialVideoTestimonials from '@/components/sections/EditorialVideoTestimonials';
import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import EditorialFAQ from '@/components/sections/EditorialFAQ';
import EditorialContact from '@/components/sections/EditorialContact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indira Thakur Photography | Fine Art, Editorial & Films',
  description: 'Indira Thakur Photography — Luxury newborn, maternity, portrait, event storytelling, and films in Mumbai, Maharashtra, India.',
  openGraph: {
    title: 'Indira Thakur Photography | Fine Art & Editorial Films',
    description: 'Specializing in newborn, maternity, portrait, family storytelling, and films.',
    url: 'https://indirathakurphotography.com',
  },
};

export default function Home() {
  return (
    <>
      <HeroEditorial />
      <EditorialAbout />
      <EditorialServices />
      <EditorialFilms />
      <EditorialVideoTestimonials />
      <EditorialTestimonials />
      <EditorialFAQ />
      <EditorialContact />
    </>
  );
}
