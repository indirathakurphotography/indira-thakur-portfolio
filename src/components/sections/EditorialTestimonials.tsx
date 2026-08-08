'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';

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

  if (!role) {
    const match = name.match(/^(.*?)\s*[\-\–\—]\s*(.*)$/);
    if (match) {
      name = match[1].trim();
      role = match[2].trim();
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

const APPROVED_CLIENT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    name: 'Aanya & Vikram Mehta',
    role: 'Maternity & Newborn Session',
    quote: 'Indira has an extraordinary gift. She made us feel so comfortable during our maternity shoot and handled our 8-day-old baby with such gentle warmth. The photographs belong in an art museum!',
    sessionType: 'Maternity & Newborn Session',
  },
  {
    id: 't-2',
    name: 'Priya & Rohan Sharma',
    role: 'Newborn Storytelling',
    quote: 'The patience and care Indira showed during our newborn session was remarkable. The heirloom album we received is our family’s most cherished treasure.',
    sessionType: 'Newborn Storytelling',
  },
  {
    id: 't-3',
    name: 'Kavita Iyer',
    role: 'Fine Art Portraiture',
    quote: 'Working with Indira was an empowering experience. Her use of lighting and artistic composition created portraits that feel deeply personal yet timeless.',
    sessionType: 'Fine Art Portraiture',
  },
  {
    id: 't-4',
    name: 'Ananya & Devraj Kapoor',
    role: 'Maternity Session',
    quote: 'Our maternity portraits are breathtaking. Indira guided us with patience and warmth, making us feel completely comfortable in front of the lens.',
    sessionType: 'Maternity Session',
  },
  {
    id: 't-5',
    name: 'Nikhil & Sunita Deshmukh',
    role: 'Heritage Family Storytelling',
    quote: 'The fine-art quality of the prints and album exceeded all expectations. She captured our family bond in the most graceful way possible.',
    sessionType: 'Heritage Family Storytelling',
  },
  {
    id: 't-6',
    name: 'Heta Ganatra',
    role: 'Newborn & Family Photography',
    quote: 'We worked with Indira for a shoot to capture our newborn and a few family portraits with our older child. Despite a treacherous journey to Lonavla, Indira was calm and creative through the process. She had a soothing effect on a newborn and handled our baby so gently while ticking off most of our reference images. An absolute pleasure to work with. ♥️',
    sessionType: 'Newborn & Family Photography',
  },
  {
    id: 't-7',
    name: 'Shalaka Amrute',
    role: 'Event Photography',
    quote: 'Indira is such a pleasure to work with. Not only is she talented and delivers great results; with her, you know the photography is well taken care of and there is one less thing to worry about in a busy event. She is very patient and professional, detail oriented, and really puts you at ease throughout the photoshoot. Highly recommended for any type of event!',
    sessionType: 'Event Photography',
  },
  {
    id: 't-8',
    name: 'Parag Shah',
    role: 'Photography',
    quote: 'We had an amazing experience working with Indira (Isha)! Her professionalism, creativity, and attention to detail truly set her apart. She made us feel comfortable throughout the session and captured stunning shots that exceeded our expectations. The lighting, composition, and emotions in every photo were just perfect. The final edits were delivered on time, and the quality was outstanding. Highly recommended!',
    sessionType: 'Photography',
  },
  {
    id: 't-9',
    name: 'Antara Acharya',
    role: 'Event Photography',
    quote: "Indira's approach to photography is very creative. I saw some of her work at a recent event and would recommend her services as a photographer. ❤️",
    sessionType: 'Event Photography',
  },
  {
    id: 't-10',
    name: 'Kiran Kumar Shetty',
    role: 'Portraits, Events & Commercial Photography',
    quote: "I had the pleasure of working with Indira, and I can confidently say she is an incredibly talented and professional photographer. Her ability to capture moments with creativity, precision, and attention to detail is truly outstanding. Whether it's portraits, events, or commercial shoots, Indira has a unique eye for composition that makes every shot stand out.",
    sessionType: 'Portraits, Events & Commercial Photography',
  },
  {
    id: 't-11',
    name: 'Vishal Gupta',
    role: 'Birth & Newborn Photography',
    quote: "I recently had the pleasure of working with Indira Thakur for a birth/delivery photoshoot and newborn photoshoot of my baby girl, and I couldn't be more thrilled with the results. Indira's talent and passion for photography truly shine through in every shot. She captured beautiful and tender moments that we will cherish forever. Her professionalism, attention to detail, genuine care, and kindness made the entire experience smooth and enjoyable. She was exceptionally caring towards my baby girl and my wife throughout the entire process. Highly recommended!",
    sessionType: 'Birth & Newborn Photography',
  },
  {
    id: 't-12',
    name: 'Martina Pandia',
    role: 'Family Photography',
    quote: 'Indira was an excellent photographer. She was on time and had all the props and accessories ready for the shoot. My kids were unsettled due to the humid day, but Indira patiently waited with a smile while I settled them. It was fun to shoot with her. I strongly recommend her photography. Thank you for capturing our family’s beautiful memories to cherish! ❤️',
    sessionType: 'Family Photography',
  },
  {
    id: 't-13',
    name: 'Poonam Tiwari',
    role: 'Wedding & Event Photography',
    quote: 'I highly recommend Indira as a photographer for any event. Whether it’s a wedding or any other special occasion, she consistently delivers outstanding results. She has a great team who know how to capture the essence of any event. Working with Indira is a pleasure; she makes you feel so comfortable. We trust her and always choose her for our family’s photography needs. ❤️❤️',
    sessionType: 'Wedding & Event Photography',
  },
  {
    id: 't-14',
    name: 'Nileja Thorat',
    role: 'Photography',
    quote: 'I couldn’t stop looking at the images you sent us – they’re so good. I appreciate your efforts in capturing such powerful emotions. You bring your positive energy to every picture you take. Your photos tell the story in a way that words can’t. You’re a talented photographer, and we’re thrilled with the results. We appreciate your patience and professionalism during the photography session. You also offered excellent services, and we’ll recommend you to others. A big thank you! ❤️❤️🙌🏻',
    sessionType: 'Photography',
  },
];

