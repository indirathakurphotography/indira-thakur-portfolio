'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toThumbUrl } from '@/lib/imageUrl';
import { normalizeCategory, formatCategory } from '@/lib/categoryUtils';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useServices } from '@/hooks/useServices';

function getServiceEyebrow(service: any): string {
  // 1. Explicit eyebrow set in CMS
  if (service?.eyebrow && typeof service.eyebrow === 'string' && service.eyebrow.trim().length > 0) {
    return service.eyebrow.trim().toUpperCase();
  }
  // 2. Explicit category set in CMS
  if (service?.category && typeof service.category === 'string' && service.category.trim().length > 0) {
    return formatCategory(service.category).toUpperCase();
  }
  // 3. Explicit tagline set in CMS
  if (service?.tagline && typeof service.tagline === 'string' && service.tagline.trim().length > 0) {
    return service.tagline.trim().toUpperCase();
  }
  // 4. Explicit subtitle set in CMS
  if (service?.subtitle && typeof service.subtitle === 'string' && service.subtitle.trim().length > 0) {
    return service.subtitle.trim().toUpperCase();
  }
  // 5. Cleanly derive from service title without assuming or hardcoding Portrait
  if (service?.title && typeof service.title === 'string' && service.title.trim().length > 0) {
    const cleanTitle = service.title.replace(/[-_\s]*photography$/i, '').trim();
    return formatCategory(cleanTitle || service.title).toUpperCase();
  }
  // 6. Neutral fallback
  return 'SERVICE';
}

