'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface FAQItem {
  _id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export default function EditorialFAQ() {
  const { config } = useSiteConfig();
  const [dbFaqs, setDbFaqs] = useState<FAQItem[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    async function fetchDbFaqs() {
      try {
        const res = await fetch('/api/faqs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setDbFaqs(data);
          }
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      }
    }
    fetchDbFaqs();
  }, []);

  const faqData: any = config?.faq || {
    eyebrow: 'QUESTIONS & ANSWERS',
    heading: 'Session Details & Philosophy',
  };

  const cmsItems: FAQItem[] = faqData.faqs || faqData.items || [];

  // Determine final list: DB FAQs > CMS FAQs
  const rawList: FAQItem[] = dbFaqs.length > 0 ? dbFaqs : cmsItems;

  // Deduplicate itemsList by question string
  const itemsList = Array.from(
    rawList.reduce((map, item) => {
      const q = (item.question || '').trim().toLowerCase();
      if (q && !map.has(q)) {
        map.set(q, item);
      }
      return map;
    }, new Map<string, FAQItem>()).values()
  );

  return (
    <section id="faq" className="py-24 md:py-36 bg-white text-[#2B2625]">
      <div className="container-editorial max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0.95 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block font-medium mb-2">
            {faqData.eyebrow || 'QUESTIONS & ANSWERS'}
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#2B2625] leading-tight">
            {faqData.heading || 'Session Details & Philosophy'}
          </h2>
          <div className="w-10 h-px bg-[#C39E96]/40 mx-auto my-6" />
        </motion.div>

        <div className="space-y-4">
          {itemsList.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E7DDD2] rounded-sm overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.01)]"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF6F3]/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-lg md:text-xl text-[#2B2625] font-medium">
                    {item.question}
                  </span>
                  <span className="font-mono text-lg text-[#C39E96] shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 text-sm text-[#7C706D] font-sans leading-relaxed border-t border-[#E7DDD2]/40">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
