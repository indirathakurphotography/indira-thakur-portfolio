'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import MediaUploader from '@/components/admin/MediaUploader';
import {
  HiPhoto,
  HiPlus,
  HiTrash,
  HiPencil,
  HiArrowUp,
  HiArrowDown,
  HiCheck,
  HiXMark,
  HiEye,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';
import { formatCategory, isCategoryMatch, normalizeCategory } from '@/lib/categoryUtils';

export interface AdminMediaItem {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  caption?: string;
  alt?: string;
  category?: string;
  shoot?: string;
  order?: number;
}

interface AdminMediaManagerProps {
  title?: string;
  description?: string;
  items: AdminMediaItem[];
  bucketPath?: string;
  categories?: string[];
  onAddImage?: (item: Omit<AdminMediaItem, 'id'>) => void;
  onUpdateImage?: (id: string, updated: Partial<AdminMediaItem>) => void;
  onDeleteImage?: (id: string) => void;
  onMoveImage?: (index: number, direction: 'up' | 'down') => void;
  onReorderAll?: (orderedItems: AdminMediaItem[]) => void;
  className?: string;
}

export default function AdminMediaManager({
  title = 'Media Gallery',
  description = 'Manage images, captions, categories, and presentation order. Upload new high-resolution photographs directly to Supabase storage.',
  items,
  bucketPath = 'gallery',
  categories = [],
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onMoveImage,
  className = '',
}: AdminMediaManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('');

  const effectiveCategories = (() => {
    const map = new Map<string, string>();
    const rawList = categories.length > 0
      ? categories
      : (items.map((i) => i.category).filter(Boolean) as string[]);

    rawList.forEach((c) => {
      const norm = normalizeCategory(c);
      if (norm && norm !== 'all' && !map.has(norm)) {
        map.set(norm, formatCategory(c));
      }
    });

    return Array.from(map.values());
  })();

  const currentUploadCat = uploadCategory || (selectedCategoryFilter !== 'all' ? selectedCategoryFilter : (effectiveCategories[0] || ''));

  const filteredItems = items.filter((item) => {
    if (selectedCategoryFilter === 'all') return true;
    return isCategoryMatch(item.category, selectedCategoryFilter);
  });

  // Category horizontal navigation scrolling controls
  const categoryFilterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollFilterLeft, setCanScrollFilterLeft] = useState(false);
  const [canScrollFilterRight, setCanScrollFilterRight] = useState(false);

  const updateFilterScrollState = useCallback(() => {
    const el = categoryFilterScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollFilterLeft(scrollLeft > 2);
    setCanScrollFilterRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = categoryFilterScrollRef.current;
    if (!el) return;
    updateFilterScrollState();
    el.addEventListener('scroll', updateFilterScrollState, { passive: true });
    window.addEventListener('resize', updateFilterScrollState);
    return () => {
      el.removeEventListener('scroll', updateFilterScrollState);
      window.removeEventListener('resize', updateFilterScrollState);
    };
  }, [updateFilterScrollState, effectiveCategories]);

  const scrollFilterCategories = (direction: 'left' | 'right') => {
    const el = categoryFilterScrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(200, el.clientWidth * 0.65);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (categoryFilterScrollRef.current) {
      const selectedBtn = categoryFilterScrollRef.current.querySelector<HTMLElement>(
        `[data-category-filter="${selectedCategoryFilter}"]`
      );
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedCategoryFilter]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Bar: Title & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DDD2]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96]">
              <HiPhoto className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg text-[#2B2625] font-semibold">
              {title}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#FAF6F3] border border-[#E7DDD2] text-[#7C706D]">
              {items.length} {items.length === 1 ? 'image' : 'images'}
            </span>
          </div>
          <p className="text-xs text-[#7C706D] font-sans max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {onAddImage && (
          <button
            type="button"
            onClick={() => setIsUploading(!isUploading)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B2625] hover:bg-[#1C1817] text-white text-xs font-medium uppercase tracking-wider rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <HiPlus className="w-4 h-4 text-[#C39E96]" />
            <span>{isUploading ? 'Close Uploader' : '+ Upload Photos'}</span>
          </button>
        )}
      </div>

      {/* Upload Drawer / Section */}
      {isUploading && onAddImage && (
        <div className="bg-[#FAF6F3] p-6 rounded-xl border border-[#E7DDD2] space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-serif text-sm font-semibold text-[#2B2625]">
                Upload New High-Resolution Photo
              </h4>
              <span className="text-xs font-sans text-[#7C706D]">
                Direct to Supabase storage
              </span>
            </div>

            {effectiveCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[#7C706D]">Upload Category:</span>
                <select
                  value={currentUploadCat}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white rounded border border-[#E7DDD2] text-[#2B2625] font-medium focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  {effectiveCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategory(cat)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <MediaUploader
            value=""
            folder={bucketPath}
            onChange={(url) => {
              if (url) {
                const finalCat = currentUploadCat || effectiveCategories[0] || 'Portfolio';
                onAddImage({
                  url,
                  title: `${formatCategory(finalCat)} Photography`,
                  alt: '',
                  category: finalCat,
                  order: items.length + 1,
                });
                setIsUploading(false);
              }
            }}
          />
        </div>
      )}

      {/* Category Filter Pills Container with Horizontal Navigation */}
      {effectiveCategories.length > 0 && (
        <div className="relative group/filters">
          {/* Left Scroll Button */}
          {canScrollFilterLeft && (
            <button
              type="button"
              onClick={() => scrollFilterCategories('left')}
              aria-label="Scroll categories left"
              className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-[#E7DDD2] shadow-md flex items-center justify-center text-[#2B2625] hover:bg-[#FAF6F3] hover:text-[#C39E96] hover:scale-105 transition-all cursor-pointer"
            >
              <HiChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Horizontally Scrollable Pills Bar */}
          <div
            ref={categoryFilterScrollRef}
            className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 px-1 scroll-smooth flex-nowrap [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#FAF6F3] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D6C7B8] hover:[&::-webkit-scrollbar-thumb]:bg-[#C39E96] [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#D6C7B8 #FAF6F3' }}
          >
            <button
              type="button"
              data-category-filter="all"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-[#2B2625] text-white font-medium shadow-2xs'
                  : 'bg-white text-[#7C706D] border border-[#E7DDD2] hover:text-[#2B2625] hover:bg-[#FAF6F3]'
              }`}
            >
              All Categories ({items.length})
            </button>
            {effectiveCategories.map((cat) => {
              const count = items.filter((i) => isCategoryMatch(i.category, cat)).length;
              const isSelected = isCategoryMatch(selectedCategoryFilter, cat);
              return (
                <button
                  key={cat}
                  data-category-filter={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2B2625] text-white font-medium shadow-2xs'
                      : 'bg-white text-[#7C706D] border border-[#E7DDD2] hover:text-[#2B2625] hover:bg-[#FAF6F3]'
                  }`}
                >
                  {formatCategory(cat)} ({count})
                </button>
              );
            })}
          </div>

          {/* Right Scroll Button */}
          {canScrollFilterRight && (
            <button
              type="button"
              onClick={() => scrollFilterCategories('right')}
              aria-label="Scroll categories right"
              className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-[#E7DDD2] shadow-md flex items-center justify-center text-[#2B2625] hover:bg-[#FAF6F3] hover:text-[#C39E96] hover:scale-105 transition-all cursor-pointer"
            >
              <HiChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Clean Visual Media Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7DDD2] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96] mx-auto">
            <HiPhoto className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-base text-[#2B2625] font-medium">
            No images in this category
          </h4>
          <p className="text-xs text-[#7C706D] font-sans max-w-sm mx-auto">
            Upload photographs or select "All Categories" to view and manage existing images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const originalIndex = items.findIndex((i) => i.id === item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[#E7DDD2] shadow-xs overflow-hidden flex flex-col justify-between group hover:border-[#2B2625]/60 transition-all"
              >
                {/* Image Thumbnail Container */}
                <div className="relative aspect-[4/5] bg-[#FAF6F3] overflow-hidden border-b border-[#E7DDD2]">
                  <img
                    src={item.url}
                    alt={item.alt || item.title || 'Portfolio Image'}
                    className="w-full h-full object-cover select-none group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />

                  {/* Badge: Order & Category */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-medium">
                      #{item.order || originalIndex + 1}
                    </span>
                    {item.category && (
                      <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[#2B2625] text-[10px] font-sans font-medium">
                        {formatCategory(item.category)}
                      </span>
                    )}
                  </div>

                  {/* Top Right: Reorder Quick Arrows */}
                  {onMoveImage && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onMoveImage(originalIndex, 'up')}
                        disabled={originalIndex === 0}
                        className="p-1 text-white hover:text-[#C39E96] disabled:opacity-30 cursor-pointer"
                        title="Move image earlier in order"
                      >
                        <HiArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveImage(originalIndex, 'down')}
                        disabled={originalIndex === items.length - 1}
                        className="p-1 text-white hover:text-[#C39E96] disabled:opacity-30 cursor-pointer"
                        title="Move image later in order"
                      >
                        <HiArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info & Metadata */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif text-xs font-semibold text-[#2B2625] truncate" title={item.title}>
                        {item.title || 'Untitled Photograph'}
                      </h4>
                      {item.category && (
                        <span className="text-[10px] font-mono uppercase text-[#7C706D] shrink-0">
                          {formatCategory(item.category)}
                        </span>
                      )}
                    </div>
                    {item.alt && (
                      <p className="text-[11px] font-sans text-[#7C706D] line-clamp-1" title={item.alt}>
                        {item.alt}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#E7DDD2]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans transition-colors cursor-pointer ${
                        isEditing
                          ? 'bg-[#2B2625] text-white'
                          : 'bg-[#FAF6F3] text-[#2B2625] hover:bg-[#E7DDD2]'
                      }`}
                    >
                      <HiPencil className="w-3 h-3" />
                      <span>{isEditing ? 'Close' : 'Edit'}</span>
                    </button>

                    {onDeleteImage && (
                      <button
                        type="button"
                        onClick={() => onDeleteImage(item.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete photo"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Edit Drawer */}
                {isEditing && onUpdateImage && (
                  <div className="p-4 bg-[#FAF6F3] border-t border-[#E7DDD2] space-y-3 text-xs animate-fadeIn">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-[#7C706D]">
                        Title / Shoot Name
                      </label>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => onUpdateImage(item.id, { title: e.target.value })}
                        placeholder="e.g. Newborn Bliss, Kabir's Portrait..."
                        className="w-full px-2.5 py-1.5 bg-white rounded border border-[#E7DDD2] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-[#7C706D]">
                        Category
                      </label>
                      <select
                        value={item.category || ''}
                        onChange={(e) => onUpdateImage(item.id, { category: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white rounded border border-[#E7DDD2] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      >
                        {effectiveCategories.map((c) => (
                          <option key={c} value={c}>
                            {formatCategory(c)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-[#7C706D]">
                        Alt Text (SEO & Accessibility)
                      </label>
                      <input
                        type="text"
                        value={item.alt || ''}
                        onChange={(e) => onUpdateImage(item.id, { alt: e.target.value })}
                        placeholder="Descriptive text for Google & screen readers"
                        className="w-full px-2.5 py-1.5 bg-white rounded border border-[#E7DDD2] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>

                    {/* Replace Image Action */}
                    <div className="pt-2">
                      <details className="text-[11px] font-sans text-[#7C706D]">
                        <summary className="cursor-pointer hover:text-[#2B2625] font-medium py-1">
                          Replace Photo File
                        </summary>
                        <div className="mt-2 p-2 bg-white rounded border border-[#E7DDD2]">
                          <MediaUploader
                            value={item.url}
                            folder={bucketPath}
                            onChange={(newUrl) => {
                              if (newUrl) {
                                onUpdateImage(item.id, { url: newUrl });
                              }
                            }}
                          />
                        </div>
                      </details>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#2B2625] text-white rounded text-[11px] font-medium hover:bg-[#1C1817] cursor-pointer"
                      >
                        <HiCheck className="w-3 h-3 text-[#C39E96]" />
                        <span>Done</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
