'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { toThumbUrl } from '@/lib/imageUrl';

export default function HeroEditorial() {
  const { config } = useSiteConfig();
  const [currentIndex, setCurrentIndex] = useState(0);

  const homeConfig = config?.home || (config as any)?.hero;

  const heroData = {
    tagline: homeConfig?.tagline || '',
    heading: homeConfig?.heading || '',
    headingItalic: homeConfig?.headingItalic || '',
    categories: homeConfig?.categories?.length ? homeConfig.categories : [],
    ctaText: homeConfig?.ctaText || '',
    ctaLink: homeConfig?.ctaLink || '',
    secondaryCtaText: homeConfig?.secondaryCtaText || '',
    secondaryCtaLink: homeConfig?.secondaryCtaLink || '',
  };

  const rawImages = homeConfig?.heroImages;
  const images = Array.isArray(rawImages)
    ? rawImages.filter(
        (img: any) =>
          img &&
          typeof img.url === 'string' &&
          img.url.trim().length > 0 &&
          !img.url.toLowerCase().includes('logo')
      )
    : [];

  const nextSlide = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [images.length, nextSlide]);

  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    if (images && images.length > 0) {
      images.forEach((img: any) => {
        if (img?.url) {
          const preloader = new Image();
          preloader.src = toThumbUrl(img.url, 1600, 75);
        }
      });
    }
  }, [images]);

  const currentImg = images.length > 0 ? images[currentIndex] : null;
  const currentImgSrc = currentImg?.url
    ? (heroImgError ? currentImg.url : toThumbUrl(currentImg.url, 1600, 75))
    : '';

  return (
    <section className="relative h-screen w-full bg-[#151211] text-white overflow-hidden flex flex-col justify-between">
      {currentImg ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={currentIndex === 0 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 w-full h-full overflow-hidden transform-gpu"
          >
            <img
              src={currentImgSrc}
              alt={currentImg.alt || 'Indira Thakur Fine Art Photography'}
              referrerPolicy="no-referrer"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              onError={() => {
                if (!heroImgError) setHeroImgError(true);
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className="w-full h-full object-contain object-center transition-all duration-700 select-none pointer-events-auto"
              style={{ userSelect: 'none' } as React.CSSProperties}
            />
            <div
              className="absolute inset-0 z-10 bg-transparent select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2B2422] via-[#1C1817] to-[#120F0E]" />
      )}

      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#151211]/90 via-[#151211]/45 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#151211]/70 to-transparent pointer-events-none z-10" />

      {(heroData.heading || heroData.headingItalic) && (
        <div className="relative z-20 mt-auto pb-10 sm:pb-14 md:pb-16 px-6 sm:px-12 lg:px-16 xl:px-20 max-w-4xl text-left">
          <div className="space-y-4 sm:space-y-6">

            {(heroData.heading || heroData.headingItalic) && (
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-normal leading-[1.08] tracking-tight drop-shadow-md"
              >
                {heroData.heading}
                {heroData.headingItalic && (
                  <>
                    <br />
                    <span className="italic font-light text-white/80 block mt-1">
                      {heroData.headingItalic}
                    </span>
                  </>
                )}
              </motion.h1>
            )}

            {heroData.categories && heroData.categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                {heroData.categories.map((cat: string) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 font-mono text-[9px] text-white/90 uppercase tracking-[0.25em] bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C39E96]" />
                    {cat}
                  </span>
                ))}
              </motion.div>
            )}

            {(heroData.ctaText || heroData.secondaryCtaText) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3"
              >
                {heroData.ctaText && (
                  <Link
                    href={heroData.ctaLink || '/contact'}
                    className="group inline-flex items-center justify-center px-8 py-4 bg-white text-[#2B2625] font-sans text-[11px] uppercase tracking-[0.22em] font-semibold transition-all duration-300 hover:bg-[#FAF6F3] shadow-lg hover:shadow-xl"
                  >
                    <span>{heroData.ctaText}</span>
                    <span className="ml-2.5 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                )}
                {heroData.secondaryCtaText && (
                  <Link
                    href={heroData.secondaryCtaLink || '/gallery'}
                    className="group inline-flex items-center gap-2 py-3.5 font-sans text-[11px] text-white/80 uppercase tracking-[0.22em] hover:text-white transition-colors duration-300"
                  >
                    <span className="w-6 h-px bg-white/40 group-hover:w-10 transition-all duration-300" />
                    <span>{heroData.secondaryCtaText}</span>
                  </Link>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-10 right-6 sm:right-12 lg:right-16 z-20 flex items-center gap-4">
          <div className="flex items-center gap-2">
            {images.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="h-8 flex items-center cursor-pointer px-1 group"
                aria-label={`Go to photograph ${i + 1}`}
              >
                <span
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === currentIndex ? 28 : 8,
                    backgroundColor: i === currentIndex ? '#C39E96' : 'rgba(255,255,255,0.3)',
                  }}
                />
              </button>
            ))}
          </div>
          <span className="font-mono text-[10px] text-white/70 uppercase tracking-widest pl-2">
            0{currentIndex + 1} / 0{images.length}
          </span>
        </div>
      )}
    </section>
  );
}
