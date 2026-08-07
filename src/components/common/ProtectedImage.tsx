'use client';

import React from 'react';
import { cn } from '@/lib/imageUtils';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  watermarkText?: string;
  showWatermark?: boolean;
  aspectRatio?: string | number;
}

export default function ProtectedImage({
  src,
  alt,
  className,
  containerClassName,
  watermarkText = 'INDIRA THAKUR PHOTOGRAPHY',
  showWatermark = false,
  aspectRatio,
  style,
  onContextMenu,
  onDragStart,
  ...props
}: ProtectedImageProps) {
  const handleContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (onContextMenu) onContextMenu(e);
  };

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (onDragStart) onDragStart(e);
  };

  return (
    <div
      className={cn('relative overflow-hidden protected-image select-none', containerClassName)}
      style={aspectRatio ? { aspectRatio: String(aspectRatio) } : undefined}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className={cn(
          'w-full h-full object-cover transition-all duration-500 pointer-events-auto select-none',
          className
        )}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          ...style,
        } as React.CSSProperties}
        {...props}
      />

      {/* Invisible protection overlay intercepting right-clicks and drag */}
      <div
        className="absolute inset-0 z-10 bg-transparent select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ userSelect: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      />

      {/* Dynamic Watermark */}
      {showWatermark && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none select-none opacity-40 hover:opacity-60 transition-opacity">
          <span className="font-mono text-[9px] sm:text-[10px] text-white uppercase tracking-[0.25em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-2 py-0.5 bg-black/30 backdrop-blur-xs rounded-xs">
            {watermarkText}
          </span>
        </div>
      )}
    </div>
  );
}
