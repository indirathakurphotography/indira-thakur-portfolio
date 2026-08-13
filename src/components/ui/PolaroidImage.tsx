'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/imageUtils';
import { toThumbUrl } from '@/lib/imageUrl';
import { sanitizeMetadataText } from '@/lib/categoryUtils';

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
  const [useRawSrc, setUseRawSrc] = useState(false);
  const [isLoaded, setIsLoaded] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    setUseRawSrc(false);
    setIsLoaded(priority);
  }, [src, priority]);

  const optimizedSrc = toThumbUrl(src, width || 800, 75);
  const currentSrc = useRawSrc ? src : (optimizedSrc || src);

  const handleError = () => {
    if (!useRawSrc && src && src !== optimizedSrc) {
      setUseRawSrc(true);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const cleanAlt = sanitizeMetadataText(alt, 'Fine Art Photography');
  const cleanCaption = sanitizeMetadataText(caption, '');
  const hasCaption = showCaption && Boolean(cleanCaption);
  const positionClass = OBJECT_POSITION_CLASS[objectPosition] ?? 'object-center';

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[#FAF6F3] text-[#7C706D]',
          containerClassName
        )}
        style={!fill ? { aspectRatio: `${width} / ${height}` } : undefined}
      >
        <div className="flex flex-col items-center p-4 text-center">
          <span className="font-serif italic text-sm text-[#2B2625] mb-1">Indira Thakur Photography</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#C39E96]">Fine Art Fine Print</span>
        </div>
      </div>
    );
  }

  const img = (
    <img
      ref={imgRef}
      src={currentSrc}
      srcSet={useRawSrc ? undefined : srcSet}
      sizes={sizes}
      alt={cleanAlt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      referrerPolicy="no-referrer"
      onLoad={handleLoad}
      onError={handleError}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      className={cn(
        'w-full h-full transition-opacity duration-300 select-none pointer-events-auto',
        isLoaded ? 'opacity-100' : 'opacity-90',
        objectFit === 'cover' ? 'object-cover' : 'object-contain',
        positionClass,
        className
      )}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        ...style,
      } as React.CSSProperties}
    />
  );

  const protectionOverlay = (
    <div
      className="absolute inset-0 z-10 bg-transparent select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
    />
  );

  const containerClasses = cn(
    'relative overflow-hidden protected-image select-none',
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
        {protectionOverlay}
      </div>
    );
  }

  return (
    <figure
      className={cn(containerClasses, onClick && 'cursor-pointer')}
      style={!fill ? { aspectRatio: `${width} / ${height}` } : undefined}
      onClick={onClick}
    >
      <div className="relative w-full h-full">
        {img}
        {protectionOverlay}
      </div>
      <figcaption className="px-3 py-2 bg-ivory border-t border-cream relative z-20">
        <p className="text-sm font-medium text-rich-black">{cleanCaption}</p>
      </figcaption>
    </figure>
  );
}
