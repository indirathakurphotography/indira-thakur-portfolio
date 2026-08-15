'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toThumbUrl } from '@/lib/imageUrl';
import { normalizeCategory } from '@/lib/categoryUtils';
import { useSiteConfig } from '@/hooks/useSiteConfig';

function mapServiceToCategory(service: any): string {
  const title = typeof service === 'string' ? service : service?.title || service?.category || service?.slug || '';
  const cleanTitle = (title || '').toLowerCase().trim();
  const norm = normalizeCategory(cleanTitle);

  const CANONICAL_SET = new Set(['newborn', 'maternity', 'portrait', 'wedding', 'events', 'brand']);
  if (CANONICAL_SET.has(norm)) {
    return norm;
  }
  if (cleanTitle.includes('wedding')) return 'wedding';
  if (cleanTitle.includes('newborn') || cleanTitle.includes('baby')) return 'newborn';
  if (cleanTitle.includes('maternity')) return 'maternity';
  if (cleanTitle.includes('portrait')) return 'portrait';
  if (cleanTitle.includes('event')) return 'events';
  if (cleanTitle.includes('brand') || cleanTitle.includes('commercial')) return 'brand';

  return 'portrait';
}

export default function EditorialServices() {
  const { config } = useSiteConfig();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [dbServices, setDbServices] = useState<any[]>([]);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDbServices(data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch services from /api/services:', err);
      }
    }
    fetchServices();
  }, []);

  const cmsServices = dbServices.length > 0 ? dbServices : config?.services?.services;

  const servicesList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(cmsServices) && cmsServices.length > 0) {
      list = cmsServices;
    }
    return list.filter((s: any) => {
      const title = (s?.title || '').toLowerCase().trim();
      return (
        title !== 'family photography' &&
        title !== 'family' &&
        title !== 'new photography service' &&
        !title.includes('test')
      );
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
    eyebrow: config?.services?.eyebrow || "BESPOKE COLLECTIONS",
    heading: config?.services?.heading || "Bespoke Photography Services",
    description: config?.services?.description || "Every portrait session is tailored with infinite care, artistic vision, and gentle guidance."
  };

  if (!servicesList.length) return null;

  return (
    <section className="py-20 md:py-32 bg-white text-[#2B2625]">
      <div className="container-editorial mb-14 md:mb-20 text-center max-w-3xl mx-auto">
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 lg:gap-8">
          {servicesList.map((service: any, i: number) => {
            const category = mapServiceToCategory(service);
            const key = service._id || service.title || `srv-${i}`;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative overflow-hidden bg-[#1C1817]"
              >
                <Link
                  href={`/gallery?category=${encodeURIComponent(category)}`}
                  className="block relative aspect-[3/4] md:aspect-[4/5] overflow-hidden"
                >
                  {(() => {
                    const isFailed = failedImages[key];
                    const rawUrl = isFailed ? '' : resolvedServiceImages[key];
                    const isRawFallback = failedImages[`raw-${key}`];
                    const imageUrl = rawUrl
                      ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
                          ? rawUrl
                          : (isRawFallback ? rawUrl : toThumbUrl(rawUrl, 800, 75)))
                      : '';

                    if (imageUrl) {
                      return (
                        <>
                          <img
                            src={imageUrl}
                            alt={service.image?.alt || service.title}
                            loading={i < 4 ? 'eager' : 'lazy'}
                            fetchPriority={i < 4 ? 'high' : 'auto'}
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />
                          <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:opacity-0" />
                        </>
                      );
                    }
                    return (
                      <div className={`w-full h-full bg-gradient-to-br ${service.gradient || 'from-[#2C1810] to-[#1A1110]'} flex items-center justify-center`}>
                        <div className="text-center">
<span className="font-serif text-5xl md:text-7xl text-white/20 block font-normal">
</span>
                          <span className="font-serif text-lg md:text-xl text-white/40 block mt-2">
                            {service.title}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7 md:p-8 lg:p-10 text-white">
                    <div className="flex items-center gap-3 mb-2">
<span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.3em]">
</span>
                      <span className="w-6 h-px bg-white/20" />
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl md:text-3xl lg:text-4xl text-white leading-[1.15] mb-2">
                      {service.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="font-sans text-[10px] text-white/60 uppercase tracking-[0.2em] group-hover:text-[#C39E96] transition-colors duration-300">
                        View Portfolio
                      </span>
                      <span className="text-white/40 group-hover:text-[#C39E96] transition-all duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Link>

              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
