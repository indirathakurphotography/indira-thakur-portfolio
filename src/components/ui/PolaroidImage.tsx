'use client';

import { useState } from 'react';
import { cn } from '@/lib/imageUtils';
import { toThumbUrl, toSrcSet } from '@/lib/imageUrl';

interface PolaroidImageProps {
  src: string;
  alt: string;
  srcSet?: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  objectFit?: 'cover' | 'contain';
  objectPosition?: 'top' | 'center' | 'bottom' | 'left' | 'right' | string;
  priority?: boolean;
  caption?: string;
  showCaption?: boolean;
  sizes?: string;
  fill?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  bgColor?: string;
}

const OBJECT_POSITION_CLASS: Record<string, string> = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

export function PolaroidImage({
  src,
  alt,
  srcSet,
  width = 800,
  height = 600,
  className,
  containerClassName,
  objectFit = 'contain',
  objectPosition = 'center',
  priority = false,
  caption,
  showCaption = false,
  sizes,
  fill = false,
  onClick,
  style,
  bgColor = 'bg-[#FAF6F3]',
}: PolaroidImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(priority);

  const imageUrl = typeof src === 'string' ? src : (typeof src === 'object' && src !== null && 'url' in src && typeof (src as { url?: string }).url === 'string' ? (src as { url: string }).url : '');

  const trigger = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const hasCaption = showCaption && caption;
  const positionClass = OBJECT_POSITION_CLASS[objectPosition] ?? 'object-center';

  if (!imageUrl || !imageUrl.trim() || hasError) {
    return (
      <div
        className={cn(
          'relative w-full h-full min-h-[280px] flex flex-col items-center justify-center bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] p-8 text-center select-none rounded-sm',
          containerClassName
        )}
        style={!fill ? { aspectRatio: `${width} / ${height}` } : undefined}
      >
        <div className="w-14 h-14 rounded-full border border-[#C39E96]/50 flex items-center justify-center text-[#C39E96] mb-3 bg-white shadow-xs">
          <span className="font-serif font-bold text-base tracking-wider">IT</span>
        </div>
        <span className="font-serif text-base font-light text-[#2B2625] tracking-wide">
          {alt || 'Indira Thakur'}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C39E96] mt-1.5 font-medium">
          Fine Art Studio
        </span>
      </div>
    );
  }

  const optimizedSrc = toThumbUrl(imageUrl, width, 80);
  const optimizedSrcSet = srcSet || toSrcSet(imageUrl, [384, 640, 828, 1200], 80);

  const img = (
    <img
      ref={(el) => {
        if (el && el.complete) {
          setIsLoaded(true);
        }
      }}
      src={optimizedSrc}
      srcSet={optimizedSrcSet}
      sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      referrerPolicy="no-referrer"
      onLoad={trigger}
      onError={handleError}
      className={cn(
        'w-full h-full transition-opacity duration-100',
        isLoaded ? 'opacity-100' : 'opacity-0',
        objectFit === 'cover' ? 'object-cover' : 'object-contain',
        positionClass,
        className
      )}
      style={style}
    />
  );

  const containerClasses = cn(
    'relative overflow-hidden',
    fill && 'h-full',
    bgColor,
    containerClassName
  );

  if (!hasCaption) {
    return (
      <div
        className={containerClasses}
        style={!fill ? { aspectRatio: `${width} / ${height}`, ...style } : style}
        onClick={onClick}
      >
        {img}
      </div>
    );
  }

  return (
    <figure
      className={cn(containerClasses, onClick && 'cursor-pointer')}
      style={!fill ? { aspectRatio: `${width} / ${height}` } : undefined}
      onClick={onClick}
    >
      <div className="relative w-full h-full">{img}</div>
      <figcaption className="px-3 py-2 bg-ivory border-t border-cream">
        <p className="text-sm font-medium text-rich-black">{caption}</p>
      </figcaption>
    </figure>
  );
}

