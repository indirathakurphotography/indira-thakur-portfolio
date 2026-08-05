'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface TestimonialItem {
  id?: string;
  name: string;
  role?: string;
  quote: string;
  sessionType?: string;
  avatarUrl?: string;
}

function parseNameAndRole(rawName: string, rawRole?: string) {
  let name = (rawName || 'Valued Client').trim();
  let role = (rawRole || '').trim();

  // If author name contains ' - ', ' – ', or ' — ', split into name and service
  const separators = [' - ', ' – ', ' — '];
  for (const sep of separators) {
    if (name.includes(sep)) {
      const parts = name.split(sep);
      name = parts[0].trim();
      if (!role) {
        role = parts.slice(1).join(sep).trim();
      }
      break;
    }
  }

  // Format role into elegant Title Case (e.g., Wedding Photography & Videography)
  if (role) {
    role = role
      .split(' ')
      .map((word) => {
        const lower = word.toLowerCase();
        if (['&', 'and', 'for', 'in', 'at', 'of', 'a', 'an', 'the'].includes(lower)) {
          return lower === '&' ? '&' : lower;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  return { name, role };
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'default-review-1',
    name: 'Kavita & Vikram Mehta',
    role: 'Newborn & Family Session',
    quote: 'Indira has an incredible gift for capturing stillness and emotion. Her gentle handling of our 10-day-old baby and her artistic eye produced photographs that belong in a museum.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
  },
  {
    id: 'default-review-2',
    name: 'Radhika Sen',
    role: 'Fine Art Portraiture',
    quote: 'The experience was effortless, intimate, and truly luxurious. Every frame feels like a classic painting. I will cherish these portraits for the rest of my life.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200',
  },
  {
    id: 'default-review-3',
    name: 'Nikhil & Sunita Deshmukh',
    role: 'Maternity Storytelling',
    quote: 'From the initial consultation to receiving our hand-crafted album, Indira provided a serene and unforgettable service. Her work is pure poetry.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
  },
  {
    id: 'default-review-4',
    name: 'Ananya & Devraj Kapoor',
    role: 'Maternity Session',
    quote: 'Our maternity portraits are breathtaking. Indira guided us with patience and warmth, making us feel completely comfortable in front of the lens.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
  },
  {
    id: 'default-review-5',
    name: 'Dr. Sneha & Varun Iyer',
    role: 'Legacy Family Portraiture',
    quote: 'The fine-art quality of the prints and album exceeded all expectations. She captured our family bond in the most graceful way possible.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
  },
];

export default function EditorialTestimonials() {
  const { config } = useSiteConfig();
  const [dbTestimonials, setDbTestimonials] = useState<TestimonialItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function fetchDbTestimonials() {
      try {
        const res = await fetch('/api/testimonials');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: TestimonialItem[] = data
              .map((t: any) => ({
                id: t._id || t.id,
                name: t.name || t.author || 'Valued Client',
                role: t.role || '',
                quote: t.content || t.quote || t.message || '',
                sessionType: t.role || '',
                avatarUrl: t.image || t.avatarUrl || '',
              }))
              .filter((t: TestimonialItem) => t.quote && t.quote.trim().length > 0);
            setDbTestimonials(mapped);
          }
        }
      } catch (err) {
        console.error('Error fetching DB testimonials:', err);
      }
    }
    fetchDbTestimonials();
  }, []);

  const testimonialsData: any = config?.testimonials || {};
  const rawCmsList = testimonialsData.testimonials || testimonialsData.items || testimonialsData.reviews || [];

  const mappedCmsReviews: TestimonialItem[] = Array.isArray(rawCmsList)
    ? rawCmsList
        .map((t: any) => ({
          id: t.id || t._id,
          name: t.name || t.author || t.clientName || 'Valued Client',
          role: t.role || t.sessionType || '',
          quote: t.quote || t.message || t.text || t.content || '',
          sessionType: t.role || t.sessionType || '',
          avatarUrl: t.avatarUrl || t.avatar?.url || t.image?.url || (typeof t.avatar === 'string' ? t.avatar : ''),
        }))
        .filter((t: TestimonialItem) => t.quote && t.quote.trim().length > 0)
    : [];

  const combinedList = [...dbTestimonials, ...mappedCmsReviews].filter(
    (item, index, self) =>
      item.quote.trim().length > 0 && self.findIndex((o) => o.quote === item.quote) === index
  );

  const reviewsList = combinedList.length > 0 ? combinedList : DEFAULT_TESTIMONIALS;

  useEffect(() => {
    if (reviewsList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviewsList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [reviewsList.length]);

  const current = reviewsList[activeIndex] || reviewsList[0];

  if (!current || !current.quote || current.quote.trim().length === 0) {
    return null;
  }

  const { name: authorName, role: serviceName } = parseNameAndRole(current.name, current.role || current.sessionType);

  return (
    <section className="py-16 md:py-24 bg-white text-[#2B2625] relative overflow-hidden">
      <div className="container-editorial max-w-4xl mx-auto text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {testimonialsData.eyebrow && (
            <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
              {testimonialsData.eyebrow}
            </span>
          )}
          {testimonialsData.heading && (
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2B2625] leading-tight">
              {testimonialsData.heading}
            </h2>
          )}
          <div className="w-12 h-px bg-[#C39E96]/40 mx-auto my-6" />
        </motion.div>

        <div className="relative min-h-[200px] flex items-center justify-center my-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center max-w-2xl mx-auto"
            >
              <span className="font-serif text-4xl text-[#C39E96]/40 font-normal leading-none mb-2">“</span>
              <p className="font-serif italic text-base sm:text-lg md:text-xl text-[#2B2625] leading-relaxed font-normal px-4">
                {current.quote.trim()}
              </p>

              <div className="mt-8 flex items-center gap-4">
                {current.avatarUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E7DDD2] bg-[#FAF6F3] shrink-0">
                    <img
                      src={current.avatarUrl}
                      alt={current.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full border border-[#C39E96]/30 bg-[#C39E96]/10 flex items-center justify-center font-serif text-lg text-[#C39E96] font-semibold shrink-0">
                    {current.name ? current.name.charAt(0) : 'I'}
                  </div>
                )}
                <div className="text-left flex flex-col justify-center">
                  <h3 className="font-serif text-base md:text-lg font-medium text-[#2B2625] tracking-tight leading-snug">
                    {authorName}
                  </h3>
                  {serviceName && (
                    <p className="font-sans text-xs md:text-sm font-normal text-[#C39E96] mt-1 tracking-wide">
                      {serviceName}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {reviewsList.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {reviewsList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to review ${idx + 1}`}
                className="h-10 flex items-center cursor-pointer px-1"
              >
                <span
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: activeIndex === idx ? 28 : 10,
                    backgroundColor: activeIndex === idx ? '#C39E96' : '#E7DDD2',
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
