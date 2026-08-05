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
  category: 'Featured In' | 'Trusted By';
  displayOrder: number;
  isActive: boolean;
}

const DEFAULT_BRANDS: BrandItem[] = [
  {
    _id: 'default-1',
    name: 'Vogue India',
    logo: {
      url: '',
      alt: 'Vogue India',
    },
    websiteUrl: 'https://www.vogue.in',
    category: 'Featured In',
    displayOrder: 0,
    isActive: true,
  },
  {
    _id: 'default-2',
    name: "Harper's Bazaar",
    logo: {
      url: '',
      alt: "Harper's Bazaar",
    },
    websiteUrl: 'https://www.harpersbazaar.in',
    category: 'Featured In',
    displayOrder: 1,
    isActive: true,
  },
  {
    _id: 'default-3',
    name: 'Femina India',
    logo: {
      url: '',
      alt: 'Femina India',
    },
    websiteUrl: 'https://www.femina.in',
    category: 'Featured In',
    displayOrder: 2,
    isActive: true,
  },
  {
    _id: 'default-4',
    name: 'Grazia India',
    logo: {
      url: '',
      alt: 'Grazia India',
    },
    websiteUrl: 'https://www.grazia.co.in',
    category: 'Featured In',
    displayOrder: 3,
    isActive: true,
  },
  {
    _id: 'default-5',
    name: 'Night Night',
    logo: {
      url: '',
      alt: 'Night Night',
    },
    websiteUrl: '',
    category: 'Trusted By',
    displayOrder: 4,
    isActive: true,
  },
  {
    _id: 'default-6',
    name: 'Manbhari Sarees',
    logo: {
      url: '',
      alt: 'Manbhari Sarees',
    },
    websiteUrl: '',
    category: 'Trusted By',
    displayOrder: 5,
    isActive: true,
  },
  {
    _id: 'default-7',
    name: 'Reeora',
    logo: {
      url: '',
      alt: 'Reeora',
    },
    websiteUrl: '',
    category: 'Trusted By',
    displayOrder: 6,
    isActive: true,
  },
  {
    _id: 'default-8',
    name: 'Indie Loom',
    logo: {
      url: '',
      alt: 'Indie Loom',
    },
    websiteUrl: '',
    category: 'Trusted By',
    displayOrder: 7,
    isActive: true,
  },
  {
    _id: 'default-9',
    name: 'Taj Hotels & Resorts',
    logo: {
      url: '',
      alt: 'Taj Hotels',
    },
    websiteUrl: 'https://www.tajhotels.com',
    category: 'Trusted By',
    displayOrder: 8,
    isActive: true,
  },
  {
    _id: 'default-10',
    name: 'Oberoi Luxury Hotels',
    logo: {
      url: '',
      alt: 'Oberoi Luxury Hotels',
    },
    websiteUrl: 'https://www.oberoihotels.com',
    category: 'Trusted By',
    displayOrder: 9,
    isActive: true,
  },
];

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
            if (isMounted) setBrands(data);
          } else {
            if (isMounted) setBrands(DEFAULT_BRANDS);
          }
        } else {
          if (isMounted) setBrands(DEFAULT_BRANDS);
        }
      } catch {
        if (isMounted) setBrands(DEFAULT_BRANDS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBrands();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  const activeBrands = brands.filter(b => b.isActive);
  const displayList = activeBrands.length > 0 ? activeBrands : DEFAULT_BRANDS;

  const featuredIn = displayList.filter(b => b.category === 'Featured In');
  const trustedBy = displayList.filter(b => b.category === 'Trusted By');

  // If items in one category are empty, share items gracefully
  const featuredInItems = featuredIn.length > 0 ? featuredIn : displayList;
  const trustedByItems = trustedBy.length > 0 ? trustedBy : displayList;

  return (
    <section className="py-20 md:py-28 bg-[#FAF6F3] border-t border-b border-[#E7DDD2]/60 overflow-hidden relative">
      <style jsx global>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marquee-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        .animate-marquee-slow {
          animation: marquee-left 35s linear infinite;
        }

        .animate-marquee-slow-reverse {
          animation: marquee-right 40s linear infinite;
        }

        @media (max-width: 640px) {
          .animate-marquee-slow {
            animation-duration: 50s;
          }
          .animate-marquee-slow-reverse {
            animation-duration: 55s;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#C39E96] font-medium"
          >
            Editorial & Corporate Recognition
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] tracking-tight font-light"
          >
            Brands We&apos;ve Worked With
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-sm sm:text-base text-[#7C706D] leading-relaxed"
          >
            A curated selection of leading editorial publications, media platforms, and corporate clients who have trusted Indira Thakur Photography.
          </motion.p>
        </div>

        {/* Featured In Marquee */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8 max-w-7xl mx-auto px-4 sm:px-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] font-semibold whitespace-nowrap">
              Featured In & Press
            </span>
            <div className="h-px bg-[#E7DDD2] flex-1" />
          </div>

          <MarqueeRow items={featuredInItems} speedClass="animate-marquee-slow" />
        </div>

        {/* Trusted By Marquee */}
        <div>
          <div className="flex items-center gap-4 mb-8 max-w-7xl mx-auto px-4 sm:px-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] font-semibold whitespace-nowrap">
              Trusted By Corporate Clients
            </span>
            <div className="h-px bg-[#E7DDD2] flex-1" />
          </div>

          <MarqueeRow items={trustedByItems} speedClass="animate-marquee-slow-reverse" />
        </div>
      </div>
    </section>
  );
}

function MarqueeRow({ items, speedClass }: { items: BrandItem[]; speedClass: string }) {
  if (!items || items.length === 0) return null;

  // Duplicate 4 times to guarantee smooth, seamless infinite looping across all screens
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className="relative w-full overflow-hidden group py-4">
      {/* Soft gradient edge overlays for luxury feel */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAF6F3] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAF6F3] to-transparent z-10" />

      <div
        className={`flex w-max items-center gap-16 sm:gap-20 md:gap-24 lg:gap-28 ${speedClass} group-hover:[animation-play-state:paused]`}
      >
        {duplicatedItems.map((brand, idx) => (
          <div
            key={`${brand._id}-${idx}`}
            className="shrink-0 flex items-center justify-center transition-all duration-300 group/item"
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
  );
}

function BrandLogoImage({ brand }: { brand: BrandItem }) {
  const [imageError, setImageError] = useState(false);

  // Shorten name if name is a descriptive image label
  const displayName = brand.name && brand.name.length > 30 ? 'Editorial Brands' : brand.name;

  if (imageError || !brand.logo?.url) {
    return (
      <span className="font-serif text-lg sm:text-xl md:text-2xl font-light tracking-wider text-[#2B2625]/70 hover:text-[#2B2625] transition-colors whitespace-nowrap">
        {displayName}
      </span>
    );
  }

  return (
    <div className="relative flex items-center justify-center p-1">
      <img
        src={brand.logo.url}
        alt={brand.logo.alt || displayName}
        className="max-h-10 sm:max-h-12 md:max-h-14 w-auto max-w-[180px] sm:max-w-[220px] object-contain opacity-85 group-hover/item:opacity-100 group-hover/item:scale-105 transition-all duration-300"
        loading="lazy"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
