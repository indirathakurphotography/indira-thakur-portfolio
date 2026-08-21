'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { getTypographyStyles } from '@/types/typography';

interface TestimonialItem {
  id?: string;
  name: string;
  role?: string;
  quote: string;
  sessionType?: string;
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
          if (Array.isArray(data) && data.length > 0) {
            const mapped: TestimonialItem[] = data
              .map((t: Record<string, unknown>) => ({
                id: (t._id || t.id) as string,
                name: (t.name || t.author || 'Valued Client') as string,
                role: (t.role || '') as string,
                quote: (t.content || t.quote || t.message || '') as string,
                sessionType: (t.role || '') as string,
              }))
              .filter((t: TestimonialItem) => t.quote && t.quote.trim().length > 0);
            if (mapped.length > 0) {
              setDbTestimonials(mapped);
              return;
            }
          }
        }
        setDbTestimonials([]);
      } catch (err) {
        console.error('Error fetching DB testimonials:', err);
        setDbTestimonials([]);
      }
    }
    fetchDbTestimonials();
  }, []);

  const testimonialsData = {
    eyebrow: config?.testimonials?.eyebrow || "CLIENT PRAISE & REVIEWS",
    heading: config?.testimonials?.heading || "Words From Our Clients",
    eyebrowTypography: config?.testimonials?.eyebrowTypography,
    headingTypography: config?.testimonials?.headingTypography,
    quoteTypography: config?.testimonials?.quoteTypography,
    authorTypography: config?.testimonials?.authorTypography,
    roleTypography: config?.testimonials?.roleTypography,
  };

  const eyebrowStyles = getTypographyStyles(testimonialsData.eyebrowTypography, {
    defaultFamily: 'mono',
    defaultSize: 'compact',
    defaultWeight: '500',
    defaultColor: '#C39E96',
  });

  const headingStyles = getTypographyStyles(testimonialsData.headingTypography, {
    defaultFamily: 'serif',
    defaultSize: 'huge',
    defaultWeight: '400',
    defaultColor: '#2B2625',
  });

  const quoteStyles = getTypographyStyles(testimonialsData.quoteTypography, {
    defaultFamily: 'serif',
    defaultSize: 'large',
    defaultWeight: '400',
    defaultColor: '#2B2625',
  });

  const authorStyles = getTypographyStyles(testimonialsData.authorTypography, {
    defaultFamily: 'serif',
    defaultSize: 'normal',
    defaultWeight: '500',
    defaultColor: '#2B2625',
  });

  const roleStyles = getTypographyStyles(testimonialsData.roleTypography, {
    defaultFamily: 'sans',
    defaultSize: 'compact',
    defaultWeight: '400',
    defaultColor: '#C39E96',
  });

  const reviewsList = dbTestimonials;

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
            <span
              className={`uppercase tracking-[0.35em] block mb-3 ${eyebrowStyles.className}`}
              style={eyebrowStyles.style}
            >
              {testimonialsData.eyebrow}
            </span>
          )}
          {testimonialsData.heading && (
            <h2
              className={`leading-tight ${headingStyles.className}`}
              style={headingStyles.style}
            >
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
              <p
                className={`italic leading-relaxed px-4 ${quoteStyles.className}`}
                style={quoteStyles.style}
              >
                {current.quote.trim()}
              </p>

              <div className="mt-6 text-center flex flex-col items-center justify-center">
                <h3
                  className={`tracking-tight leading-snug ${authorStyles.className}`}
                  style={authorStyles.style}
                >
                  {authorName}
                </h3>
                {serviceName && (
                  <p
                    className={`mt-1 tracking-wide ${roleStyles.className}`}
                    style={roleStyles.style}
                  >
                    {serviceName}
                  </p>
                )}
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
