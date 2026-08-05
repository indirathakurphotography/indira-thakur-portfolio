import EditorialFilms from '@/components/sections/EditorialFilms';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Films & Cinematography | Indira Thakur Photography',
  description: 'Explore fine art films and short documentaries by Indira Thakur Photography.',
};

export default function FilmsPage() {
  return (
    <main className="pt-20">
      <EditorialFilms />
    </main>
  );
}