export default function EditorialTestimonials() {
  const { config } = useSiteConfig();

  // Extract testimonials from siteConfig if present
  const initialConfigTestimonials = useMemo(() => {
    const cmsItems = config?.testimonials?.testimonials;
    if (Array.isArray(cmsItems) && cmsItems.length > 0) {
      return cmsItems
        .map((item: any, idx: number) => ({
          id: item._id ? String(item._id) : `cms-t-${idx}`,
          name: item.author || 'Valued Client',
          role: item.role || '',
          quote: item.quote || '',
          sessionType: item.role || '',
        }))
        .filter((t: TestimonialItem) => t.quote && t.quote.trim().length > 0);
    }
    return [];
  }, [config?.testimonials?.testimonials]);

  const [apiTestimonials, setApiTestimonials] = useState<TestimonialItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const reviewsList = useMemo(() => {
    if (apiTestimonials.length > 0) return apiTestimonials;
    if (initialConfigTestimonials.length > 0) return initialConfigTestimonials;
    return APPROVED_CLIENT_TESTIMONIALS;
  }, [apiTestimonials, initialConfigTestimonials]);

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
              setApiTestimonials(mapped);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching DB testimonials:', err);
      }
    }
    fetchDbTestimonials();
  }, []);

  const testimonialsData = {
    eyebrow: "CLIENT PRAISE & REVIEWS",
    heading: "Words From Our Families"
  };

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

              <div className="mt-6 text-center flex flex-col items-center justify-center">
                <h3 className="font-serif text-base md:text-lg font-medium text-[#2B2625] tracking-tight leading-snug">
                  {authorName}
                </h3>
                {serviceName && (
                  <p className="font-sans text-xs md:text-sm font-normal text-[#C39E96] mt-1 tracking-wide">
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
