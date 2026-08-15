'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FAQ_CONTENT, FAQ_HEADINGS, type FAQEntry } from '@/lib/faqContent';

type Props = {
  scope?: keyof typeof FAQ_CONTENT;
  items?: FAQEntry[];
  initialFaqs?: FAQEntry[];
  eyebrow?: string;
  title?: string;
  className?: string;
};

export default function EditorialFAQ({ scope = 'home', items, initialFaqs, eyebrow, title, className = '' }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const sectionCopy = FAQ_HEADINGS[scope] || FAQ_HEADINGS.home;
  const itemsList = items || initialFaqs || FAQ_CONTENT[scope] || [];

  if (!itemsList.length) return null;

  return (
    <section id="faq" className={`py-16 md:py-24 bg-white text-[#2B2625] ${className}`}>
      <div className="container-editorial max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0.95 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block font-medium mb-2">
            {eyebrow || sectionCopy.eyebrow}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] leading-tight">
            {title || sectionCopy.title}
          </h2>
          <div className="w-10 h-px bg-[#C39E96]/40 mx-auto my-6" />
        </motion.div>

        <div className="space-y-3">
          {itemsList.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.question} className="bg-white border border-[#E7DDD2] rounded-sm overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF6F3]/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg md:text-xl text-[#2B2625] font-medium">{item.question}</span>
                  <span className="font-mono text-lg text-[#C39E96] shrink-0" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-sm text-[#7C706D] font-sans leading-relaxed border-t border-[#E7DDD2]/40">
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