function getServiceGalleryCategory(service: any): string {
  if (service?.category && typeof service.category === 'string' && service.category.trim().length > 0) {
    return normalizeCategory(service.category) || service.category.trim().toLowerCase();
  }
  if (service?.slug && typeof service.slug === 'string' && service.slug.trim().length > 0) {
    return normalizeCategory(service.slug) || service.slug.trim().toLowerCase().replace(/[-_\s]*photography$/, '');
  }
  if (service?.title && typeof service.title === 'string' && service.title.trim().length > 0) {
    return normalizeCategory(service.title) || service.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  return 'all';
}

function formatStartingPrice(price?: string): string | null {
  if (!price || typeof price !== 'string') return null;
  const trimmed = price.trim();
  if (!trimmed) return null;
  if (/^starting\s+from/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('₹')) {
    return `Starting from ${trimmed}`;
  }
  const cleanedNum = trimmed.replace(/[^\d.]/g, '');
  if (cleanedNum.length > 0 && !isNaN(Number(cleanedNum))) {
    const num = Number(cleanedNum);
    return `Starting from ₹${num.toLocaleString('en-IN')}`;
  }
  return `Starting from ₹${trimmed}`;
}

export default function EditorialServices() {
  const router = useRouter();
  const { config } = useSiteConfig();
  const { services: hookServices } = useServices();
  const prefetchedCategories = useMemo(() => new Set<string>(), []);

  const prefetchGalleryCategory = (category: string) => {
    const href = `/gallery?category=${encodeURIComponent(category)}`;
    if (prefetchedCategories.has(href)) return;
    prefetchedCategories.add(href);
    router.prefetch(href);
  };
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const cmsServices = hookServices.length > 0 ? hookServices : config?.services?.services;

  const servicesList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(cmsServices) && cmsServices.length > 0) {
      list = cmsServices;
    }
    return list.filter((s: any) => {
      const title = (s?.title || '').toLowerCase().trim();
      return title.length > 0;
    });
  }, [cmsServices]);

  const resolvedServiceImages = useMemo(() => {
    const map: Record<string, string> = {};

    servicesList.forEach((s: any, idx: number) => {
      const key = s._id || s.title || `srv-${idx}`;

      let chosenUrl = '';

      // 1. Check heroImage FIRST
      if (typeof s.heroImage === 'string' && s.heroImage.trim().length > 0) {
        chosenUrl = s.heroImage.trim();
      } else if (s.heroImage?.url && typeof s.heroImage.url === 'string' && s.heroImage.url.trim().length > 0) {
        chosenUrl = s.heroImage.url.trim();
      }
      // 2. Then check image
      else if (typeof s.image === 'string' && s.image.trim().length > 0) {
        chosenUrl = s.image.trim();
      } else if (s.image?.url && typeof s.image.url === 'string' && s.image.url.trim().length > 0) {
        chosenUrl = s.image.url.trim();
      }

      map[key] = chosenUrl;
    });

    return map;
  }, [servicesList]);

  const servicesData = {
    eyebrow: config?.services?.eyebrow || 'BESPOKE COLLECTIONS',
    heading: config?.services?.heading || 'Bespoke Photography Services',
    description: config?.services?.description || 'Every portrait session is tailored with infinite care, artistic vision, and gentle guidance.',
    customizationMessage: config?.services?.customizationMessage || 'Because every requirement is unique, we also customize our experiences for our clients.',
  };

  if (!servicesList.length) return null;

  return (
    <section className="py-20 md:py-32 bg-white text-[#2B2625]">
      <div className="container-editorial mb-12 md:mb-16 text-center max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {servicesData.eyebrow && (
            <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block font-medium">
              {servicesData.eyebrow}
            </span>
          )}
          {servicesData.heading && (
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2B2625] leading-[1.05] mt-3">
              {servicesData.heading}
            </h2>
          )}
          <div className="w-8 h-px bg-[#C39E96]/30 mx-auto my-6" />
          {servicesData.description && (
            <p className="font-sans text-sm md:text-base text-[#7C706D] leading-relaxed max-w-2xl mx-auto">
              {servicesData.description}
            </p>
          )}
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {servicesList.map((service: any, i: number) => {
            const displayEyebrow = getServiceEyebrow(service);
            const galleryCategory = getServiceGalleryCategory(service);
            const key = service._id || service.title || `srv-${i}`;
            const priceLabel = formatStartingPrice(service.price);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative flex flex-col bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl overflow-hidden hover:border-[#C39E96]/60 transition-all duration-300 shadow-2xs hover:shadow-md"
              >
                <Link
                  href={`/gallery?category=${encodeURIComponent(galleryCategory)}`}
                  onClick={(event) => {
                    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
                      event.preventDefault();
                      window.location.assign(`/gallery?category=${encodeURIComponent(galleryCategory)}`);
                    }
                  }}
                  onMouseEnter={() => prefetchGalleryCategory(galleryCategory)}
                  onFocus={() => prefetchGalleryCategory(galleryCategory)}
                  onTouchStart={() => prefetchGalleryCategory(galleryCategory)}
                  aria-label={`Open ${service.title} gallery`}
                  className="flex flex-col h-full"
                >
                  {/* Compact Thumbnail Container */}
                  <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden bg-[#1C1817]">
                    {(() => {
                      const isFailed = failedImages[key];
                      const rawUrl = isFailed ? '' : resolvedServiceImages[key];
                      const isRawFallback = failedImages[`raw-${key}`];
                      const imageUrl = rawUrl
                        ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
                            ? rawUrl
                            : (isRawFallback ? rawUrl : toThumbUrl(rawUrl, 640, 75)))
                        : '';

                      if (imageUrl) {
                        return (
                          <>
                            <img
                              src={imageUrl}
                              alt={service.image?.alt || service.title}
                              loading={i < 6 ? 'eager' : 'lazy'}
                              fetchPriority={i < 3 ? 'high' : 'auto'}
                              decoding="async"
                              onError={() => {
                                if (!isRawFallback) {
                                  setFailedImages((prev) => ({ ...prev, [`raw-${key}`]: true }));
                                } else {
                                  setFailedImages((prev) => ({ ...prev, [key]: true }));
                                }
                              }}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 protected-image"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
                          </>
                        );
                      }
                      return (
                        <div className={`w-full h-full bg-gradient-to-br ${service.gradient || 'from-[#2C1810] to-[#1A1110]'} flex items-center justify-center`}>
                          <span className="font-serif text-base text-white/40">
                            {service.title}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Eyebrow badge over thumbnail */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs font-mono text-[10px] text-white uppercase tracking-[0.2em] font-medium">
                        {displayEyebrow}
                      </span>
                    </div>

                    {/* Starting Price Pill on thumbnail */}
                    {priceLabel && (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1 rounded-full bg-[#2B2625]/90 backdrop-blur-xs font-mono text-[11px] text-white font-medium shadow-xs">
                          {priceLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl text-[#2B2625] leading-snug group-hover:text-[#A87B73] transition-colors duration-300">
                        {service.title}
                      </h3>
                      {priceLabel && (
                        <div className="mt-1.5 font-mono text-xs text-[#9B736A] font-medium tracking-wide">
                          {priceLabel}
                        </div>
                      )}
                      {service.description && (
                        <p className="font-sans text-xs sm:text-sm text-[#7C706D] line-clamp-2 leading-relaxed mt-2.5 font-normal">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E7DDD2]/70">
                      <span className="font-sans text-[11px] text-[#2B2625] uppercase tracking-[0.18em] font-medium group-hover:text-[#A87B73] transition-colors duration-300">
                        {service.cta || 'View Portfolio'}
                      </span>
                      <span className="text-[#A87B73] text-sm transform group-hover:translate-x-1.5 transition-transform duration-300">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Customization Experience Message */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-14 md:mt-20 text-center max-w-2xl mx-auto px-4"
        >
          <div className="w-8 h-px bg-[#C39E96]/40 mx-auto mb-5" />
          <p className="font-serif italic text-base sm:text-lg text-[#6D625F] leading-relaxed">
            &ldquo;{servicesData.customizationMessage}&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
