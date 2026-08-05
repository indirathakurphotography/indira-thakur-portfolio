'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCachedRawGallery, fetchGalleryImages } from '@/lib/galleryCache';
import { toThumbUrl, toSrcSet } from '@/lib/imageUrl';

function mapServiceToCategory(title: any): string {
  const str = typeof title === 'string' ? title : (typeof title === 'object' && title?.title ? String(title.title) : '');
  if (!str) return 'gallery';
  const lower = str.toLowerCase().trim();
  const map: Record<string, string> = {
    'maternity photography': 'maternity',
    'birth photography': 'newborn',
    'newborn photography': 'newborn',
    'fine art & family portraits': 'portrait',
    'baby & child photography': 'newborn',
    'events & collaborations': 'events',
  };
  if (map[lower]) return map[lower];
  if (lower.includes('maternity')) return 'maternity';
  if (lower.includes('birth') || lower.includes('newborn') || lower.includes('baby') || lower.includes('child')) return 'newborn';
  if (lower.includes('portrait') || lower.includes('fine art') || lower.includes('family')) return 'portrait';
  if (lower.includes('event') || lower.includes('collaborat') || lower.includes('brand')) return 'events';
  return lower.replace(/\s+/g, '-');
}

function getFirstCategoryCoverImage(serviceTitle: any, galleryList: any[]): string | null {
  if (!galleryList || !galleryList.length) return null;
  const title = (typeof serviceTitle === 'string' ? serviceTitle : '').toLowerCase().trim();
  if (!title) return null;

  const match = galleryList.find((img) => {
    const cat = (img.category || '').toLowerCase().trim();
    if (!cat) return false;

    if (title.includes('newborn') || title.includes('baby')) {
      return cat.includes('newborn');
    }
    if (title.includes('maternity') || title.includes('motherhood')) {
      return cat.includes('maternity');
    }
    if (title.includes('portrait') || title.includes('fine art') || title.includes('headshot')) {
      return cat.includes('portrait');
    }
    if (title.includes('event') || title.includes('gala') || title.includes('celebration')) {
      return cat.includes('event');
    }
    if (title.includes('brand') || title.includes('corporate') || title.includes('commercial')) {
      return cat.includes('brand') || cat.includes('corporate');
    }
    if (title.includes('wedding') || title.includes('nuptial') || title.includes('vow')) {
      return cat.includes('wedding');
    }
    if (title.includes('family')) {
      return cat.includes('family');
    }

    return title.includes(cat) || cat.includes(title);
  });

  return match?.src || match?.thumbnail || null;
}

export default function EditorialServices() {
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>(() => getCachedRawGallery() || []);

  useEffect(() => {
    async function fetchServicesAndGallery() {
      try {
        const servicesPromise = fetch('/api/services').then((r) => (r.ok ? r.json() : []));
        const galleryPromise = fetchGalleryImages();

        const [sData, gResult] = await Promise.all([servicesPromise, galleryPromise]);

        if (Array.isArray(sData)) setDbServices(sData);
        if (gResult.raw && gResult.raw.length > 0) setGalleryImages(gResult.raw);
      } catch (err) {
        console.error('Error fetching services/gallery data:', err);
      }
    }

    fetchServicesAndGallery();
  }, []);

  if (!dbServices.length) return null;

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
            What I Offer
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2B2625] leading-[1.05] mt-3">
            Services
          </h2>
          <div className="w-8 h-px bg-[#C39E96]/30 mx-auto my-6" />
        </motion.div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 lg:gap-8">
          {dbServices.map((service: any, i: number) => {
            const titleStr = typeof service.title === 'string' ? service.title : (typeof service.title === 'object' && service.title?.name ? service.title.name : 'Service');
            const category = mapServiceToCategory(titleStr);
            const directCover =
              typeof service.heroImage === 'string'
                ? service.heroImage
                : service.heroImage?.url ||
                  (typeof service.image === 'string' ? service.image : service.image?.url) ||
                  service.coverImage;

            const categoryCoverUrl = directCover || getFirstCategoryCoverImage(titleStr, galleryImages);

            return (
              <motion.div
                key={service._id || titleStr || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative overflow-hidden bg-[#1C1817] rounded-sm shadow-md"
              >
                <Link
                  href={`/gallery?category=${encodeURIComponent(category)}`}
                  className="block relative aspect-[3/4] md:aspect-[4/5] overflow-hidden"
                >
                  {categoryCoverUrl ? (
                    <>
                      <img
                        src={toThumbUrl(categoryCoverUrl, 512, 80)}
                        srcSet={toSrcSet(categoryCoverUrl, [384, 512, 640], 80)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={titleStr}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-[#1C1817] flex flex-col items-center justify-center p-8 text-center border border-[#C39E96]/30">
                      <div className="w-12 h-12 rounded-full border border-[#C39E96]/40 flex items-center justify-center text-[#C39E96] mb-3">
                        <span className="font-serif font-medium text-xs">IT</span>
                      </div>
                      <span className="font-serif text-lg font-light text-white/90">
                        {titleStr}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] mt-2">
                        No images available in this collection yet
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7 md:p-8 lg:p-10 text-white z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] text-white/60 uppercase tracking-[0.3em]">
                        0{i + 1}
                      </span>
                      <span className="w-6 h-px bg-white/20" />
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl md:text-3xl lg:text-4xl text-white leading-[1.15] mb-2">
                      {titleStr}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="font-sans text-[10px] text-white/70 uppercase tracking-[0.2em] group-hover:text-[#C39E96] transition-colors duration-300">
                        View Category Gallery
                      </span>
                      <span className="text-white/50 group-hover:text-[#C39E96] transition-all duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-5 sm:p-6 md:p-7 bg-white border-x border-b border-[#E7DDD2]/60">
                  <div className="flex items-center justify-between gap-4">
                    <Link
                      href={`/contact?service=${encodeURIComponent(titleStr.toLowerCase())}`}
                      className="font-sans text-[11px] text-[#2B2625] uppercase tracking-[0.25em] hover:text-[#C39E96] transition-colors duration-300 font-medium"
                    >
                      Inquire →
                    </Link>
                    {typeof service.tagline === 'string' && (
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
