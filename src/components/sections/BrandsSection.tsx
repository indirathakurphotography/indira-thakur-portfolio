'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_BRAND_LOGOS } from '@/lib/defaultBrandLogos';

interface BrandItem {
  _id: string;
  name: string;
  logo: {
    url: string;
    alt?: string;
  };
  websiteUrl?: string;
  category: 'Featured In' | 'Trusted By';
  displayOrder: number;
  isActive: boolean;
}

const APPROVED_BRANDS: BrandItem[] = [
  {
    _id: 'brand-night-night',
    name: 'Night Night',
    logo: {
      url: DEFAULT_BRAND_LOGOS.nightNight,
      alt: 'Night Night',
    },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 0,
    isActive: true,
  },
  {
    _id: 'brand-manbhari-sarees',
    name: 'Manbhari Sarees',
    logo: {
      url: DEFAULT_BRAND_LOGOS.manbhariSarees,
      alt: 'Manbhari Sarees',
    },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 1,
    isActive: true,
  },
  {
    _id: 'brand-reeora',
    name: 'Reeora',
    logo: {
      url: DEFAULT_BRAND_LOGOS.reeora,
      alt: 'Reeora',
    },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 2,
    isActive: true,
  },
  {
    _id: 'brand-indie-loom',
    name: 'Indie Loom',
    logo: {
      url: DEFAULT_BRAND_LOGOS.indieLoom,
      alt: 'Indie Loom',
    },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 3,
    isActive: true,
  },
];

function getBrandLogoUrl(brand: BrandItem | Record<string, unknown>): string {
  if (!brand) return '';
  const b = brand as Record<string, unknown>;

  // 1. Prioritize uploaded logo URL from database/Admin Panel
  const logoObj = b.logo as { url?: string } | string | undefined;
  if (typeof logoObj === 'string' && logoObj.trim()) return logoObj.trim();
  if (typeof logoObj === 'object' && logoObj?.url && String(logoObj.url).trim()) return String(logoObj.url).trim();
  if (b.logoUrl && String(b.logoUrl).trim()) return String(b.logoUrl).trim();
  const imageObj = b.image as { url?: string } | string | undefined;
  if (typeof imageObj === 'string' && imageObj.trim()) return imageObj.trim();
  if (typeof imageObj === 'object' && imageObj?.url && String(imageObj.url).trim()) return String(imageObj.url).trim();
  if (b.imageUrl && String(b.imageUrl).trim()) return String(b.imageUrl).trim();
  if (b.src && String(b.src).trim()) return String(b.src).trim();
  if (b.url && String(b.url).trim()) return String(b.url).trim();

  // 2. Fallback to default brand logos if no custom logo was uploaded
  const nameLower = String(b.name || '').toLowerCase().trim();
  if (nameLower.includes('night')) return DEFAULT_BRAND_LOGOS.nightNight;
  if (nameLower.includes('manbhari')) return DEFAULT_BRAND_LOGOS.manbhariSarees;
  if (nameLower.includes('reeora')) return DEFAULT_BRAND_LOGOS.reeora;
  if (nameLower.includes('indie')) return DEFAULT_BRAND_LOGOS.indieLoom;

  return '';
}

export default function BrandsSection() {
  // Show the approved logos immediately, then replace them only when CMS data arrives.
  const [brands, setBrands] = useState<BrandItem[]>(APPROVED_BRANDS);

  useEffect(() => {
    let isMounted = true;
    async function loadBrands() {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const activeBrands = data.filter((b: { isActive?: boolean }) => b.isActive !== false);
            if (activeBrands.length > 0 && isMounted) {
              setBrands(activeBrands);
              return;
            }
          }
        }
        if (isMounted) setBrands(APPROVED_BRANDS);
      } catch {
        if (isMounted) setBrands(APPROVED_BRANDS);
      }
    }
    loadBrands();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="brands" className="py-20 md:py-28 bg-[#FAF6F3] border-t border-b border-[#E7DDD2]/60 overflow-hidden relative scroll-mt-24 md:scroll-mt-28">
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
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14 space-y-3">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#C39E96] font-medium block"
          >
            Client &amp; Editorial Partners
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#2B2625] tracking-tight font-light"
          >
            BRANDS I HAVE WORKED WITH
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-xs sm:text-base text-[#7C706D] leading-relaxed max-w-xl mx-auto"
          >
            A curated selection of brands and clients Indira Thakur Photography has had the pleasure of working with.
          </motion.p>
        </div>

        {/* Horizontal Scrollable Row with Navigation Controls */}
        <div className="relative">
          <HorizontalBrandsRow items={brands} />
        </div>
      </div>
    </section>
  );
}

function HorizontalBrandsRow({ items }: { items: BrandItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const duplicatedItems = [...items, ...items, ...items];

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = Math.min(scrollRef.current.clientWidth * 0.75, 400);
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative w-full group py-2">
      {/* Left scroll control arrow */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-[#E7DDD2] shadow-md flex items-center justify-center text-[#2B2625] hover:bg-white hover:text-[#C39E96] disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
        aria-label="Scroll brands left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right scroll control arrow */}
      <button
        type="button"
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-[#E7DDD2] shadow-md flex items-center justify-center text-[#2B2625] hover:bg-white hover:text-[#C39E96] disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
        aria-label="Scroll brands right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Soft gradient edge overlays for luxury feel */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FAF6F3] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FAF6F3] to-transparent z-10" />

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="overflow-x-auto overflow-y-hidden scroll-smooth py-4 px-6 no-scrollbar touch-pan-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex w-max items-center gap-12 sm:gap-16 md:gap-20 lg:gap-24 animate-marquee-slow hover:[animation-play-state:paused]">
          {duplicatedItems.map((brand, idx) => (
            <div
              key={`${brand._id || brand.name}-${idx}`}
              className="shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              {brand.websiteUrl ? (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit ${brand.name}`}
                  className="block cursor-pointer"
                >
                  <BrandLogoImage brand={brand} />
                </a>
              ) : (
                <BrandLogoImage brand={brand} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandLogoImage({ brand }: { brand: BrandItem }) {
  const [imageError, setImageError] = useState(false);

  const logoUrl = getBrandLogoUrl(brand);
  const displayName = brand.name || 'Brand';

  if (imageError || !logoUrl) {
    return (
      <span className="font-serif text-lg sm:text-xl md:text-2xl font-light tracking-wider text-[#2B2625] whitespace-nowrap">
        {displayName}
      </span>
    );
  }

  return (
    <div className="relative flex items-center justify-center p-2 h-14 sm:h-16 md:h-20 min-w-[160px] sm:min-w-[200px]">
      <img
        src={logoUrl}
        alt={brand.logo?.alt || displayName}
        className="h-full w-auto max-w-[180px] sm:max-w-[220px] md:max-w-[260px] object-contain opacity-100"
        loading="eager"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
