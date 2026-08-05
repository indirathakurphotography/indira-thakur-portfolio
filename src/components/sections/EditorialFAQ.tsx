'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface FAQItem {
  question: string;
  answer: string;
}

const defaultFaqs: FAQItem[] = [
  {
    question: 'When is the best time to schedule a newborn session?',
    answer: 'Newborn sessions are ideally conducted within the first 5 to 14 days after birth when babies sleep deeply and naturally curl into peaceful, womb-like poses. We recommend booking during your second trimester to reserve your spot around your estimated due date.'
  },
  {
    question: 'Do you provide studio wardrobe and props?',
    answer: 'Yes. Our Bangalore studio features a hand-curated collection of organic hand-knit wraps, couture maternity dresses, silk drapes, and minimalist neutral studio props. You do not need to bring anything unless you have personal family heirlooms.'
  },
  {
    question: 'Where are sessions conducted?',
    answer: 'Sessions take place either in our serene, climate-controlled studio in Bangalore or on location at hand-selected outdoor scenic landscapes during golden hour.'
  },
  {
    question: 'How and when will we receive our fine art photographs?',
    answer: 'Within two weeks of your shoot, you will receive a password-protected private proofing gallery. Fully retouched high-resolution files and museum-grade album keepsakes are delivered within 3-4 weeks.'
  }
];

export default function EditorialFAQ() {
  const { config } = useSiteConfig();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqData: any = config?.faq || {
    eyebrow: 'QUESTIONS & ANSWERS',
    heading: 'Session Details & Philosophy',
    items: defaultFaqs
  };

  const itemsList: FAQItem[] = faqData.items && faqData.items.length > 0
    ? faqData.items
    : defaultFaqs;

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
