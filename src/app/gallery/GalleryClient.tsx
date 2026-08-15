'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HiXMark, HiArrowLeft, HiArrowRight } from 'react-icons/hi2';
import { cn } from '@/lib/imageUtils';
import { toSrcSet, toThumbUrl } from '@/lib/imageUrl';
import { normalizeCategory, isCategoryMatch, formatCategory, sanitizeMetadataText } from '@/lib/categoryUtils';
import CategoryFAQs from '@/components/sections/CategoryFAQs';
import InstagramReels from '@/components/sections/InstagramReels';

export interface GalleryImage {
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

export interface GalleryItem {
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
      alt: sanitizeMetadataText(img.alt || img.title, 'Fine Art Photography'),
      width: img.width || 800,
      height: img.height || 1000,
      category: img.category || '',
      shoot: sanitizeMetadataText(img.shoot, ''),
      title: sanitizeMetadataText(img.title, ''),
      caption: sanitizeMetadataText(img.description, ''),
      aspectRatio: (img.width || 800) / (img.height || 1000),
    }));
}

function ShimmerPlaceholder({ aspectRatio }: { aspectRatio: string }) {
  return (
    <div
      className="bg-[#FAF6F3] overflow-hidden relative rounded-sm"
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

function GalleryImageCard({ img, index, onClick }: { img: GalleryItem; index: number; onClick: () => void }) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 640, 75);
  const isPriority = index < 8;
  const aspectRatio = `${img.width || 800} / ${img.height || 1000}`;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group break-inside-avoid mb-4 md:mb-6"
    >
      <div
        className="relative overflow-hidden bg-[#FAF6F3] rounded-sm w-full"
        style={{ aspectRatio }}
      >
        <img
          src={thumbUrl}
          srcSet={hasError ? undefined : img.thumbSrcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          alt={img.alt || img.title || 'Fine Art Photography'}
          loading={isPriority ? 'eager' : 'lazy'}
          fetchPriority={index < 4 ? 'high' : 'auto'}
          decoding="async"
          onError={() => {
            if (!hasError) setHasError(true);
          }}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] protected-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151211]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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

interface GalleryClientProps {
  initialImages?: GalleryItem[];
  initialCategory?: string;
}

const CANONICAL_CATEGORIES = ['Newborn', 'Maternity', 'Portrait', 'Weddings', 'Events', 'Brand'];

type CategoryIntro = { lineOne: string; lineTwo: string };

// Keys use the same normalized category values as filtering, so the copy stays
// correct for tab changes, direct category URLs and service-to-gallery links.
const CATEGORY_INTROS: Record<string, CategoryIntro> = {
  all: {
    lineOne: 'A collection of fleeting chapters, honest connection and considered detail —',
    lineTwo: 'photographs made to be returned to, long after the moment has passed.',
  },
  newborn: {
    lineOne: 'Tiny details, tender beginnings and the quiet wonder of new life —',
    lineTwo: 'held softly in photographs your family can grow up with.',
  },
  maternity: {
    lineOne: 'A season of anticipation, tenderness and becoming —',
    lineTwo: 'beautifully preserved before a new chapter begins.',
  },
  portrait: {
    lineOne: 'More than a likeness, a glimpse of your presence and story —',
    lineTwo: 'portraits created with ease, honesty and quiet confidence.',
  },
  wedding: {
    lineOne: 'A celebration of two lives, every glance and joyful in-between —',
    lineTwo: 'documented with feeling, to be experienced again for years to come.',
  },
  events: {
    lineOne: 'The energy, laughter and unscripted moments that shape a gathering —',
    lineTwo: 'preserved with the atmosphere and warmth of the day intact.',
  },
  brand: {
    lineOne: 'Where vision becomes visual language and every detail carries meaning —',
    lineTwo: 'imagery crafted to make a brand feel as memorable as it truly is.',
  },
};

function getCategoryIntro(category: string): CategoryIntro {
  const key = normalizeCategory(category);
  if (!key || key === 'all') return CATEGORY_INTROS.all;
  return CATEGORY_INTROS[key] || CATEGORY_INTROS.all;
}

