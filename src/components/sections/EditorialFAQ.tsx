'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FAQ_CONTENT, FAQ_HEADINGS, type FAQEntry } from '@/lib/faqContent';
import { HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';

export interface ExtendedFAQEntry extends FAQEntry {
  category?: string;
  scope?: string;
  id?: string;
  _id?: string;
  order?: number;
  sortOrder?: number;
}

type Props = {
  scope?: string;
  items?: ExtendedFAQEntry[];
  initialFaqs?: ExtendedFAQEntry[];
  eyebrow?: string;
  title?: string;
  showCategoryFilter?: boolean;
  showSearch?: boolean;
  className?: string;
};

// Friendly display labels for standard category keys
const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Questions',
  home: 'General Studio',
  general: 'General & Booking',
  maternity: 'Maternity',
  newborn: 'Newborn & Baby',
  birth: 'Birth Story',
  toddler: 'Toddler & Kids',
  family: 'Family & Heirloom',
  portrait: 'Portraits & Editorial',
  founder: 'Personal Branding',
  brand: 'Brand & Commercial',
  events: 'Weddings & Events',
  corporate: 'Corporate & Teams',
  pricing: 'Investment & Pricing',
  studio: 'Studio & Wardrobe',
};

function getCategoryLabel(cat: string): string {
  const normalized = (cat || '').toLowerCase().trim();
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function EditorialFAQ({
  scope = 'home',
  items,
  initialFaqs,
  eyebrow,
  title,
  showCategoryFilter,
  showSearch = true,
  className = '',
}: Props) {
  const isAllScope = scope === 'all' || showCategoryFilter === true;
  const sectionCopy = FAQ_HEADINGS[scope] || (isAllScope ? { eyebrow: 'QUESTIONS & ANSWERS', title: 'Frequently Asked Questions' } : FAQ_HEADINGS.home);

  const defaultItems = useMemo(() => {
    if (items && items.length > 0) return items;
    if (initialFaqs && initialFaqs.length > 0) return initialFaqs;
    if (scope !== 'all' && FAQ_CONTENT[scope]) return FAQ_CONTENT[scope];
    
    // Combine all default content if scope is 'all'
    const combined: ExtendedFAQEntry[] = [];
    Object.entries(FAQ_CONTENT).forEach(([catKey, catItems]) => {
      catItems.forEach((item) => {
        combined.push({ ...item, category: catKey, scope: catKey });
      });
    });
    return combined;
  }, [items, initialFaqs, scope]);

  const [itemsList, setItemsList] = useState<ExtendedFAQEntry[]>(defaultItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const refreshFaqs = useCallback(async () => {
    try {
      const url = isAllScope ? '/api/faqs?scope=all' : `/api/faqs?scope=${scope}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItemsList(data);
        } else if (items && items.length > 0) {
          setItemsList(items);
        } else if (initialFaqs && initialFaqs.length > 0) {
          setItemsList(initialFaqs);
        } else if (scope !== 'all' && FAQ_CONTENT[scope]) {
          setItemsList(FAQ_CONTENT[scope]);
        }
      }
    } catch {
      // Fallback state retained
    }
  }, [isAllScope, scope, items, initialFaqs]);

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

  // Extract unique categories for filter tabs
  const availableCategories = useMemo(() => {
    if (!isAllScope) return [];
    const set = new Set<string>();
    itemsList.forEach((item) => {
      const cat = (item.category || item.scope || 'general').toLowerCase().trim();
      if (cat) set.add(cat);
    });
    return ['all', ...Array.from(set)];
  }, [itemsList, isAllScope]);

  // Filter items by selected category and search query
  const filteredItems = useMemo(() => {
    return itemsList.filter((item) => {
      const cat = (item.category || item.scope || 'general').toLowerCase().trim();
      
      const matchesCategory =
        selectedCategory === 'all' ||
        cat === selectedCategory ||
        (selectedCategory === 'general' && (cat === 'home' || !item.category));

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [itemsList, selectedCategory, searchQuery]);

  if (!itemsList.length && !defaultItems.length) return null;

  return (
    <section id="faq" className={`py-16 md:py-24 bg-white text-[#2B2625] ${className}`}>
      <div className="container-editorial max-w-4xl mx-auto px-4">
        {/* Section Header */}
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

        {/* Category Pills Filter & Search (Visible on /faq page or when showCategoryFilter is active) */}
        {isAllScope && (
          <div className="mb-10 space-y-5">
            {/* Search Box */}
            {showSearch && (
              <div className="relative max-w-md mx-auto">
                <HiMagnifyingGlass className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7C706D]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g., newborn safety, wardrobe, pricing)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF6F3] border border-[#E7DDD2] rounded-full text-xs text-[#2B2625] placeholder-[#7C706D] focus:outline-none focus:ring-1 focus:ring-[#C39E96] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-[#7C706D] hover:text-[#2B2625]"
                    title="Clear search"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Category Filter Pills */}
            {availableCategories.length > 2 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {availableCategories.map((catKey) => {
                  const isActive = selectedCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => {
                        setSelectedCategory(catKey);
                        setOpenIdx(0);
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#2B2625] text-white shadow-2xs'
                          : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] hover:bg-white hover:text-[#2B2625]'
                      }`}
                    >
                      {getCategoryLabel(catKey)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Results Counter if filtered */}
        {isAllScope && (searchQuery || selectedCategory !== 'all') && (
          <div className="mb-4 text-xs font-mono text-[#7C706D] flex items-center justify-between px-1">
            <span>
              Showing {filteredItems.length} of {itemsList.length} questions
            </span>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-[#C39E96] hover:underline font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* FAQ Accordion List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]">
            <p className="font-serif text-lg text-[#2B2625]">No questions match your filter.</p>
            <p className="text-xs text-[#7C706D] mt-1">
              Try searching with different keywords or switch back to &ldquo;All Questions&rdquo;.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-[#2B2625] text-white text-xs rounded-md"
            >
              Show All Questions
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={item.question + idx}
                  className="bg-white border border-[#E7DDD2] rounded-sm overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.01)]"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF6F3]/50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif text-base sm:text-lg md:text-xl text-[#2B2625] font-medium">
                      {item.question}
                    </span>
                    <span className="font-mono text-lg text-[#C39E96] shrink-0" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
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
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-sm text-[#7C706D] font-sans leading-relaxed border-t border-[#E7DDD2]/40 whitespace-pre-line">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
