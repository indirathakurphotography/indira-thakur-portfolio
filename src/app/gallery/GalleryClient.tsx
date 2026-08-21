'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiXMark,
  HiArrowLeft,
  HiArrowRight,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';
import { cn } from '@/lib/imageUtils';
import { toSrcSet, toThumbUrl } from '@/lib/imageUrl';
import {
  normalizeCategory,
  isCategoryMatch,
  formatCategory,
  sanitizeMetadataText,
} from '@/lib/categoryUtils';
import CategoryFAQs from '@/components/sections/CategoryFAQs';
import InstagramReels from '@/components/sections/InstagramReels';
import {
  IGallerySettings,
  DEFAULT_GALLERY_SETTINGS,
  resolveCategoryIntro,
  ICategoryIntro,
} from '@/types/gallerySettings';
import { useSiteConfig } from '@/hooks/useSiteConfig';

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
      id:
        img.id ||
        img._id ||
        `img-${img.src.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown'}`,
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

const CANONICAL_CATEGORIES = [
  'Newborn',
  'Maternity',
  'Portrait',
  'Weddings',
  'Events',
  'Brand',
];

// Aspect ratio helper
function getAspectRatioStyle(
  ratioSetting: string,
  naturalWidth: number,
  naturalHeight: number
): string {
  switch (ratioSetting) {
    case '1:1':
      return '1 / 1';
    case '4:5':
      return '4 / 5';
    case '3:4':
      return '3 / 4';
    case '2:3':
      return '2 / 3';
    case '3:2':
      return '3 / 2';
    case '16:9':
      return '16 / 9';
    case 'original':
    default:
      return `${naturalWidth || 800} / ${naturalHeight || 1000}`;
  }
}

// Border radius class helper
function getBorderRadiusClass(radius: string): string {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'medium':
      return 'rounded-lg';
    case 'large':
      return 'rounded-2xl';
    case 'full':
      return 'rounded-3xl';
    case 'small':
    default:
      return 'rounded-sm';
  }
}

// Interaction class helper
function getImageInteractionClasses(interaction: string): {
  card: string;
  img: string;
  overlay: string;
} {
  switch (interaction) {
    case 'static':
      return {
        card: '',
        img: '',
        overlay:
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
      };
    case 'lift':
      return {
        card: 'transition-all duration-400 group-hover:-translate-y-2 group-hover:shadow-xl',
        img: 'transition-transform duration-500 group-hover:scale-[1.02]',
        overlay:
          'opacity-0 group-hover:opacity-100 transition-opacity duration-400',
      };
    case 'reveal':
      return {
        card: 'transition-all duration-400',
        img: 'transition-all duration-500 filter group-hover:brightness-90',
        overlay:
          'opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-400',
      };
    case 'scroll-motion':
      return {
        card: 'transition-all duration-500',
        img: 'transition-transform duration-700 group-hover:scale-105',
        overlay:
          'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
      };
    case 'circular-motion':
      return {
        card: 'transition-all duration-500 group-hover:rotate-[0.5deg]',
        img: 'transition-transform duration-700 group-hover:scale-105',
        overlay:
          'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
      };
    case 'cinematic':
      return {
        card: 'transition-all duration-500',
        img: 'transition-transform duration-1000 ease-out group-hover:scale-110',
        overlay:
          'opacity-0 group-hover:opacity-100 bg-radial from-transparent to-black/60 transition-opacity duration-700',
      };
    case 'subtle-zoom':
    default:
      return {
        card: '',
        img: 'transition-all duration-500 group-hover:scale-[1.03]',
        overlay:
          'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
      };
  }
}

// Columns CSS class generator
function getColumnClasses(
  desktop: number,
  tablet: number,
  mobile: number
): string {
  // Mobile columns
  const m = mobile === 2 ? 'columns-2' : 'columns-1';
  // Tablet columns
  const t =
    tablet === 4
      ? 'sm:columns-3 md:columns-4'
      : tablet === 2
        ? 'sm:columns-2 md:columns-2'
        : 'sm:columns-2 md:columns-3';
  // Desktop columns
  const d =
    desktop === 5
      ? 'lg:columns-5'
      : desktop === 3
        ? 'lg:columns-3'
        : desktop === 2
          ? 'lg:columns-2'
          : 'lg:columns-4';

  return `${m} ${t} ${d}`;
}

function getGridColumnClasses(
  desktop: number,
  tablet: number,
  mobile: number
): string {
  const m = mobile === 2 ? 'grid-cols-2' : 'grid-cols-1';
  const t =
    tablet === 4
      ? 'sm:grid-cols-3 md:grid-cols-4'
      : tablet === 2
        ? 'sm:grid-cols-2 md:grid-cols-2'
        : 'sm:grid-cols-2 md:grid-cols-3';
  const d =
    desktop === 5
      ? 'lg:grid-cols-5'
      : desktop === 3
        ? 'lg:grid-cols-3'
        : desktop === 2
          ? 'lg:grid-cols-2'
          : 'lg:grid-cols-4';

  return `grid ${m} ${t} ${d}`;
}

function getGapClasses(gap: string): { container: string; item: string } {
  switch (gap) {
    case 'small':
      return { container: 'gap-2 md:gap-3', item: 'mb-2 md:mb-3' };
    case 'large':
      return { container: 'gap-6 md:gap-8', item: 'mb-6 md:mb-8' };
    case 'medium':
    default:
      return { container: 'gap-4 md:gap-6', item: 'mb-4 md:mb-6' };
  }
}

