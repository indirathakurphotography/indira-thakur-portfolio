'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilmItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  duration?: string;
}
export default function EditorialFilms() {
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [activeFilm, setActiveFilm] = useState<FilmItem | null>(null);

  useEffect(() => {
    async function loadFilms() {
      try {
        const res = await fetch('/api/films');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: FilmItem[] = data.map((f: any, idx: number) => ({
              id: f._id || f.id || `film-${idx}`,
              title: f.title || 'Cinematic Film',
              description: f.description || '',
              videoUrl: f.videoUrl,
              thumbnailUrl: f.thumbnailUrl || '',
              category: f.category || 'Films',
              duration: f.duration || '2:30',
            }));
            setFilms(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load films:', err);
      }
    }
    loadFilms();
  }, []);

  const formatEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <section className="py-24 md:py-36 bg-[#151211] text-white relative border-t border-white/5">
      <div className="container-editorial">
        {/* Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
              CINEMATOGRAPHY & MOTION
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white leading-tight">
              Films & Short Stories
            </h2>
            <div className="w-12 h-px bg-[#C39E96]/40 my-6" />
            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
              Preserving living emotion, gentle soundscapes, and timeless movement. From cultural documentaries to intimate family highlights.
            </p>
          </motion.div>
        </div>

        {films.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-3xl opacity-60">◆</span>
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Films Coming Soon</h3>
            <p className="font-sans text-sm text-white/50 max-w-md mx-auto leading-relaxed">
              Cinematic films and short stories are in production. They will be showcased here upon completion.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {films.map((film) => (
            <div
              key={film.id}
              onClick={() => setActiveFilm(film)}
              className="group cursor-pointer bg-[#221E1C] border border-white/10 rounded-sm overflow-hidden shadow-xl hover:border-[#C39E96]/50 transition-all duration-500"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={film.thumbnailUrl}
                  alt={film.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151211] via-black/20 to-transparent" />
                
                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white flex items-center justify-center pl-1 group-hover:bg-[#C39E96] group-hover:text-[#151211] group-hover:scale-110 transition-all duration-300">
                    ▶
                  </div>
                </div>

                {film.duration && (
                  <span className="absolute bottom-3 right-3 font-mono text-[10px] text-white/90 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                    {film.duration}
                  </span>
                )}
              </div>

              {/* Meta Content */}
              <div className="p-6">
                <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-[0.25em] block mb-2">
                  {film.category}
                </span>
                <h3 className="font-serif text-xl text-white font-medium group-hover:text-[#C39E96] transition-colors">
                  {film.title}
                </h3>
                {film.description && (
                  <p className="font-sans text-xs text-white/50 mt-3 leading-relaxed line-clamp-2">
                    {film.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Video Player Modal */}
        <AnimatePresence>
          {activeFilm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
              onClick={() => setActiveFilm(null)}
            >
              <button
                onClick={() => setActiveFilm(null)}
                className="absolute top-6 right-6 text-white/80 hover:text-white font-mono text-xs uppercase tracking-[0.2em] p-3 cursor-pointer z-50 bg-white/10 rounded-full"
                aria-label="Close Player"
              >
                ✕ Close
              </button>

              <div
                className="relative max-w-5xl w-full bg-[#1A1615] border border-white/10 rounded-sm overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative aspect-video w-full bg-black">
                  {typeof activeFilm.videoUrl === 'string' && (activeFilm.videoUrl.endsWith('.mp4') || activeFilm.videoUrl.includes('.mp4?')) ? (
                    <video
                      src={activeFilm.videoUrl}
                      controls
                      autoPlay
                      poster={activeFilm.thumbnailUrl}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={formatEmbedUrl(typeof activeFilm.videoUrl === 'string' ? activeFilm.videoUrl : '')}
                      title={activeFilm.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  )}
                </div>

                <div className="p-6 md:p-8 text-white">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C39E96] block mb-2">
                    {activeFilm.category}
                  </span>
                  <h3 className="font-serif text-2xl text-white">{activeFilm.title}</h3>
                  {activeFilm.description && (
                    <p className="font-sans text-xs md:text-sm text-white/70 mt-3 leading-relaxed">
                      {activeFilm.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
