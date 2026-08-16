'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HiXMark, HiArrowLeft, HiArrowRight } from 'react-icons/hi2';
import { MasonryPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/masonry.css';
import { cn } from '@/lib/imageUtils';
import { toSrcSet, toThumbUrl } from '@/lib/imageUrl';
import StructuredData from '@/components/layout/StructuredData';
import { BreadcrumbNav } from '@/components/ui/BreadcrumbNav';

import {
  getCachedGalleryItems,
  fetchGalleryImages,
  normalizeCategory,
  formatCategory,
  GalleryItem,
  GalleryImage,
} from '@/lib/galleryCache';

function GalleryImageCard({ img, index, onClick }: { img: GalleryItem; index: number; onClick: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group relative w-full h-auto overflow-hidden bg-[#FAF6F3] rounded-sm shadow-xs hover:shadow-md transition-all duration-500"
    >
      <img
        src={toThumbUrl(img.src, 600)}
        srcSet={img.thumbSrcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        alt={img.alt || img.title || ''}
        loading={index < 8 ? 'eager' : 'lazy'}
        fetchPriority={index < 4 ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          'w-full h-auto object-cover transition-all duration-700 block',
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.01]',
          'group-hover:scale-[1.03]'
        )}
        style={{ aspectRatio: `${img.width} / ${img.height}` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1817]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-5 h-px bg-white/70" />
          <span className="font-mono text-[10px] text-white/90 uppercase tracking-[0.2em]">
            {formatCategory(img.category)}
          </span>
        </div>
        {img.title && (
          <p className="font-serif text-sm text-white/95 mt-1.5 line-clamp-1 leading-snug">
            {img.title}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GalleryClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize from memory cache if available
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(() => getCachedGalleryItems() || []);
  const [loading, setLoading] = useState<boolean>(() => !getCachedGalleryItems());
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    let cancelled = false;

    if (!getCachedGalleryItems()) {
      setLoading(true);
    }

    fetchGalleryImages().then(({ items }) => {
      if (!cancelled && items && items.length > 0) {
        setGalleryImages(items);
      }
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    galleryImages.forEach((img) => {
      const norm = normalizeCategory(img.category);
      if (norm) cats.add(norm);
    });
    return Array.from(cats);
  }, [galleryImages]);

  const filtered = useMemo(() => {
    if (!activeCategory) return galleryImages;
    const targetNorm = normalizeCategory(activeCategory);
    return galleryImages.filter((img) => normalizeCategory(img.category) === targetNorm);
  }, [galleryImages, activeCategory]);

  const albumPhotos = useMemo(() => {
    return filtered.map((img) => ({
      key: img.id,
      src: img.src,
      width: img.width || 800,
      height: img.height || 1000,
      alt: img.alt || img.title || '',
      title: img.title || '',
      item: img,
    }));
  }, [filtered]);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    setLightboxLoading(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (filtered.length || 1));
    setLightboxLoading(true);
  }, [filtered.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
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

  return (
    <>
      <StructuredData pageType="gallery" />
      <div className="bg-white min-h-screen">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 lg:px-16 pt-32 pb-28">
          {/* Header */}
          <div className="mb-12 md:mb-16 text-center">
            <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
              Editorial Portfolio
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#2B2625] leading-[1.1]">
              The Gallery
            </h1>
            <div className="w-10 h-px bg-[#C39E96]/30 mx-auto mt-4 mb-0" />
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div className="mb-12 md:mb-14 overflow-x-auto scrollbar-hide">
              <div className="flex items-center justify-center gap-8 md:gap-10 pb-2 min-w-max mx-auto">
                {[
                  { key: '', label: 'All Works' },
                  ...availableCategories.map((cat) => ({ key: cat, label: formatCategory(cat) || cat })),
                ].map((item) => {
                  const isActive = !item.key ? !activeCategory : normalizeCategory(activeCategory) === normalizeCategory(item.key);
                  return (
                    <button
                      key={item.key || 'all'}
                      onClick={() => setActiveCategory(item.key)}
                      className={cn(
                        'relative font-mono text-[11px] uppercase tracking-[0.25em] whitespace-nowrap transition-colors duration-300 py-2 cursor-pointer',
                        isActive
                          ? 'text-[#2B2625] font-semibold'
                          : 'text-[#7C706D]/60 hover:text-[#2B2625]'
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          'absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-[#C39E96] transition-all duration-300',
                          isActive ? 'w-full' : 'w-0'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          {loading && filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-32 h-0.5 bg-[#E7DDD2] mx-auto overflow-hidden rounded-full">
                <div className="w-full h-full bg-[#C39E96] animate-pulse" />
              </div>
              <p className="font-mono text-[10px] text-[#C39E96] uppercase tracking-[0.25em] mt-4 font-medium">
                Loading Collection...
              </p>
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
            <MasonryPhotoAlbum
              photos={albumPhotos}
              columns={(containerWidth) => {
                if (containerWidth < 640) return 1;
                if (containerWidth < 1024) return 2;
                if (containerWidth < 1280) return 3;
                return 4;
              }}
              spacing={24}
              render={{
                photo: (_props, { photo, index }) => {
                  const img = photo.item;
                  return (
                    <GalleryImageCard
                      key={img.id || index}
                      img={img}
                      index={index}
                      onClick={() => openLightbox(index)}
                    />
                  );
                },
              }}
            />
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
              className="absolute top-5 right-5 z-30 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors duration-300 cursor-pointer"
              aria-label="Close"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            {/* Previous */}
            <button
              onClick={goPrev}
              className="absolute left-3 md:left-6 z-30 w-12 h-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 cursor-pointer"
              aria-label="Previous image"
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>

            {/* Next */}
            <button
              onClick={goNext}
              className="absolute right-3 md:right-6 z-30 w-12 h-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 cursor-pointer"
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
                      'max-h-[78vh] max-w-full w-auto h-auto mx-auto object-contain transition-opacity duration-300 rounded-xs shadow-2xl',
                      lightboxLoading ? 'opacity-0' : 'opacity-100'
                    )}
                  />
                  {currentImage.title && (
                    <div className="mt-5 text-center max-w-lg">
                      <p className="font-serif text-sm text-white/70 leading-relaxed">
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
                <span className="font-mono text-[11px] text-white/40 tracking-[0.15em]">
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
