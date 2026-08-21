'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FAQ_CONTENT, FAQ_HEADINGS, type FAQEntry } from '@/lib/faqContent';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { getTypographyStyles } from '@/types/typography';

type Props = {
  scope?: keyof typeof FAQ_CONTENT;
  items?: FAQEntry[];
  initialFaqs?: FAQEntry[];
  eyebrow?: string;
  title?: string;
  className?: string;
};

export default function EditorialFAQ({ scope = 'home', items, initialFaqs, eyebrow, title, className = '' }: Props) {
  const { config } = useSiteConfig();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const sectionCopy = FAQ_HEADINGS[scope] || FAQ_HEADINGS.home;

  const eyebrowTypography = config?.faq?.eyebrowTypography;
  const headingTypography = config?.faq?.headingTypography;
  const questionTypography = config?.faq?.questionTypography;
  const answerTypography = config?.faq?.answerTypography;

  const eyebrowStyles = getTypographyStyles(eyebrowTypography, {
    defaultFamily: 'mono',
    defaultSize: 'compact',
    defaultWeight: '500',
    defaultColor: '#C39E96',
  });

  const headingStyles = getTypographyStyles(headingTypography, {
    defaultFamily: 'serif',
    defaultSize: 'huge',
    defaultWeight: '400',
    defaultColor: '#2B2625',
  });

  const questionStyles = getTypographyStyles(questionTypography, {
    defaultFamily: 'serif',
    defaultSize: 'large',
    defaultWeight: '500',
    defaultColor: '#2B2625',
  });

  const answerStyles = getTypographyStyles(answerTypography, {
    defaultFamily: 'sans',
    defaultSize: 'normal',
    defaultWeight: '400',
    defaultColor: '#7C706D',
  });
  
  const defaultItems = (items && items.length > 0) 
    ? items 
    : (initialFaqs && initialFaqs.length > 0) 
      ? initialFaqs 
      : (FAQ_CONTENT[scope] || []);

  const [itemsList, setItemsList] = useState<FAQEntry[]>(defaultItems);

  const refreshFaqs = useCallback(async () => {
    try {
      const res = await fetch(`/api/faqs?scope=${scope}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItemsList(data.map((d: any) => ({ question: d.question, answer: d.answer })));
        } else if (items && items.length > 0) {
          setItemsList(items);
        } else if (initialFaqs && initialFaqs.length > 0) {
          setItemsList(initialFaqs);
        } else {
          setItemsList(FAQ_CONTENT[scope] || []);
        }
      }
    } catch {
      // Fallback stays in place
    }
  }, [scope, items, initialFaqs]);

  useEffect(() => {
    refreshFaqs();

    const handleUpdate = () => {
      refreshFaqs();
    };

    window.addEventListener('faqs-updated', handleUpdate);
    window.addEventListener('site-config-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('faqs-updated', handleUpdate);
      window.removeEventListener('site-config-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshFaqs]);

  if (!itemsList.length) return null;

  const resolvedEyebrow = eyebrow || (scope === 'home' && config?.faq?.eyebrow) || sectionCopy.eyebrow;
  const resolvedHeading = title || (scope === 'home' && config?.faq?.heading) || sectionCopy.title;

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
          {resolvedEyebrow && (
            <span
              className={`uppercase tracking-[0.35em] block mb-2 ${eyebrowStyles.className}`}
              style={eyebrowStyles.style}
            >
              {resolvedEyebrow}
            </span>
          )}
          {resolvedHeading && (
            <h2
              className={`leading-tight ${headingStyles.className}`}
              style={headingStyles.style}
            >
              {resolvedHeading}
            </h2>
          )}
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
                  <span
                    className={questionStyles.className}
                    style={questionStyles.style}
                  >
                    {item.question}
                  </span>
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
                      <div
                        className={`px-5 sm:px-6 pb-5 sm:pb-6 pt-1 leading-relaxed border-t border-[#E7DDD2]/40 ${answerStyles.className}`}
                        style={answerStyles.style}
                      >
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
