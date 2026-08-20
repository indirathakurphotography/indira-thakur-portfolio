'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatVideoEmbedUrl, isDirectVideoUrl, getVideoThumbnail } from '@/lib/videoUrlHelper';
import { toThumbUrl } from '@/lib/imageUrl';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface FilmItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  duration?: string;
}

export default function EditorialFilms({ initialFilms = [], asH1 = false }: { initialFilms?: FilmItem[]; asH1?: boolean }) {
  const { config } = useSiteConfig();
  // Server-rendered data prevents the initial blank/Coming Soon flash.
  const [films, setFilms] = useState<FilmItem[]>(initialFilms);
  const [activeFilm, setActiveFilm] = useState<FilmItem | null>(null);
  const [isPlayingInline, setIsPlayingInline] = useState<boolean>(false);

  const filmsHeader = {
    eyebrow: config?.films?.eyebrow || 'CINEMATOGRAPHY & MOTION',
    heading: config?.films?.heading || 'Films & Short Stories',
    description: config?.films?.description || 'Preserving living emotion, gentle soundscapes, and timeless movement. From cultural documentaries to intimate family highlights.',
  };

  useEffect(() => {
    async function loadFilms() {
      try {
        const res = await fetch('/api/films');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: FilmItem[] = data.map((f: any, idx: number) => {
              return {
                id: f._id || f.id || `film-${idx}`,
                title: f.title || '',
                description: f.description || '',
                videoUrl: f.videoUrl || '',
                thumbnailUrl: f.thumbnailUrl || getVideoThumbnail(f.videoUrl || '', f.thumbnailUrl),
                category: f.category || '',
                duration: f.duration || '',
              };
            });
            setFilms(mapped);
            return;
          }
        }
        if (initialFilms.length === 0) setFilms([]);
      } catch (err) {
        console.error('Failed to load films:', err);
        if (initialFilms.length === 0) setFilms([]);
      }
    }
    loadFilms();
  }, [initialFilms]);

  const handleOpenFilm = (film: FilmItem) => {
    setActiveFilm(film);
    setIsPlayingInline(true);
  };

  const handleClosePlayer = () => {
    setActiveFilm(null);
    setIsPlayingInline(false);
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
              {filmsHeader.eyebrow}
            </span>
            {asH1 ? (
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white leading-tight">
                {filmsHeader.heading}
              </h1>
            ) : (
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white leading-tight">
                {filmsHeader.heading}
              </h2>
            )}
            <div className="w-12 h-px bg-[#C39E96]/40 my-6" />
            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
              {filmsHeader.description}
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
              onClick={() => handleOpenFilm(film)}
              className="group cursor-pointer bg-[#221E1C] border border-white/10 rounded-sm overflow-hidden shadow-xl hover:border-[#C39E96]/50 transition-all duration-500"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-black overflow-hidden">
                {film.thumbnailUrl ? (
                  <img
                    src={film.thumbnailUrl.startsWith('http://') || film.thumbnailUrl.startsWith('https://') ? film.thumbnailUrl : toThumbUrl(film.thumbnailUrl, 800, 75)}
                    alt={film.title}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== film.thumbnailUrl && film.thumbnailUrl) {
                        target.src = film.thumbnailUrl;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#C39E96]/40 bg-[#151211]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Cinematic Film</span>
                  </div>
                )}
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
              onClick={handleClosePlayer}
            >
              <button
                onClick={handleClosePlayer}
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
                  {!isPlayingInline ? (
                    <div
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => setIsPlayingInline(true)}
                    >
                      <img
                        src={activeFilm.thumbnailUrl}
                        alt={activeFilm.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center pl-1 group-hover:bg-[#C39E96] group-hover:text-[#151211] group-hover:scale-110 transition-all duration-300 shadow-2xl">
                          <span className="text-2xl">▶</span>
                        </div>
                      </div>
                    </div>
                  ) : isDirectVideoUrl(activeFilm.videoUrl) ? (
                    <video
                      src={activeFilm.videoUrl}
                      controls
                      autoPlay
                      poster={activeFilm.thumbnailUrl}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={formatVideoEmbedUrl(activeFilm.videoUrl)}
                      title={activeFilm.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
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