// Custom hook for drag-to-scroll
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
    setDraggedDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    setDraggedDistance(Math.abs(walk));
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleScroll = () => {
    if (!ref.current) return;
    const max = ref.current.scrollWidth - ref.current.clientWidth;
    if (max > 0) {
      setScrollProgress((ref.current.scrollLeft / max) * 100);
    }
  };

  const scrollBy = (amount: number) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return {
    ref,
    isDragging,
    draggedDistance,
    scrollProgress,
    scrollBy,
    events: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
      onScroll: handleScroll,
    },
  };
}

// 1. Editorial Grid Card (DEFAULT)
function EditorialGridCard({
  img,
  index,
  settings,
  onClick,
}: {
  img: GalleryItem;
  index: number;
  settings: IGallerySettings;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 640, 75);
  const isPriority = index < 8;
  const aspectRatio = getAspectRatioStyle(settings.aspectRatio, img.width, img.height);
  const radiusClass = getBorderRadiusClass(settings.borderRadius);
  const interactionClasses = getImageInteractionClasses(settings.imageInteraction);
  const gapClasses = getGapClasses(settings.imageGap);
  const isClickable = settings.clickBehavior !== 'none';

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'block w-full text-left break-inside-avoid group',
        gapClasses.item,
        isClickable ? 'cursor-pointer' : 'cursor-default'
      )}
      aria-label={`Open ${img.alt || img.title || 'photograph'} in full view`}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[#FAF6F3] w-full',
          radiusClass,
          interactionClasses.card
        )}
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
          className={cn(
            'w-full h-full object-cover protected-image',
            interactionClasses.img
          )}
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-[#151211]/60 via-transparent to-transparent pointer-events-none',
            interactionClasses.overlay
          )}
        />
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
    </button>
  );
}

