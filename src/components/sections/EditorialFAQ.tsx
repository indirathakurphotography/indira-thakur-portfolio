'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  _id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

const defaultFaqs: FAQItem[] = [
  {
    question: 'When should we book you for birth photography?',
    answer: 'Please book us in your second trimester as it helps us to plan things ahead of time.'
  },
  {
    question: 'When is the best time for newborn shoot?',
    answer: "The best time to do a newborn shoot is within the first 15 days of the baby's birth."
  },
  {
    question: 'What is the best time for maternity shoot?',
    answer: 'The best time for maternity shoot is between 24 and 28 weeks.'
  },
  {
    question: "Do you provide outfits for maternity shoot?",
    answer: "No, we don't provide outfits for maternity shoot. However, we can connect you to a reliable vendor."
  },
  {
    question: 'Can you arrange for a MUA and hair stylist for the shoot?',
    answer: 'Yes, we can provide a MUA and a hair stylist.'
  },
  {
    question: 'When can we expect the photos to be delivered?',
    answer: 'The final photos are shared within 2 weeks after the shoot.'
  },
  {
    question: 'Do you have the option of photo prints or albums?',
    answer: 'Yes.'
  },
  {
    question: 'What are your charges?',
    answer: "As we provide a range of photography and videography services, the charges vary. Please fill up the contact form so we can provide you a quote that's tailored to your needs."
  },
  {
    question: 'Do you provide raw pictures?',
    answer: "We don't provide raw pictures."
  },
  {
    question: 'Do you travel for shoots?',
    answer: 'Yes, we do travel for shoots.'
  }
];

export default function EditorialFAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await fetch('/api/faqs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setFaqs(data);
          }
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      }
    }
    fetchFaqs();
  }, []);

  const itemsList = faqs.length > 0 ? faqs : defaultFaqs;

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
            QUESTIONS & ANSWERS
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#2B2625] leading-tight">
            Session Details & Philosophy
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
