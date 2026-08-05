'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BrandItem {
  _id: string;
  name: string;
  logo: {
    url: string;
    alt?: string;
  };
  websiteUrl?: string;
  category?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export default function BrandsSection() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadBrands() {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Keep only active brands with actual logo artwork
            const valid = data.filter((b: any) => b.isActive !== false && (b.logo?.url || b.image || b.logoUrl));
            if (isMounted) setBrands(valid);
          }
        }
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBrands();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !brands.length) {
    return null;
  }

  // Duplicate for smooth infinite marquee looping
  const duplicatedBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <section className="py-16 sm:py-20 bg-[#FAF6F3] border-t border-b border-[#E7DDD2]/60 overflow-hidden relative">
      <style jsx global>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee-slow {
          animation: marquee-left 35s linear infinite;
        }

        @media (max-width: 640px) {
          .animate-marquee-slow {
            animation-duration: 45s;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#C39E96] font-medium"
          >
            Brand Collaborations
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#2B2625] tracking-tight font-light"
          >
            Trusted By
          </motion.h2>
        </div>

        <div className="relative w-full overflow-hidden group py-4">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FAF6F3] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FAF6F3] to-transparent z-10" />

          <div className="flex w-max items-center gap-12 sm:gap-16 md:gap-20 lg:gap-24 animate-marquee-slow group-hover:[animation-play-state:paused]">
            {duplicatedBrands.map((brand, idx) => {
              const logoUrl = brand.logo?.url || (brand as any).image || (brand as any).logoUrl || '';
              if (!logoUrl) return null;

              return (
                <div
                  key={`${brand._id}-${idx}`}
                  className="shrink-0 flex items-center justify-center p-2 transition-all duration-300"
                >
                  {brand.websiteUrl ? (
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={brand.name}
                      className="block cursor-pointer"
                    >
                      <img
                        src={logoUrl}
                        alt={brand.logo?.alt || brand.name || 'Brand Logo'}
                        className="max-h-10 sm:max-h-12 md:max-h-14 w-auto max-w-[180px] sm:max-w-[220px] object-contain opacity-85 hover:opacity-100 hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <img
                      src={logoUrl}
                      alt={brand.logo?.alt || brand.name || 'Brand Logo'}
                      className="max-h-10 sm:max-h-12 md:max-h-14 w-auto max-w-[180px] sm:max-w-[220px] object-contain opacity-85 hover:opacity-100 hover:scale-105 transition-all duration-300"
                      loading="lazy"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
