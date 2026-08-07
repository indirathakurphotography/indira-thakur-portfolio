'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { toThumbUrl } from '@/lib/imageUrl';

const DEFAULT_APPROVED_SERVICES = [
  {
    _id: 'srv-newborn',
    title: 'Newborn Photography',
    slug: 'newborn-photography',
    tagline: 'Gentle & Safe First Slumbers',
    description: 'Safety-certified, peaceful infant art focusing on delicate details, organic textures, and pure family connection in a climate-controlled studio.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    order: 1
  },
  {
    _id: 'srv-maternity',
    title: 'Maternity Photography',
    slug: 'maternity-photography',
    tagline: 'Graceful & Timeless Pregnancy Art',
    description: 'Celebrate the extraordinary beauty of motherhood with couture studio gowns, artistic drapery, and romantic golden-hour lighting designed to highlight your strength and glow.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    order: 2
  },
  {
    _id: 'srv-portraits',
    title: 'Portraits',
    slug: 'portraits',
    tagline: 'Timeless Heirloom Portraiture',
    description: 'Masterfully lit studio and outdoor portraiture capturing multi-generational grace, quiet intimacy, and authentic personal expression.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    order: 3
  },
  {
    _id: 'srv-wedding',
    title: 'Wedding Photography',
    slug: 'wedding-photography',
    tagline: 'Editorial Wedding Stories',
    description: 'Cinematic, documentary-style wedding coverage capturing sacred rituals, raw emotions, and grand celebrations with artistic flair.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    order: 4
  },
  {
    _id: 'srv-events',
    title: 'Events',
    slug: 'events',
    tagline: 'Milestone & Celebration Documentaries',
    description: 'Seamless event photography for family milestones, naming ceremonies, anniversaries, and high-profile gatherings.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    order: 5
  },
  {
    _id: 'srv-brand',
    title: 'Brand Collaboration',
    slug: 'brand-collaboration',
    tagline: 'Couture Brand & Editorial Storycraft',
    description: 'High-end editorial imagery, brand campaigns, and bespoke event documentaries crafted with journalistic precision and artistic flair.',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    order: 6
  }
];

function mapServiceToCategory(title: string): string {
  const map: Record<string, string> = {
    'newborn photography': 'newborn',
    'maternity photography': 'maternity',
    'portraits': 'portrait',
    'wedding photography': 'wedding',
    'events': 'events',
    'brand collaboration': 'brand collaboration',
  };
  return map[title.toLowerCase()] || title.toLowerCase().replace(/\s+/g, '-');
}

function getServiceImageUrl(service: any, categoryMap?: Record<string, string>): string {
  if (!service) return '';

  const titleKey = (service.title || '').toLowerCase().trim();

  // If service has explicit image
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
      if (imgUrl && (titleKey.includes(cat) || cat.includes(titleKey.replace(' photography', '')))) {
        return imgUrl;
      }
    }
  }

  return '';
}

export default function EditorialServices() {
  const { config } = useSiteConfig();
  const [dbServices, setDbServices] = useState<any[]>(DEFAULT_APPROVED_SERVICES);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

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

  const servicesList = dbServices;

  const servicesData = {
    eyebrow: "BESPOKE COLLECTIONS",
    heading: "Bespoke Photography Services",
    description: "Every portrait session is tailored with infinite care, artistic vision, and gentle guidance."
  };

  useEffect(() => {
    if (servicesList && servicesList.length > 0) {
      servicesList.forEach((s: any) => {
        const url = getServiceImageUrl(s, categoryMap);
        if (url) {
          const preloader = new Image();
          preloader.src = toThumbUrl(url, 800, 75);
        }
      });
    }
  }, [servicesList, categoryMap]);

  if (!servicesList.length) return null;

  return (
    <section className="py-28 md:py-40 bg-white text-[#2B2625]">
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
                    const isFailed = failedImages[service.title || i];
                    const rawUrl = isFailed ? '' : getServiceImageUrl(service, categoryMap);
                    const isRawFallback = failedImages[`raw-${service.title || i}`];
                    const imageUrl = rawUrl ? (isRawFallback ? rawUrl : toThumbUrl(rawUrl, 800, 75)) : '';

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
                                setFailedImages((prev) => ({ ...prev, [`raw-${service.title || i}`]: true }));
                              } else {
                                setFailedImages((prev) => ({ ...prev, [service.title || i]: true }));
                              }
                            }}
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
