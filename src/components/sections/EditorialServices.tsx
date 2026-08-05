'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';

function mapServiceToCategory(title: string): string {
  if (!title) return 'all';
  const t = title.toLowerCase().trim();
  if (t.includes('newborn')) return 'newborn';
  if (t.includes('maternity')) return 'maternity';
  if (t.includes('portrait') || t.includes('fine art')) return 'portrait';
  if (t.includes('event')) return 'events';
  if (t.includes('wedding')) return 'wedding';
  if (t.includes('brand') || t.includes('corporate') || t.includes('collaboration')) return 'brand collaboration';
  return t.replace(/[^a-z0-9-]+/g, '-');
}

function getServiceImageUrl(service: any, categoryMap?: Record<string, string>): string {
  if (!service) return '';

  const titleKey = (service.title || '').toLowerCase().trim();

  // Extract explicit service image from database record
  let customUrl = '';
  if (typeof service.image === 'string' && service.image.trim().length > 0) customUrl = service.image.trim();
  else if (service.image?.url && typeof service.image.url === 'string' && service.image.url.trim().length > 0) customUrl = service.image.url.trim();
  else if (service.image?.src && typeof service.image.src === 'string' && service.image.src.trim().length > 0) customUrl = service.image.src.trim();
  else if (typeof service.imageUrl === 'string' && service.imageUrl.trim().length > 0) customUrl = service.imageUrl.trim();
  else if (typeof service.heroImage === 'string' && service.heroImage.trim().length > 0) customUrl = service.heroImage.trim();

  if (customUrl && !customUrl.includes('placeholder')) {
    return customUrl;
  }

  // Resolve from dynamic gallery category map if available
  if (categoryMap) {
    for (const [cat, imgUrl] of Object.entries(categoryMap)) {
      if (titleKey.includes(cat) || cat.includes(titleKey.replace(' photography', ''))) {
        return imgUrl;
      }
    }
  }

  return '';
}

export default function EditorialServices() {
  const { config } = useSiteConfig();
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, galleryRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/gallery-images?limit=100')
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          if (Array.isArray(data)) setDbServices(data);
        }

        if (galleryRes.ok) {
          const gData = await galleryRes.json();
          const items = gData.items || (Array.isArray(gData) ? gData : []);
          const map: Record<string, string> = {};
          items.forEach((item: any) => {
            if (item?.category && item?.src) {
              const catLower = item.category.toLowerCase().trim();
              if (!map[catLower]) {
                map[catLower] = item.src;
              }
            }
          });
          setCategoryMap(map);
        }
      } catch (err) {
        console.error('Error fetching services/gallery data:', err);
      }
    }
    fetchData();
  }, []);

  const servicesData: any = config?.services || {};
  const cmsServices = Array.isArray(servicesData.services) ? servicesData.services : [];

  // Merge CMS services and DB services by title
  const mergedMap = new Map<string, any>();
  for (const s of cmsServices) {
    if (s && s.title) {
      mergedMap.set(s.title.toLowerCase().trim(), s);
    }
  }
  for (const s of dbServices) {
    if (s && s.title) {
      const key = s.title.toLowerCase().trim();
      const existing = mergedMap.get(key) || {};
      mergedMap.set(key, { ...existing, ...s });
    }
  }

  const servicesList = mergedMap.size > 0 ? Array.from(mergedMap.values()) : cmsServices;

  useEffect(() => {
    if (servicesList && servicesList.length > 0) {
      servicesList.forEach((s: any) => {
        const url = getServiceImageUrl(s, categoryMap);
        if (url) {
          const preloader = new Image();
          preloader.src = url;
        }
      });
    }
  }, [servicesList]);

  const eyebrowText = servicesData.eyebrow || 'BESPOKE SERVICES & EXPERIENCES';
  const headingText = servicesData.heading || 'Tailored Photography Collections';
  const descText = servicesData.description || 'Thoughtfully curated luxury photography collections crafted with artistic precision, warmth, and quiet elegance.';

  return (
    <section className="py-28 md:py-40 bg-white text-[#2B2625]">
      <div className="container-editorial mb-14 md:mb-20 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block font-medium">
            {eyebrowText}
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2B2625] leading-[1.05] mt-3">
            {headingText}
          </h2>
          <div className="w-8 h-px bg-[#C39E96]/30 mx-auto my-6" />
          <p className="font-sans text-sm md:text-base text-[#7C706D] leading-relaxed max-w-2xl mx-auto">
            {descText}
          </p>
        </motion.div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 lg:gap-8">
          {servicesList.map((service: any, i: number) => {
            const category = mapServiceToCategory(service.title);
            return (
              <motion.div
                key={service.title || i}
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
                    const imageUrl = getServiceImageUrl(service, categoryMap);
                    if (imageUrl) {
                      return (
                        <>
                          <img
                            src={imageUrl}
                            alt={service.image?.alt || service.title}
                            loading={i < 2 ? 'eager' : 'lazy'}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
                            0{i + 1}
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
                        0{i + 1}
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

                <div className="p-5 sm:p-6 md:p-7 bg-white border-x border-b border-[#E7DDD2]/60">
                  <div className="flex items-center justify-between gap-4">
                    <Link
                      href={`/contact?service=${encodeURIComponent(service.title.toLowerCase())}`}
                      className="font-sans text-[11px] text-[#2B2625] uppercase tracking-[0.25em] hover:text-[#C39E96] transition-colors duration-300 font-medium"
                    >
                      Inquire →
                    </Link>
                    {service.tagline && (
                      <span className="font-serif italic text-xs text-[#7C706D] hidden sm:block">
                        {service.tagline}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
