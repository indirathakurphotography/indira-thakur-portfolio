'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HiXMark, HiArrowLeft, HiArrowRight } from 'react-icons/hi2';
import { cn } from '@/lib/imageUtils';
import { toSrcSet, toThumbUrl } from '@/lib/imageUrl';

interface GalleryImage {
  id?: string;
  _id?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  category: string;
  shoot?: string;
  title?: string;
  description?: string;
}

interface GalleryItem {
  id: string;
  src: string;
  thumbSrcSet: string;
  alt: string;
  width: number;
  height: number;
  category: string;
  shoot?: string;
  title?: string;
  caption?: string;
  aspectRatio: number;
}

function mapGalleryImages(images: GalleryImage[]): GalleryItem[] {
  return images
    .filter((img) => img?.src)
    .map((img) => ({
      id: img.id || img._id || `img-${img.src.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown'}`,
      src: img.src,
      thumbSrcSet: toSrcSet(img.src),
      alt: img.alt || '',
      width: img.width || 800,
      height: img.height || 1000,
      category: (img.category || '').toLowerCase(),
      shoot: img.shoot || '',
      title: img.title || img.alt || '',
      aspectRatio: (img.width || 800) / (img.height || 1000),
    }));
}

function formatCategory(raw?: string): string {
  if (!raw) return '';
  const map: Record<string, string> = {
    newborn: 'Newborn',
    maternity: 'Maternity',
    family: 'Family',
    'brand collaboration': 'Brand',
    portrait: 'Portrait',
    wedding: 'Weddings',
    events: 'Events',
    couple: 'Couples',
  };
  return map[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

function ShimmerPlaceholder({ aspectRatio }: { aspectRatio: string }) {
  return (
    <div
      className="bg-[#FAF6F3] overflow-hidden relative"
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

function GalleryImageCard({ img, index, onClick }: { img: GalleryItem; index: number; onClick: () => void }) {
  const loadedRef = useRef(false);
  const [, forceRender] = useState(0);

  const trigger = () => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      forceRender((n) => n + 1);
    }
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative overflow-hidden bg-[#FAF6F3] rounded-sm">
        <img
          src={toThumbUrl(img.src, 400)}
          srcSet={img.thumbSrcSet}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={img.alt || img.title || ''}
          loading="lazy"
          decoding="async"
          onLoad={trigger}
          className={cn(
            'w-full h-auto transition-all duration-700',
            loadedRef.current ? 'opacity-100' : 'opacity-0',
            'group-hover:scale-[1.04]'
          )}
          style={{ aspectRatio: `${img.width} / ${img.height}` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rich-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-6 h-px bg-white/60" />
            <span className="font-mono text-[10px] text-white/80 uppercase tracking-[0.2em]">
              {formatCategory(img.category)}
            </span>
          </div>
          {img.title && (
            <p className="font-serif text-sm text-white/90 mt-1.5 line-clamp-1 leading-snug">
              {img.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GalleryClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const [activeCategory, setActiveCategory] = useState(categoryParam.toLowerCase());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/gallery-images?page=1&limit=200');
        if (!res.ok) return;
        const json = await res.json();
        const data: GalleryImage[] = json.items || (Array.isArray(json) ? json : []);
        if (!cancelled) {
          setGalleryImages(mapGalleryImages(data));
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGallery();
    return () => { cancelled = true; };
  }, []);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    galleryImages.forEach((img) => { if (img.category) cats.add(img.category); });
    return Array.from(cats);
  }, [galleryImages]);

  const filtered = useMemo(
    () => activeCategory ? galleryImages.filter((img) => img.category === activeCategory) : galleryImages,
    [galleryImages, activeCategory]
  );

  const groupedShoots = useMemo(() => {
    const shootMap = new Map<string, { title: string; category: string; items: GalleryItem[] }>();

    filtered.forEach((img) => {
      const shootName = img.shoot || (img.title ? img.title.replace(/\s*—\s*.*/i, '').trim() : '') || `${formatCategory(img.category)} Shoot`;
      if (!shootMap.has(shootName)) {
        shootMap.set(shootName, {
          title: shootName,
          category: img.category,
          items: [],
        });
      }
      shootMap.get(shootName)!.items.push(img);
    });

    return Array.from(shootMap.values());
  }, [filtered]);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    setLightboxLoading(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
    setLightboxLoading(true);
  }, [filtered.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    setLightboxLoading(true);
  }, [filtered.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  const currentImage = filtered[currentIndex];

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }, [goNext, goPrev]);

  const skeletonCount = 9;
  const skeletonAspects = useMemo(() => {
    const ratios = ['3/4', '4/5', '3/4', '4/5', '3/4', '1/1', '4/5', '3/4', '4/5'];
    return Array.from({ length: skeletonCount }, (_, i) => ratios[i % ratios.length]);
  }, []);

  return (
    <>
      <div className="bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 pt-36 pb-28">
          {/* Header */}
          <div className="mb-14 md:mb-20 text-center">
            <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-4 font-medium">
              Portfolio
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#2B2625] leading-[1.1]">
              The Gallery
            </h1>
            <div className="w-10 h-px bg-[#C39E96]/30 mx-auto mt-5 mb-0" />
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div className="mb-14 md:mb-16 overflow-x-auto scrollbar-hide">
              <div className="flex items-center justify-center gap-8 md:gap-10 pb-2 min-w-max mx-auto">
                {[
                  { key: '', label: 'All' },
                  ...availableCategories.map((cat) => ({ key: cat, label: formatCategory(cat) || cat })),
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveCategory(item.key)}
                    className={cn(
                      'relative font-mono text-[11px] uppercase tracking-[0.25em] whitespace-nowrap transition-colors duration-300 py-2',
                      activeCategory === item.key
                        ? 'text-[#2B2625]'
                        : 'text-[#7C706D]/50 hover:text-[#2B2625]'
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        'absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-[#C39E96] transition-all duration-300',
                        activeCategory === item.key ? 'w-full' : 'w-0'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {skeletonAspects.map((aspect, i) => (
                <ShimmerPlaceholder key={i} aspectRatio={aspect} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="pt-20 pb-32 text-center">
              <div className="w-16 h-px bg-[#C39E96]/20 mx-auto mb-6" />
              <p className="font-serif text-xl text-[#7C706D]/60 italic">
                No images in this collection yet.
              </p>
              <p className="font-sans text-xs text-[#7C706D]/40 mt-3 uppercase tracking-[0.2em]">
                Select another category to explore
              </p>
            </div>
          ) : (
            <div className="space-y-16 md:space-y-24">
              {groupedShoots.map((shootGroup, groupIdx) => (
                <div key={shootGroup.title || groupIdx} className="space-y-6 md:space-y-8">
                  {/* Editorial Shoot Header */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E7DDD2] pb-4 gap-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-[0.3em]">
                          {formatCategory(shootGroup.category)}
                        </span>
                        <span className="w-4 h-px bg-[#C39E96]/40" />
                        <span className="font-mono text-[10px] text-[#7C706D]/60 uppercase tracking-[0.2em]">
                          {shootGroup.items.length} Photographs
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl md:text-3xl text-[#2B2625] mt-1">
                        {shootGroup.title}
                      </h2>
                    </div>
                    <span className="font-sans text-[11px] text-[#7C706D]/60 uppercase tracking-[0.2em]">
                      Shoot #{String(groupIdx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* 4-Image Grid for Shoot */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {shootGroup.items.map((img) => {
                      const globalIndex = filtered.findIndex((item) => item.id === img.id);
                      return (
                        <GalleryImageCard
                          key={img.id}
                          img={img}
                          index={globalIndex}
                          onClick={() => openLightbox(globalIndex >= 0 ? globalIndex : 0)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-[#1C1817] flex items-center justify-center select-none"
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            ref={lightboxRef}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 z-30 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors duration-300"
              aria-label="Close"
            >
              <HiXMark className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              onClick={goPrev}
              className="absolute left-3 md:left-6 z-30 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
              aria-label="Previous image"
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>

            {/* Next */}
            <button
              onClick={goNext}
              className="absolute right-3 md:right-6 z-30 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
              aria-label="Next image"
            >
              <HiArrowRight className="w-5 h-5" />
            </button>

            {/* Image area */}
            <div className="max-w-5xl w-full px-4 md:px-16 relative flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full flex flex-col items-center"
                >
                  {lightboxLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-7 h-7 border-[1.5px] border-white/15 border-t-white/60 rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={currentImage.src}
                    alt={currentImage.alt || currentImage.title || ''}
                    loading="eager"
                    onLoad={() => setLightboxLoading(false)}
                    className={cn(
                      'max-h-[78vh] max-w-full w-auto h-auto mx-auto object-contain transition-opacity duration-300',
                      lightboxLoading ? 'opacity-0' : 'opacity-100'
                    )}
                  />
                  {currentImage.title && (
                    <div className="mt-5 text-center max-w-lg">
                      <p className="font-serif text-sm text-white/60 leading-relaxed">
                        {currentImage.title}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-white/15" />
                <span className="font-mono text-[11px] text-white/35 tracking-[0.15em]">
                  {String(currentIndex + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}
                </span>
                <span className="w-8 h-px bg-white/15" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}