// 2. Masonry Flow Card (Pinterest / Organic Vertical Stagger)
function MasonryFlowCard({
  img,
  index,
  settings,
  onClick,
}: {
  img: GalleryItem;
  index: number;
  settings: IGallerySettings;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 640, 75);
  const isPriority = index < 8;

  // Stagger aspect ratio naturally for authentic masonry rhythm
  const masonryAspects = ['2/3', '3/4', '4/5', '1/1', '3/2', '9/14'];
  const calculatedAspect = img.width && img.height
    ? `${img.width}/${img.height}`
    : masonryAspects[index % masonryAspects.length];

  const radiusClass = getBorderRadiusClass(settings.borderRadius);
  const interactionClasses = getImageInteractionClasses(settings.imageInteraction);
  const gapClasses = getGapClasses(settings.imageGap);
  const isClickable = settings.clickBehavior !== 'none';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        'break-inside-avoid group relative',
        gapClasses.item,
        isClickable && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[#FAF6F3] w-full border border-[#E7DDD2]/50 shadow-xs group-hover:shadow-lg transition-all duration-500',
          radiusClass,
          interactionClasses.card
        )}
        style={{ aspectRatio: calculatedAspect }}
      >
        <img
          src={thumbUrl}
          srcSet={hasError ? undefined : img.thumbSrcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={img.alt || img.title || 'Fine Art Photography'}
          loading={isPriority ? 'eager' : 'lazy'}
          fetchPriority={index < 4 ? 'high' : 'auto'}
          decoding="async"
          onError={() => {
            if (!hasError) setHasError(true);
          }}
          className={cn(
            'w-full h-full object-cover protected-image group-hover:scale-105 transition-transform duration-700 ease-out',
            interactionClasses.img
          )}
        />

        {/* Floating Category Badge Top-Left */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-xs text-[#2B2625] font-mono text-[9px] px-2.5 py-1 uppercase tracking-widest shadow-xs">
            {formatCategory(img.category)}
          </span>
        </div>

        {/* Gradient and Title Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none flex flex-col justify-end p-4 md:p-5">
          {img.title && (
            <p className="font-serif text-sm md:text-base text-white line-clamp-2 leading-snug">
              {img.title}
            </p>
          )}
          {img.caption && (
            <p className="font-sans text-[11px] text-white/75 mt-1 line-clamp-1">
              {img.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Uniform Grid Card (Clean Structured Catalog)
function UniformGridCard({
  img,
  index,
  settings,
  onClick,
}: {
  img: GalleryItem;
  index: number;
  settings: IGallerySettings;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 640, 75);
  const isPriority = index < 8;
  const fixedAspect = settings.aspectRatio === 'original' ? '1/1' : getAspectRatioStyle(settings.aspectRatio, img.width, img.height);
  const radiusClass = getBorderRadiusClass(settings.borderRadius);
  const interactionClasses = getImageInteractionClasses(settings.imageInteraction);
  const isClickable = settings.clickBehavior !== 'none';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        'group bg-white p-2.5 sm:p-3 border border-[#E7DDD2]/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col',
        radiusClass,
        isClickable && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[#FAF6F3] w-full',
          radiusClass,
          interactionClasses.card
        )}
        style={{ aspectRatio: fixedAspect }}
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
          className={cn(
            'w-full h-full object-cover protected-image group-hover:scale-105 transition-transform duration-500',
            interactionClasses.img
          )}
        />
        <div
          className={cn(
            'absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
            interactionClasses.overlay
          )}
        />
      </div>
      <div className="pt-3 pb-1 px-1 flex items-center justify-between">
        <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.2em] truncate">
          {formatCategory(img.category)}
        </span>
        <span className="font-mono text-[9px] text-[#7C706D]/50">
          #{String(index + 1).padStart(2, '0')}
        </span>
      </div>
      {img.title && (
        <p className="font-serif text-xs md:text-sm text-[#2B2625] px-1 line-clamp-1 italic">
          {img.title}
        </p>
      )}
    </div>
  );
}

// 4. Large Editorial Card (Alternating Hero Magazine Layout)
function LargeEditorialCard({
  img,
  index,
  settings,
  onClick,
}: {
  img: GalleryItem;
  index: number;
  settings: IGallerySettings;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 1200, 85);
  const isPriority = index < 4;
  const isHero = index % 3 === 0;
  const radiusClass = getBorderRadiusClass(settings.borderRadius);
  const interactionClasses = getImageInteractionClasses(settings.imageInteraction);
  const isClickable = settings.clickBehavior !== 'none';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        'group bg-white overflow-hidden text-left flex flex-col',
        isHero ? 'md:col-span-2' : 'col-span-1',
        isClickable && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[#FAF6F3] w-full border border-[#E7DDD2]',
          radiusClass,
          interactionClasses.card
        )}
        style={{ aspectRatio: isHero ? '16/9' : '4/5' }}
      >
        <img
          src={thumbUrl}
          srcSet={hasError ? undefined : img.thumbSrcSet}
          sizes={isHero ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
          alt={img.alt || img.title || 'Fine Art Photography'}
          loading={isPriority ? 'eager' : 'lazy'}
          fetchPriority={index < 2 ? 'high' : 'auto'}
          decoding="async"
          onError={() => {
            if (!hasError) setHasError(true);
          }}
          className={cn(
            'w-full h-full object-cover protected-image group-hover:scale-105 transition-transform duration-1000 ease-out',
            interactionClasses.img
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151211]/80 via-[#151211]/20 to-transparent pointer-events-none" />

        {/* Caption Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-[#C39E96]" />
            <span className="font-mono text-[10px] md:text-[11px] text-[#C39E96] uppercase tracking-[0.3em]">
              {formatCategory(img.category)}
            </span>
          </div>
          {img.title && (
            <h3 className={cn(
              'font-serif text-white mt-2 leading-tight drop-shadow-xs',
              isHero ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl md:text-2xl'
            )}>
              {img.title}
            </h3>
          )}
          {img.caption && (
            <p className="font-sans text-xs md:text-sm text-white/80 mt-2 line-clamp-2 max-w-2xl">
              {img.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 5. Circular Fine Art Card
function CircularFineArtCard({
  img,
  index,
  settings,
  onClick,
}: {
  img: GalleryItem;
  index: number;
  settings: IGallerySettings;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 640, 75);
  const isPriority = index < 8;
  const interactionClasses = getImageInteractionClasses(settings.imageInteraction);
  const isClickable = settings.clickBehavior !== 'none';

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center p-3 group',
        isClickable && 'cursor-pointer'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[#FAF6F3] rounded-full aspect-square w-full max-w-[260px] mx-auto border-2 border-[#E7DDD2] ring-4 ring-[#FAF6F3] group-hover:border-[#C39E96] group-hover:ring-[#C39E96]/20 shadow-xs transition-all duration-500 group-hover:scale-105 group-hover:shadow-md',
          interactionClasses.card
        )}
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
          className={cn(
            'w-full h-full object-cover protected-image',
            interactionClasses.img
          )}
        />
        <div
          className={cn(
            'absolute inset-0 bg-black/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            interactionClasses.overlay
          )}
        />
      </div>
      <div className="mt-4 space-y-1">
        <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.25em] block">
          {formatCategory(img.category)}
        </span>
        {img.title && (
          <p className="font-serif text-sm text-[#2B2625] line-clamp-1 font-medium">
            {img.title}
          </p>
        )}
      </div>
    </div>
  );
}

// 6. Polaroid & Matted Cards
function PolaroidCard({
  img,
  index,
  settings,
  onClick,
}: {
  img: GalleryItem;
  index: number;
  settings: IGallerySettings;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const thumbUrl = hasError ? img.src : toThumbUrl(img.src, 640, 75);
  const isPriority = index < 8;
  const gapClasses = getGapClasses(settings.imageGap);
  const isClickable = settings.clickBehavior !== 'none';

  // Subtle organic rotation angle
  const rotations = ['rotate-[-1.8deg]', 'rotate-[1.5deg]', 'rotate-[-1deg]', 'rotate-[2deg]', 'rotate-[-1.2deg]', 'rotate-[0.8deg]'];
  const rotationClass = rotations[index % rotations.length];

  return (
    <div
      className={cn(
        'break-inside-avoid text-left relative z-10 transition-all duration-400 group hover:z-30',
        gapClasses.item,
        isClickable && 'cursor-pointer'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div
        className={cn(
          'bg-white p-3 md:p-4 pb-8 md:pb-10 rounded-xs border border-[#E7DDD2] shadow-[0_4px_20px_rgba(0,0,0,0.06)] group-hover:shadow-[0_18px_38px_rgba(0,0,0,0.15)] group-hover:-translate-y-2.5 group-hover:scale-[1.03] transition-all duration-400 transform',
          rotationClass,
          'group-hover:rotate-0'
        )}
      >
        <div
          className="relative overflow-hidden bg-[#FAF6F3] w-full border border-[#E7DDD2]/40"
          style={{ aspectRatio: '4/5' }}
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
            className="w-full h-full object-cover protected-image group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="pt-4 px-1 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.2em] block">
              {formatCategory(img.category)}
            </span>
            {img.title && (
              <p className="font-serif text-xs md:text-sm text-[#2B2625] mt-1 line-clamp-1 italic">
                {img.title}
              </p>
            )}
          </div>
          <span className="font-mono text-[9px] text-[#7C706D]/40 shrink-0">
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

interface GalleryClientProps {
  initialImages?: GalleryItem[];
  initialCategory?: string;
  initialSettings?: IGallerySettings;
}

export default function GalleryClient({
  initialImages,
  initialCategory,
  initialSettings,
}: GalleryClientProps) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') || initialCategory || '';
  const [activeCategory, setActiveCategory] = useState(urlCategory);

  const { config } = useSiteConfig();
  const [liveSettings, setLiveSettings] = useState<IGallerySettings | null>(null);

  // Sync fresh settings from /api/gallery-settings
  useEffect(() => {
    async function loadFreshSettings() {
      try {
        const res = await fetch('/api/gallery-settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            setLiveSettings(data);
          }
        }
      } catch {}
    }

    loadFreshSettings();

    const handleUpdate = () => {
      loadFreshSettings();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gallery-settings-updated' || e.key === 'site-config-updated') {
        loadFreshSettings();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gallery-settings-updated', handleUpdate);
      window.addEventListener('site-config-updated', handleUpdate);
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gallery-settings-updated', handleUpdate);
        window.removeEventListener('site-config-updated', handleUpdate);
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  const settings: IGallerySettings = useMemo(() => {
    return {
      ...DEFAULT_GALLERY_SETTINGS,
      ...(initialSettings || {}),
      ...(config?.gallerySettings || {}),
      ...(liveSettings || {}),
    };
  }, [initialSettings, config?.gallerySettings, liveSettings]);

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

  const [hasFullMasterDataset, setHasFullMasterDataset] = useState<boolean>(
    () => {
      // If an initial category was specified, initialImages only contains category images,
      // so we do not have the full master dataset yet.
      if (initialCategory && normalizeCategory(initialCategory) !== 'all') {
        return false;
      }
      if (!initialImages || initialImages.length === 0) return false;
      if (
        initialImages.some((img) => String(img.id || '').startsWith('gal-'))
      )
        return false;
      return true;
    }
  );

  const [loading, setLoading] = useState(
    !initialImages || initialImages.length === 0
  );
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const fetchingRef = useRef(false);
  const categoryCacheRef = useRef<Record<string, GalleryItem[]>>({});
  const [categoryLoading, setCategoryLoading] = useState(false);

  const fetchMasterGallery = useCallback(async () => {
    if (fetchingRef.current || hasFullMasterDataset) return;

    fetchingRef.current = true;
    if (allMasterImages.length === 0) {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/gallery-images?limit=1000');
      if (res.ok) {
        const json = await res.json();
        const data: GalleryImage[] =
          json.items || (Array.isArray(json) ? json : []);
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

  useEffect(() => {
    setActiveCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category') || initialCategory || '';
      setActiveCategory(cat);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialCategory]);

  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(Number.MAX_SAFE_INTEGER);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadCategory = useCallback(
    async (category: string) => {
      const key = normalizeCategory(category);
      if (!key || key === 'all') {
        if (!hasFullMasterDataset) {
          void fetchMasterGallery();
        }
        return;
      }
      if (categoryCacheRef.current[key] || hasFullMasterDataset) return;
      setCategoryLoading(true);
      try {
        const res = await fetch(
          `/api/gallery-images?category=${encodeURIComponent(key)}&limit=1000`
        );
        if (res.ok) {
          const json = await res.json();
          const rawItems = json.items || (Array.isArray(json) ? json : []);
          const mapped = mapGalleryImages(rawItems);
          categoryCacheRef.current[key] = mapped;
          setAllMasterImages((existing) => {
            const ids = new Set(existing.map((item) => item.id));
            const toAdd = mapped.filter((item) => !ids.has(item.id));
            return toAdd.length > 0 ? [...existing, ...toAdd] : existing;
          });
        }
      } catch (err) {
        console.warn(`Failed to load gallery category ${key}:`, err);
      } finally {
        setCategoryLoading(false);
      }
    },
    [hasFullMasterDataset, fetchMasterGallery]
  );

  const handleCategoryClick = useCallback(
    (newCat: string) => {
      const norm = normalizeCategory(newCat);
      const targetCategory = !newCat || norm === 'all' ? '' : newCat;
      setActiveCategory(targetCategory);

      const newUrl = targetCategory
        ? `/gallery?category=${encodeURIComponent(targetCategory.toLowerCase())}`
        : '/gallery';

      if (typeof window !== 'undefined') {
        window.history.pushState({ category: targetCategory }, '', newUrl);
      }

      if (targetCategory) {
        void loadCategory(targetCategory);
      } else {
        void fetchMasterGallery();
      }
    },
    [loadCategory, fetchMasterGallery]
  );

  const filtered = useMemo(() => {
    const norm = normalizeCategory(activeCategory);
    if (!activeCategory || !norm || norm === 'all') {
      return allMasterImages;
    }
    return allMasterImages.filter((img) =>
      isCategoryMatch(img.category, activeCategory)
    );
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
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, filtered.length)
          );
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

  const openLightbox = useCallback(
    (index: number) => {
      if (settings.clickBehavior === 'none') return;
      setCurrentIndex(index);
      setLightboxOpen(true);
      setLightboxLoading(true);
    },
    [settings.clickBehavior]
  );

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
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  const currentImage = filtered[currentIndex];

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  const skeletonCount = 8;
  const skeletonAspects = useMemo(() => {
    const ratios = ['3/4', '4/5', '3/4', '4/5', '3/4', '1/1', '4/5', '3/4'];
    return Array.from(
      { length: skeletonCount },
      (_, i) => ratios[i % ratios.length]
    );
  }, []);

  const displayCategoryName = useMemo(() => {
    if (!activeCategory || normalizeCategory(activeCategory) === 'all')
      return 'Master Portfolio';
    return `${formatCategory(activeCategory)} Fine Art Portfolio`;
  }, [activeCategory]);

  // Header Spacing Class
  const headerSpacingClass = useMemo(() => {
    switch (settings.headerSpacing) {
      case 'compact':
        return 'mb-8 md:mb-12';
      case 'spacious':
        return 'mb-20 md:mb-28';
      case 'normal':
      default:
        return 'mb-14 md:mb-20';
    }
  }, [settings.headerSpacing]);

  // Header Alignment Class
  const headerAlignClass = useMemo(() => {
    switch (settings.headerAlignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
      default:
        return 'text-center';
    }
  }, [settings.headerAlignment]);

  // Intro width Class
  const introWidthClass = useMemo(() => {
    switch (settings.introWidth) {
      case 'narrow':
        return 'max-w-xl';
      case 'wide':
        return 'max-w-5xl';
      case 'medium':
      default:
        return 'max-w-3xl';
    }
  }, [settings.introWidth]);

  // Font family class
  const fontFamilyClass = useMemo(() => {
    switch (settings.fontFamily) {
      case 'sans':
        return 'font-sans';
      case 'cormorant':
      case 'playfair':
      case 'serif':
      default:
        return 'font-serif';
    }
  }, [settings.fontFamily]);

  // Heading size class
  const headingSizeClass = useMemo(() => {
    switch (settings.headingSize) {
      case 'compact':
        return 'text-3xl md:text-4xl lg:text-5xl';
      case 'large':
        return 'text-5xl md:text-6xl lg:text-7xl';
      case 'display':
        return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight';
      case 'normal':
      default:
        return 'text-4xl md:text-5xl lg:text-6xl';
    }
  }, [settings.headingSize]);

  // Dynamic available categories computed from master images + settings
  const availableCategories = useMemo(() => {
    const catsMap = new Map<string, string>();
    CANONICAL_CATEGORIES.forEach((c) => {
      const norm = normalizeCategory(c);
      if (norm && norm !== 'all') {
        catsMap.set(norm, formatCategory(c) || c);
      }
    });

    allMasterImages.forEach((img) => {
      if (img.category) {
        const norm = normalizeCategory(img.category);
        if (norm && norm !== 'all' && !catsMap.has(norm)) {
          catsMap.set(norm, formatCategory(img.category) || img.category);
        }
      }
    });

    if (settings?.categoryIntroductions) {
      Object.keys(settings.categoryIntroductions).forEach((k) => {
        const norm = normalizeCategory(k);
        if (norm && norm !== 'all' && !catsMap.has(norm)) {
          catsMap.set(norm, formatCategory(k) || k);
        }
      });
    }

    return Array.from(catsMap.values());
  }, [allMasterImages, settings.categoryIntroductions]);

  // Active Category Introduction (Eyebrow, Heading, Description)
  const activeIntro = useMemo(() => {
    return resolveCategoryIntro(activeCategory, settings);
  }, [activeCategory, settings]);

  // Horizontal scroll container ref
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const scrollHorizontal = (dir: 'left' | 'right') => {
    if (!horizontalScrollRef.current) return;
    const scrollAmount = dir === 'left' ? -600 : 600;
    horizontalScrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  // Filmstrip scroll ref
  const filmstripRef = useRef<HTMLDivElement>(null);
  const scrollFilmstrip = (dir: 'left' | 'right') => {
    if (!filmstripRef.current) return;
    const scrollAmount = dir === 'left' ? -500 : 500;
    filmstripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 pt-36 pb-28">
          {/* Header */}
          <div className={cn(headerSpacingClass, headerAlignClass)}>
            <motion.span
              key={`eyebrow-${normalizeCategory(activeCategory) || 'all'}`}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ color: settings.eyebrowColor || '#C39E96' }}
              className="font-mono text-[11px] uppercase tracking-[0.35em] block mb-4 font-medium"
            >
              {activeIntro.eyebrow}
            </motion.span>
            <motion.h1
              key={`heading-${normalizeCategory(activeCategory) || 'all'}`}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ color: settings.headingColor || '#2B2625' }}
              className={cn(fontFamilyClass, headingSizeClass, 'leading-[1.1]')}
            >
              {activeIntro.heading}
            </motion.h1>
            <div
              className={cn(
                'w-10 h-px mt-5',
                settings.headerAlignment === 'left'
                  ? 'mr-auto'
                  : settings.headerAlignment === 'right'
                    ? 'ml-auto'
                    : 'mx-auto'
              )}
              style={{ backgroundColor: settings.eyebrowColor ? `${settings.eyebrowColor}40` : '#C39E964D' }}
            />
            <motion.div
              key={`desc-${normalizeCategory(activeCategory) || 'all'}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ color: settings.subtitleColor || '#6D625F' }}
              className={cn(
                'mt-7 md:mt-8 px-2 text-lg md:text-xl leading-relaxed',
                fontFamilyClass,
                introWidthClass,
                settings.headerAlignment === 'left'
                  ? 'mr-auto'
                  : settings.headerAlignment === 'right'
                    ? 'ml-auto'
                    : 'mx-auto'
              )}
            >
              {activeIntro.description ? (
                activeIntro.description.split('\n').map((line, i) => (
                  <span key={i} className="block md:whitespace-nowrap">
                    {line}
                  </span>
                ))
              ) : null}
            </motion.div>
          </div>

          {/* Category Filter Tabs */}
          <div className="mb-14 md:mb-16 overflow-x-auto scrollbar-hide">
            {/* Category Style: TEXT TABS (Default) */}
            {settings.categoryStyle === 'text-tabs' && (
              <div className="flex items-center justify-center gap-8 md:gap-10 pb-2 min-w-max mx-auto">
                {[
                  { key: '', label: 'All' },
                  ...availableCategories.map((cat) => ({
                    key: cat,
                    label: formatCategory(cat) || cat,
                  })),
                ].map((item) => {
                  const isActive =
                    item.key === ''
                      ? !activeCategory ||
                        normalizeCategory(activeCategory) === '' ||
                        normalizeCategory(activeCategory) === 'all'
                      : isCategoryMatch(activeCategory, item.key);

                  return (
                    <button
                      key={item.key || 'all'}
                      onMouseEnter={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onFocus={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
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
            )}

            {/* Category Style: UNDERLINE TABS */}
            {settings.categoryStyle === 'underline-tabs' && (
              <div className="flex items-center justify-center border-b border-[#E7DDD2] pb-px min-w-max mx-auto gap-6 md:gap-8">
                {[
                  { key: '', label: 'All' },
                  ...availableCategories.map((cat) => ({
                    key: cat,
                    label: formatCategory(cat) || cat,
                  })),
                ].map((item) => {
                  const isActive =
                    item.key === ''
                      ? !activeCategory ||
                        normalizeCategory(activeCategory) === '' ||
                        normalizeCategory(activeCategory) === 'all'
                      : isCategoryMatch(activeCategory, item.key);

                  return (
                    <button
                      key={item.key || 'all'}
                      onMouseEnter={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onFocus={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onClick={() => handleCategoryClick(item.key)}
                      className={cn(
                        'relative font-mono text-[11px] uppercase tracking-[0.2em] whitespace-nowrap pb-3.5 pt-2 px-2 transition-all duration-300',
                        isActive
                          ? 'text-[#2B2625] font-semibold'
                          : 'text-[#7C706D] hover:text-[#2B2625]'
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeUnderlineTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2B2625]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category Style: PILLS */}
            {settings.categoryStyle === 'pills' && (
              <div className="flex items-center justify-center gap-2 md:gap-3 min-w-max mx-auto py-1">
                {[
                  { key: '', label: 'All Collections' },
                  ...availableCategories.map((cat) => ({
                    key: cat,
                    label: formatCategory(cat) || cat,
                  })),
                ].map((item) => {
                  const isActive =
                    item.key === ''
                      ? !activeCategory ||
                        normalizeCategory(activeCategory) === '' ||
                        normalizeCategory(activeCategory) === 'all'
                      : isCategoryMatch(activeCategory, item.key);

                  return (
                    <button
                      key={item.key || 'all'}
                      onMouseEnter={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onFocus={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onClick={() => handleCategoryClick(item.key)}
                      className={cn(
                        'font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap',
                        isActive
                          ? 'bg-[#2B2625] text-white shadow-xs'
                          : 'bg-[#FAF6F3] border border-[#E7DDD2] text-[#7C706D] hover:border-[#2B2625] hover:text-[#2B2625]'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category Style: MINIMAL BUTTONS */}
            {settings.categoryStyle === 'minimal-buttons' && (
              <div className="flex items-center justify-center gap-2 md:gap-3 min-w-max mx-auto py-1">
                {[
                  { key: '', label: 'All' },
                  ...availableCategories.map((cat) => ({
                    key: cat,
                    label: formatCategory(cat) || cat,
                  })),
                ].map((item) => {
                  const isActive =
                    item.key === ''
                      ? !activeCategory ||
                        normalizeCategory(activeCategory) === '' ||
                        normalizeCategory(activeCategory) === 'all'
                      : isCategoryMatch(activeCategory, item.key);

                  return (
                    <button
                      key={item.key || 'all'}
                      onMouseEnter={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onFocus={() => {
                        if (item.key) void loadCategory(item.key);
                      }}
                      onClick={() => handleCategoryClick(item.key)}
                      className={cn(
                        'font-mono text-[10px] uppercase tracking-[0.25em] px-4 py-2 border rounded-none transition-all duration-300 whitespace-nowrap',
                        isActive
                          ? 'border-[#2B2625] bg-[#2B2625] text-white'
                          : 'border-[#E7DDD2] bg-white text-[#7C706D] hover:border-[#2B2625] hover:text-[#2B2625]'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
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
                    {activeCategory
                      ? formatCategory(activeCategory)
                      : 'All Collections'}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#2B2625] mt-1">
                    {displayCategoryName}
                  </h2>
                </div>
              </div>
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
                      {activeCategory
                        ? formatCategory(activeCategory)
                        : 'All Collections'}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#2B2625] mt-1">
                    {displayCategoryName}
                  </h2>
                </div>
              </div>

              {/* 1. EDITORIAL GRID (DEFAULT - PRESERVED) */}
              {settings.displayStyle === 'editorial-grid' && (
                <div
                  className={cn(
                    getColumnClasses(
                      settings.desktopColumns,
                      settings.tabletColumns,
                      settings.mobileColumns
                    ),
                    getGapClasses(settings.imageGap).container,
                    'gallery-protected-container'
                  )}
                >
                  {visibleImages.map((img, idx) => (
                    <EditorialGridCard
                      key={img.id}
                      img={img}
                      index={idx}
                      settings={settings}
                      onClick={() => openLightbox(idx)}
                    />
                  ))}
                </div>
              )}

              {/* 2. MASONRY FLOW (Organic Vertical Cascading Stagger) */}
              {settings.displayStyle === 'masonry' && (
                <div
                  className={cn(
                    getColumnClasses(
                      settings.desktopColumns,
                      settings.tabletColumns,
                      settings.mobileColumns
                    ),
                    getGapClasses(settings.imageGap).container,
                    'gallery-protected-container'
                  )}
                >
                  {visibleImages.map((img, idx) => (
                    <MasonryFlowCard
                      key={img.id}
                      img={img}
                      index={idx}
                      settings={settings}
                      onClick={() => openLightbox(idx)}
                    />
                  ))}
                </div>
              )}

              {/* 3. UNIFORM GRID (Strict Symmetrical Catalog Grid) */}
              {settings.displayStyle === 'uniform-grid' && (
                <div
                  className={cn(
                    getGridColumnClasses(
                      settings.desktopColumns,
                      settings.tabletColumns,
                      settings.mobileColumns
                    ),
                    getGapClasses(settings.imageGap).container,
                    'gallery-protected-container'
                  )}
                >
                  {visibleImages.map((img, idx) => (
                    <UniformGridCard
                      key={img.id}
                      img={img}
                      index={idx}
                      settings={settings}
                      onClick={() => openLightbox(idx)}
                    />
                  ))}
                </div>
              )}

              {/* 4. LARGE EDITORIAL (Magazine Showcase with Hero Features) */}
              {settings.displayStyle === 'large-editorial' && (
                <div
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-2',
                    getGapClasses(settings.imageGap).container,
                    'gallery-protected-container'
                  )}
                >
                  {visibleImages.map((img, idx) => (
                    <LargeEditorialCard
                      key={img.id}
                      img={img}
                      index={idx}
                      settings={settings}
                      onClick={() => openLightbox(idx)}
                    />
                  ))}
                </div>
              )}

              {/* 5. HORIZONTAL SCROLL (Panoramic Curated Ribbon) */}
              {settings.displayStyle === 'horizontal-scroll' && (
                <div className="relative group/scroll select-none py-2">
                  <div
                    ref={horizontalScrollRef}
                    className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-8 pt-2 px-1 cursor-grab active:cursor-grabbing"
                  >
                    {visibleImages.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => openLightbox(idx)}
                        className="snap-start shrink-0 w-[300px] sm:w-[420px] md:w-[520px] lg:w-[600px] group cursor-pointer"
                      >
                        <div
                          className={cn(
                            'relative overflow-hidden bg-[#FAF6F3] w-full border border-[#E7DDD2] shadow-sm group-hover:shadow-xl transition-all duration-500',
                            getBorderRadiusClass(settings.borderRadius)
                          )}
                          style={{ aspectRatio: '16/10' }}
                        >
                          <img
                            src={toThumbUrl(img.src, 1000, 80)}
                            srcSet={img.thumbSrcSet}
                            sizes="(max-width: 640px) 100vw, 600px"
                            alt={img.alt || img.title || 'Photograph'}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            className="w-full h-full object-cover protected-image group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none">
                            <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.25em] block">
                              {formatCategory(img.category)}
                            </span>
                            {img.title && (
                              <p className="font-serif text-base md:text-lg text-white mt-1 line-clamp-1">
                                {img.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="pt-3.5 px-1 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4 h-px bg-[#C39E96]" />
                            <span className="font-mono text-[10px] text-[#2B2625] uppercase tracking-[0.2em] font-medium">
                              {img.title || formatCategory(img.category)}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-[#7C706D]/60">
                            {String(idx + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    type="button"
                    onClick={() => scrollHorizontal('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 w-12 h-12 rounded-full bg-white/95 shadow-xl border border-[#E7DDD2] flex items-center justify-center text-[#2B2625] opacity-90 hover:opacity-100 hover:bg-[#2B2625] hover:text-white transition-all duration-300 z-20 cursor-pointer"
                    aria-label="Scroll left"
                  >
                    <HiChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollHorizontal('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 w-12 h-12 rounded-full bg-white/95 shadow-xl border border-[#E7DDD2] flex items-center justify-center text-[#2B2625] opacity-90 hover:opacity-100 hover:bg-[#2B2625] hover:text-white transition-all duration-300 z-20 cursor-pointer"
                    aria-label="Scroll right"
                  >
                    <HiChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* 6. CIRCULAR GALLERY (Medallion Art Presentation) */}
              {settings.displayStyle === 'circular' && (
                <div
                  className={cn(
                    getGridColumnClasses(
                      settings.desktopColumns,
                      settings.tabletColumns,
                      settings.mobileColumns
                    ),
                    getGapClasses(settings.imageGap).container,
                    'gallery-protected-container'
                  )}
                >
                  {visibleImages.map((img, idx) => (
                    <CircularFineArtCard
                      key={img.id}
                      img={img}
                      index={idx}
                      settings={settings}
                      onClick={() => openLightbox(idx)}
                    />
                  ))}
                </div>
              )}

              {/* 7. POLAROID / MATTED PRINTS */}
              {settings.displayStyle === 'polaroid' && (
                <div
                  className={cn(
                    getColumnClasses(
                      settings.desktopColumns,
                      settings.tabletColumns,
                      settings.mobileColumns
                    ),
                    getGapClasses(settings.imageGap).container,
                    'gallery-protected-container py-4'
                  )}
                >
                  {visibleImages.map((img, idx) => (
                    <PolaroidCard
                      key={img.id}
                      img={img}
                      index={idx}
                      settings={settings}
                      onClick={() => openLightbox(idx)}
                    />
                  ))}
                </div>
              )}

              {/* 8. 35MM FILMSTRIP REEL */}
              {settings.displayStyle === 'filmstrip' && (
                <div className="bg-[#12100F] p-6 md:p-10 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden select-none">
                  {/* Film Header */}
                  <div className="flex items-center justify-between pb-5 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C39E96] animate-pulse" />
                      <span className="font-mono text-[10px] md:text-[11px] text-[#C39E96] uppercase tracking-[0.3em]">
                        KODAK PORTRA 400 • {filtered.length} EXPOSURES
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => scrollFilmstrip('left')}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Scroll reel left"
                      >
                        <HiChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollFilmstrip('right')}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Scroll reel right"
                      >
                        <HiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Top Sprocket Track */}
                  <div className="flex items-center gap-3 overflow-hidden py-1 mb-4 opacity-40">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={`sprocket-top-${i}`}
                        className="w-4 h-2.5 rounded-[2px] bg-[#3A3230] border border-white/20 shrink-0"
                      />
                    ))}
                  </div>

                  {/* Filmstrip Reel Track */}
                  <div
                    ref={filmstripRef}
                    className="flex gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 cursor-grab active:cursor-grabbing"
                  >
                    {visibleImages.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => openLightbox(idx)}
                        className="shrink-0 w-72 md:w-88 bg-[#1D1918] p-3.5 rounded-sm border border-white/10 group cursor-pointer hover:border-[#C39E96] transition-all duration-300 hover:shadow-[0_0_25px_rgba(195,158,150,0.25)]"
                      >
                        {/* Film Frame Header Info */}
                        <div className="flex items-center justify-between pb-2 text-[9px] font-mono text-white/40">
                          <span>ISO 400</span>
                          <span>FRAME {String(idx + 1).padStart(2, '0')}</span>
                        </div>

                        {/* Image Frame */}
                        <div className="relative aspect-[3/2] overflow-hidden bg-black border border-white/10">
                          <img
                            src={toThumbUrl(img.src, 640, 75)}
                            alt={img.alt || img.title || 'Photograph'}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            className="w-full h-full object-cover protected-image group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>

                        {/* Film Frame Footer */}
                        <div className="mt-3 flex items-center justify-between text-white/80">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C39E96] truncate max-w-[180px]">
                            {img.title || formatCategory(img.category)}
                          </span>
                          <span className="font-mono text-[9px] text-white/40">
                            DX {String(idx + 101)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Sprocket Track */}
                  <div className="flex items-center gap-3 overflow-hidden py-1 mt-4 opacity-40">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={`sprocket-bot-${i}`}
                        className="w-4 h-2.5 rounded-[2px] bg-[#3A3230] border border-white/20 shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Load More & Infinite Scroll Sentinel */}
              {visibleCount < filtered.length && (
                <div ref={loadMoreRef} className="pt-8 pb-4 text-center">
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + BATCH_SIZE, filtered.length)
                      )
                    }
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
            className="fixed inset-0 z-[70] bg-[#1C1817] flex items-center justify-center select-none cursor-pointer"
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeLightbox();
            }}
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
              <HiXMark className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              onClick={goPrev}
              className="absolute left-3 md:left-6 z-30 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 cursor-pointer"
              aria-label="Previous image"
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>

            {/* Next */}
            <button
              onClick={goNext}
              className="absolute right-3 md:right-6 z-30 w-12 h-12 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 cursor-pointer"
              aria-label="Next image"
            >
              <HiArrowRight className="w-5 h-5" />
            </button>

            {/* Image area */}
            <div
              className="max-w-5xl w-full px-4 md:px-16 relative flex flex-col items-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
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
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
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
                      style={{
                        userSelect: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                      }}
                    />
                    <div
                      className="absolute inset-0 z-10 bg-transparent select-none pointer-events-none"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        userSelect: 'none',
                        WebkitTouchCallout: 'none',
                      }}
                    />
                  </div>
                  {(currentImage.title || currentImage.caption) && (
                    <div className="mt-5 text-center max-w-lg">
                      {currentImage.title && (
                        <p className="font-serif text-sm text-white/80 leading-relaxed font-medium">
                          {currentImage.title}
                        </p>
                      )}
                      {currentImage.caption && (
                        <p className="font-sans text-xs text-white/50 leading-relaxed mt-1">
                          {currentImage.caption}
                        </p>
                      )}
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
                  {String(currentIndex + 1).padStart(2, '0')} /{' '}
                  {String(filtered.length).padStart(2, '0')}
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