function CategoryIntroduction({ category }: { category: string }) {
  const intro = getCategoryIntro(category);
  return (
    <motion.p
      key={normalizeCategory(category) || 'all'}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto -mt-3 md:-mt-4 mb-9 md:mb-11 text-center font-serif text-base md:text-lg leading-relaxed text-[#7C706D]"
    >
      <span className="block">{intro.lineOne}</span>
      <span className="block">{intro.lineTwo}</span>
    </motion.p>
  );
}

export default function GalleryClient({ initialImages, initialCategory }: GalleryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || initialCategory || '';
  const [activeCategory, setActiveCategory] = useState(categoryParam);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allMasterImages, setAllMasterImages] = useState<GalleryItem[]>(() => {
    if (initialImages && initialImages.length > 0) {
      return initialImages;
    }
    return [];
  });

  const isFallbackList = useCallback((items: GalleryItem[]) => {
    if (!items || items.length === 0) return true;
    return items.some((img) => String(img.id || '').startsWith('gal-'));
  }, []);

  // Track explicitly whether we have loaded the complete full master dataset
  const [hasFullMasterDataset, setHasFullMasterDataset] = useState<boolean>(() => {
    // A category-linked page has a complete scoped collection, not the master collection.
    if (initialCategory) return false;
    if (!initialImages || initialImages.length === 0) {
      return false;
    }
    // Gallery pages initially receive a small fast first batch. It is not a full
    // category cache, so category clicks must be able to request their own data.
    if (initialImages.length <= 9 || initialImages.some((img) => String(img.id || '').startsWith('gal-'))) {
      return false;
    }
    return true;
  });

  const [loading, setLoading] = useState(!initialImages || initialImages.length === 0);
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const fetchingRef = useRef(false);
  const categoryCacheRef = useRef<Record<string, GalleryItem[]>>({});
  const [categoryLoading, setCategoryLoading] = useState(false);

  const fetchMasterGallery = useCallback(async () => {
    if (fetchingRef.current) return;
    if (hasFullMasterDataset) return;

    fetchingRef.current = true;
    if (allMasterImages.length === 0) {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/gallery-images?limit=1000');
      if (res.ok) {
        const json = await res.json();
        const data: GalleryImage[] = json.items || (Array.isArray(json) ? json : []);
        const mapped = mapGalleryImages(data);
        if (mapped.length > 0 && !isFallbackList(mapped)) {
          setAllMasterImages(mapped);
          setHasFullMasterDataset(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch master gallery images:', err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [allMasterImages.length, hasFullMasterDataset, isFallbackList]);

  useEffect(() => {
    if (!hasFullMasterDataset) {
      fetchMasterGallery();
    }
  }, [hasFullMasterDataset, fetchMasterGallery]);

  // Sync activeCategory when URL searchParams changes
  useEffect(() => {
    const cat = searchParams.get('category') || initialCategory || '';
    setActiveCategory(cat);
  }, [searchParams, initialCategory]);

  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(Number.MAX_SAFE_INTEGER);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadCategory = useCallback(async (category: string) => {
    const key = normalizeCategory(category);
    if (!key || categoryCacheRef.current[key] || hasFullMasterDataset) return;
    setCategoryLoading(true);
    try {
      const res = await fetch(`/api/gallery-images?category=${encodeURIComponent(key)}&limit=1000`);
      if (res.ok) {
        const json = await res.json();
        const mapped = mapGalleryImages(json.items || []);
        categoryCacheRef.current[key] = mapped;
        setAllMasterImages((existing) => {
          const ids = new Set(existing.map((item) => item.id));
          return [...existing, ...mapped.filter((item) => !ids.has(item.id))];
        });
      }
    } finally { setCategoryLoading(false); }
  }, [hasFullMasterDataset]);

  const handleCategoryClick = (newCat: string) => {
    const norm = normalizeCategory(newCat);
    const targetCategory = (!newCat || norm === 'all') ? '' : newCat;
    if (targetCategory) void loadCategory(targetCategory);
    setActiveCategory(targetCategory);
    setVisibleCount(Number.MAX_SAFE_INTEGER);

    const newUrl = targetCategory ? `/gallery?category=${encodeURIComponent(targetCategory.toLowerCase())}` : '/gallery';
    router.replace(newUrl, { scroll: false });
  };

  const filtered = useMemo(() => {
    const norm = normalizeCategory(activeCategory);
    if (!activeCategory || !norm || norm === 'all') {
      return allMasterImages;
    }
    return allMasterImages.filter((img) => isCategoryMatch(img.category, activeCategory));
  }, [allMasterImages, activeCategory]);

  const visibleImages = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (visibleCount >= filtered.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length));
        }
      },
      { rootMargin: '400px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [visibleCount, filtered.length]);

  // Check if explicit shoots are present
  const explicitShoots = useMemo(() => {
    const shootMap = new Map<string, GalleryItem[]>();
    filtered.forEach((img) => {
      if (img.shoot && img.shoot.trim()) {
        const key = img.shoot.trim();
        if (!shootMap.has(key)) shootMap.set(key, []);
        shootMap.get(key)!.push(img);
      }
    });
    // Only group if there are multiple images sharing explicit shoot names
    const validGrouped = Array.from(shootMap.entries()).filter(([_, items]) => items.length >= 2);
    return validGrouped;
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

  const skeletonCount = 8;
  const skeletonAspects = useMemo(() => {
    const ratios = ['3/4', '4/5', '3/4', '4/5', '3/4', '1/1', '4/5', '3/4'];
    return Array.from({ length: skeletonCount }, (_, i) => ratios[i % ratios.length]);
  }, []);

  const displayCategoryName = useMemo(() => {
    if (!activeCategory || normalizeCategory(activeCategory) === 'all') return 'Master Portfolio';
    return `${formatCategory(activeCategory)} Fine Art Portfolio`;
  }, [activeCategory]);

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

          {/* Category Filter Tabs */}
          <div className="mb-14 md:mb-16 overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-center gap-8 md:gap-10 pb-2 min-w-max mx-auto">
              {[
                { key: '', label: 'All' },
                ...CANONICAL_CATEGORIES.map((cat) => ({ key: cat, label: formatCategory(cat) || cat })),
              ].map((item) => {
                const isActive = item.key === ''
                  ? (!activeCategory || normalizeCategory(activeCategory) === '' || normalizeCategory(activeCategory) === 'all')
                  : isCategoryMatch(activeCategory, item.key);

                return (
                  <button
                    key={item.key || 'all'}
                    onMouseEnter={() => { if (item.key) void loadCategory(item.key); }}
                    onFocus={() => { if (item.key) void loadCategory(item.key); }}
                    onClick={() => handleCategoryClick(item.key)}
                    className={cn(
                      'relative font-mono text-[11px] uppercase tracking-[0.25em] whitespace-nowrap transition-colors duration-300 py-2',
                      isActive
                        ? 'text-[#2B2625]'
                        : 'text-[#7C706D]/50 hover:text-[#2B2625]'
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

          {/* Content Area */}
          {(loading || categoryLoading) && filtered.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {skeletonAspects.map((aspect, i) => (
                <ShimmerPlaceholder key={i} aspectRatio={aspect} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E7DDD2] pb-4 gap-2">
                <div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-[0.3em]">
                    {activeCategory ? formatCategory(activeCategory) : 'All Collections'}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#2B2625] mt-1">
                    {displayCategoryName}
                  </h2>
                </div>
              </div>
              <CategoryIntroduction category={activeCategory} />
              <div className="pt-8 pb-20 text-center">
                <div className="w-16 h-px bg-[#C39E96]/20 mx-auto mb-6" />
                <p className="font-serif text-xl text-[#7C706D]/60 italic">
                  No images in this collection yet.
                </p>
                <p className="font-sans text-xs text-[#7C706D]/40 mt-3 uppercase tracking-[0.2em]">
                  Select another category to explore
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Collection Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E7DDD2] pb-4 gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-[0.3em]">
                      {activeCategory ? formatCategory(activeCategory) : 'All Collections'}
                    </span>

                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#2B2625] mt-1">
                    {displayCategoryName}
                  </h2>
                </div>
              </div>

              <CategoryIntroduction category={activeCategory} />

              {/* Continuous Masonry Portfolio Grid */}
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 gallery-protected-container">
                {visibleImages.map((img, idx) => (
                  <GalleryImageCard
                    key={img.id}
                    img={img}
                    index={idx}
                    onClick={() => openLightbox(idx)}
                  />
                ))}
              </div>

              {/* Load More & Infinite Scroll Sentinel */}
              {visibleCount < filtered.length && (
                <div ref={loadMoreRef} className="pt-8 pb-4 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length))}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] font-mono text-[11px] uppercase tracking-[0.25em] rounded-full hover:bg-[#2B2625] hover:text-white transition-all duration-300 shadow-xs"
                  >
                    Load More Photographs
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {activeCategory && (
          <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 pb-24 space-y-16">
            <InstagramReels category={activeCategory} />
            <CategoryFAQs category={activeCategory} />
          </div>
        )}
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
                  <div className="relative">
                    <img
                      src={currentImage.src}
                      alt={currentImage.alt || currentImage.title || ''}
                      loading="eager"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onLoad={() => setLightboxLoading(false)}
                      className={cn(
                        'max-h-[78vh] max-w-full w-auto h-auto mx-auto object-contain transition-opacity duration-300 select-none',
                        lightboxLoading ? 'opacity-0' : 'opacity-100'
                      )}
                      style={{ userSelect: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                    />
                    <div
                      className="absolute inset-0 z-10 bg-transparent select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ userSelect: 'none', WebkitTouchCallout: 'none' }}
                    />
                  </div>
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
