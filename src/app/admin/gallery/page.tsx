'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HiPhoto,
  HiPlus,
  HiTrash,
  HiSparkles,
  HiCheck,
  HiEye,
  HiPaintBrush,
  HiAdjustmentsHorizontal,
  HiDocumentText,
  HiArrowPath,
  HiLink,
  HiInformationCircle,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';
import {
  IGallerySettings,
  DEFAULT_GALLERY_SETTINGS,
  DEFAULT_CATEGORY_INTRODUCTIONS,
  resolveCategoryIntro,
  ICategoryIntro,
  GalleryDisplayStyle,
  GalleryThumbnailSize,
  GalleryAspectRatio,
  GalleryImageGap,
  GalleryBorderRadius,
} from '@/types/gallerySettings';
import { normalizeCategory, formatCategory, isCategoryMatch } from '@/lib/categoryUtils';
import AdminSectionHeader from '@/components/admin/AdminSectionHeader';
import AdminSectionTabs, { AdminTabItem } from '@/components/admin/AdminSectionTabs';
import AdminCard from '@/components/admin/AdminCard';
import AdminMediaManager, { AdminMediaItem } from '@/components/admin/AdminMediaManager';
import FocusedTypographyManager, { TypographyElementDef } from '@/components/admin/FocusedTypographyManager';
import GalleryThumbnailControl from '@/components/admin/GalleryThumbnailControl';
import StickySaveBar from '@/components/admin/StickySaveBar';
import type { TypographyConfig } from '@/types/typography';

interface GalleryItem {
  _id: string;
  src: string;
  thumbnail?: string;
  publicId?: string;
  alt?: string;
  title?: string;
  description?: string;
  category: string;
  featured?: boolean;
  order?: number;
}

interface ServiceItem {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  eyebrow?: string;
  description?: string;
}

interface AdminCategoryMeta {
  key: string;
  label: string;
  isServiceLinked: boolean;
  serviceTitle?: string;
  serviceId?: string;
  imageCount: number;
}

const DISPLAY_STYLES: { id: GalleryDisplayStyle; label: string; desc: string }[] = [
  {
    id: 'editorial-grid',
    label: 'Editorial Grid',
    desc: 'Asymmetric luxury editorial layout (Default)',
  },
  {
    id: 'masonry',
    label: 'Masonry Flow',
    desc: 'Fluid vertical columns respecting original image height',
  },
  {
    id: 'uniform-grid',
    label: 'Uniform Grid',
    desc: 'Clean symmetrical grid with consistent aspect ratio',
  },
  {
    id: 'large-editorial',
    label: 'Large Editorial',
    desc: 'Spacious 2-column showcase for high-impact curation',
  },
  {
    id: 'horizontal-scroll',
    label: 'Horizontal Carousel',
    desc: 'Interactive smooth sliding gallery stream',
  },
];

export default function AdminGalleryPage() {
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'typography' | 'settings'>('content');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<IGallerySettings>(DEFAULT_GALLERY_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<IGallerySettings>(DEFAULT_GALLERY_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Category intros state
  const [selectedCatKey, setSelectedCatKey] = useState<string>('all');
  const [customCatName, setCustomCatName] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);

  // Fetch Settings, Services & Photos
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/gallery-settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_GALLERY_SETTINGS, ...data });
        setSavedSettings({ ...DEFAULT_GALLERY_SETTINGS, ...data });
      }
    } catch (err) {
      console.warn('Failed to load gallery settings:', err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load services for gallery sync:', err);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gallery-images?page=1&limit=1000', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to load gallery images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchServices();
    fetchPhotos();
  }, [fetchSettings, fetchServices, fetchPhotos]);

  const hasUnsavedSettings = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setFeedback(null);
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/gallery-settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to save gallery settings to database.');
      }

      const verified = await res.json();
      setSettings(verified);
      setSavedSettings(verified);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gallery-settings-updated', { detail: verified }));
        window.dispatchEvent(new CustomEvent('site-config-updated'));
      }

      setFeedback({
        type: 'success',
        msg: 'Gallery configuration and category narratives saved successfully!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err?.message || 'Failed to save settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Compute canonical dynamic categories merged from Services + GallerySettings + Images
  const dynamicCategories: AdminCategoryMeta[] = useMemo(() => {
    const map = new Map<string, AdminCategoryMeta>();

    // 1. All
    map.set('all', {
      key: 'all',
      label: 'All Portfolio',
      isServiceLinked: false,
      imageCount: items.length,
    });

    // 2. Add categories linked from Services
    services.forEach((srv) => {
      const rawCat = srv.category || srv.title;
      const norm = normalizeCategory(rawCat);
      if (norm && norm !== 'all') {
        const count = items.filter((i) => isCategoryMatch(i.category, norm)).length;
        map.set(norm, {
          key: norm,
          label: formatCategory(rawCat),
          isServiceLinked: true,
          serviceTitle: srv.title,
          serviceId: srv._id,
          imageCount: count,
        });
      }
    });

    // 3. Add categories from GallerySettings categoryIntroductions (if not already added)
    if (settings?.categoryIntroductions) {
      Object.keys(settings.categoryIntroductions).forEach((k) => {
        const norm = normalizeCategory(k);
        if (norm && norm !== 'all' && !map.has(norm)) {
          const count = items.filter((i) => isCategoryMatch(i.category, norm)).length;
          map.set(norm, {
            key: norm,
            label: formatCategory(k),
            isServiceLinked: false,
            imageCount: count,
          });
        }
      });
    }

    // 4. Add categories from uploaded images (if not already added)
    items.forEach((img) => {
      if (img.category) {
        const norm = normalizeCategory(img.category);
        if (norm && norm !== 'all' && !map.has(norm)) {
          const count = items.filter((i) => isCategoryMatch(i.category, norm)).length;
          map.set(norm, {
            key: norm,
            label: formatCategory(img.category),
            isServiceLinked: false,
            imageCount: count,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [services, settings.categoryIntroductions, items]);

  const selectedCategoryMeta = dynamicCategories.find((c) => c.key === selectedCatKey) || dynamicCategories[0];

  // Category horizontal navigation scrolling controls
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const [canScrollNavLeft, setCanScrollNavLeft] = useState(false);
  const [canScrollNavRight, setCanScrollNavRight] = useState(false);

  const updateNavScrollState = useCallback(() => {
    const el = categoryNavRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollNavLeft(scrollLeft > 2);
    setCanScrollNavRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = categoryNavRef.current;
    if (!el) return;
    updateNavScrollState();
    el.addEventListener('scroll', updateNavScrollState, { passive: true });
    window.addEventListener('resize', updateNavScrollState);
    return () => {
      el.removeEventListener('scroll', updateNavScrollState);
      window.removeEventListener('resize', updateNavScrollState);
    };
  }, [updateNavScrollState, dynamicCategories]);

  const scrollCategoryNav = (direction: 'left' | 'right') => {
    const el = categoryNavRef.current;
    if (!el) return;
    const scrollAmount = Math.max(220, el.clientWidth * 0.65);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (categoryNavRef.current) {
      const selectedBtn = categoryNavRef.current.querySelector<HTMLElement>(`[data-category-key="${selectedCatKey}"]`);
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedCatKey]);

  // Image CRUD handlers
  const handleAddImage = async (newMedia: Omit<AdminMediaItem, 'id'>) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const targetCat = newMedia.category || (dynamicCategories.find((c) => c.key !== 'all')?.label || 'Portfolio');

      const payload = {
        src: newMedia.url,
        thumbnail: newMedia.url,
        title: newMedia.title || '',
        alt: newMedia.alt || '',
        category: targetCat,
        order: newMedia.order || items.length + 1,
      };

      const res = await fetch('/api/gallery-images', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create gallery image');
      const created = await res.json();
      setItems((prev) => [created, ...prev]);
      setFeedback({ type: 'success', msg: 'Photo added to gallery successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to add image.' });
    }
  };

  const handleUpdateImage = async (id: string, updated: Partial<AdminMediaItem>) => {
    const payload: Record<string, any> = { _id: id };
    if (typeof updated.title !== 'undefined') payload.title = updated.title;
    if (typeof updated.alt !== 'undefined') payload.alt = updated.alt;
    if (typeof updated.category !== 'undefined') payload.category = updated.category;
    if (typeof updated.url !== 'undefined') {
      payload.src = updated.url;
      payload.thumbnail = updated.url;
    }
    if (typeof updated.order !== 'undefined') payload.order = updated.order;

    // Optimistically update local items so UI responds immediately
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, ...payload } : i))
    );

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/gallery-images', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update image');
      const saved = await res.json();
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...saved } : i)));
      setFeedback({ type: 'success', msg: 'Image details updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to update image.' });
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to remove this photo from the gallery?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/gallery-images?id=${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete image');
      setItems((prev) => prev.filter((i) => i._id !== id));
      setFeedback({ type: 'success', msg: 'Image removed from gallery.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to delete image.' });
    }
  };

  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    const reordered = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setItems(reordered);

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/gallery-images/reorder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orders: reordered.map((i) => ({ _id: i._id, order: i.order })),
        }),
      });
    } catch (err) {
      console.warn('Reorder save failed in background:', err);
    }
  };

  // Category intros helpers
  const currentCategoryIntro: ICategoryIntro = useMemo(() => {
    return resolveCategoryIntro(selectedCatKey, settings);
  }, [selectedCatKey, settings]);

  const handleUpdateCurrentIntro = (field: keyof ICategoryIntro, value: string) => {
    const normKey = normalizeCategory(selectedCatKey) || 'all';
    const currentIntros = settings.categoryIntroductions || DEFAULT_CATEGORY_INTRODUCTIONS;
    const existing = currentIntros[normKey] || resolveCategoryIntro(normKey, settings);

    const updated = {
      ...settings,
      categoryIntroductions: {
        ...currentIntros,
        [normKey]: {
          ...existing,
          [field]: value,
        },
      },
    };

    if (normKey === 'all') {
      if (field === 'eyebrow') updated.eyebrow = value;
      if (field === 'heading') updated.heading = value;
      if (field === 'description') updated.subtitle = value;
    }

    setSettings(updated);
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatName.trim()) return;

    const normKey = normalizeCategory(customCatName);
    if (!normKey) return;

    const formatted = formatCategory(customCatName);
    const updatedIntros = {
      ...(settings.categoryIntroductions || {}),
      [normKey]: {
        eyebrow: formatted.toUpperCase(),
        heading: `${formatted} Portfolio`,
        description: `Fine art ${formatted.toLowerCase()} photography in Mumbai by Indira Thakur.`,
      },
    };

    setSettings({
      ...settings,
      categoryIntroductions: updatedIntros,
    });

    setSelectedCatKey(normKey);
    setCustomCatName('');
    setIsAddingCategory(false);
    setFeedback({
      type: 'success',
      msg: `Custom category "${formatted}" added. Click "Save Changes" to publish.`,
    });
  };

  const handleDeleteCustomCategory = async (catKey: string) => {
    const meta = dynamicCategories.find((c) => c.key === catKey);
    if (meta?.isServiceLinked) {
      alert(`Cannot delete "${meta.label}" here because it is linked to the active service "${meta.serviceTitle}". Manage this service in Admin → Services.`);
      return;
    }

    if (meta && meta.imageCount > 0) {
      if (!confirm(`Warning: There are ${meta.imageCount} image(s) in "${meta.label}". Deleting this category will remove its custom narrative. Existing photos will remain in the database. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete the custom category "${formatCategory(catKey)}"?`)) {
        return;
      }
    }

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/gallery-settings?category=${catKey}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete category');

      const updatedIntros = { ...(settings.categoryIntroductions || {}) };
      delete updatedIntros[catKey];
      setSettings({ ...settings, categoryIntroductions: updatedIntros });
      setSelectedCatKey('all');
      setFeedback({ type: 'success', msg: `Category "${formatCategory(catKey)}" deleted successfully.` });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error deleting category' });
    }
  };

  // Convert items to AdminMediaItem format
  const mediaItems: AdminMediaItem[] = items.map((i) => ({
    id: i._id,
    url: i.src,
    thumbnail: i.thumbnail || i.src,
    title: i.title || '',
    alt: i.alt || '',
    category: i.category || '',
    order: i.order || 0,
  }));

  const mediaCategories = dynamicCategories
    .filter((c) => c.key !== 'all')
    .map((c) => c.label);

  const typographyDefs: TypographyElementDef[] = [
    {
      id: 'galleryEyebrow',
      label: 'Category Eyebrow Tag',
      sublabel: 'Small uppercase badge rendered above portfolio titles (e.g. TODDLER & CHILD)',
      value: settings.eyebrowTypography,
      onChange: (val) =>
        setSettings({
          ...settings,
          eyebrowTypography: val,
        }),
      defaultColor: '#C39E96',
      sampleText: 'FINE ART COLLECTION',
    },
    {
      id: 'galleryHeading',
      label: 'Main Gallery Heading',
      sublabel: 'Primary hero headline text for active category portfolio view',
      value: settings.headingTypography,
      onChange: (val) =>
        setSettings({
          ...settings,
          headingTypography: val,
        }),
      defaultColor: '#2B2625',
      sampleText: 'Moments Frozen in Artistry',
    },
    {
      id: 'gallerySubtitle',
      label: 'Category Narrative / Description',
      sublabel: 'Curatorial story text describing artistic philosophy and emotion',
      value: settings.subtitleTypography,
      onChange: (val) =>
        setSettings({
          ...settings,
          subtitleTypography: val,
        }),
      defaultColor: '#5C5450',
      sampleText: 'Capturing timeless memories and family legacies with museum-grade craftsmanship.',
    },
    {
      id: 'photoCaptions',
      label: 'Photo Captions & Titles',
      sublabel: 'Artwork title text rendered on lightbox & hover cards',
      value: settings.customTypographies?.photoCaption,
      onChange: (val) =>
        setSettings({
          ...settings,
          customTypographies: {
            ...(settings.customTypographies || {}),
            photoCaption: val,
          },
        }),
      defaultColor: '#2B2625',
      sampleText: 'Fine Art Portraiture, 2026',
    },
  ];

  const tabs: AdminTabItem[] = [
    { id: 'content', label: 'Content & Categories', icon: HiDocumentText },
    { id: 'media', label: 'Photos & Upload', icon: HiPhoto, badge: items.length },
    { id: 'typography', label: 'Typography & Sizing', icon: HiPaintBrush },
    { id: 'settings', label: 'Layout & Display', icon: HiAdjustmentsHorizontal },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <AdminSectionHeader
        title="Gallery & Portfolio"
        description="Curate fine art photographs, customize category narratives, adjust typography styling, and control public gallery layout."
        previewUrl="/gallery"
        hasUnsavedChanges={hasUnsavedSettings}
        onSave={handleSaveSettings}
        isSaving={savingSettings}
      />

      {/* Tabs */}
      <AdminSectionTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline font-semibold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: CONTENT & CATEGORY INTRODUCTIONS */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <AdminCard
            title="Category Narratives & Introductions"
            description="Photography categories are synchronized from Admin → Services and custom additions. Select any category below to customize its eyebrow, heading, and story narrative."
          >
            {/* Category Selector Pills Container with Horizontal Navigation */}
            <div className="relative group/nav">
              {/* Left Scroll Button */}
              {canScrollNavLeft && (
                <button
                  type="button"
                  onClick={() => scrollCategoryNav('left')}
                  aria-label="Scroll categories left"
                  className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-[#E7DDD2] shadow-md flex items-center justify-center text-[#2B2625] hover:bg-[#FAF6F3] hover:text-[#C39E96] hover:scale-105 transition-all cursor-pointer"
                >
                  <HiChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Horizontally Scrollable Pills Bar */}
              <div
                ref={categoryNavRef}
                className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 px-1 scroll-smooth flex-nowrap [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#FAF6F3] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D6C7B8] hover:[&::-webkit-scrollbar-thumb]:bg-[#C39E96] [&::-webkit-scrollbar-thumb]:rounded-full"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#D6C7B8 #FAF6F3' }}
              >
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.key}
                    data-category-key={cat.key}
                    type="button"
                    onClick={() => setSelectedCatKey(cat.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                      selectedCatKey === cat.key
                        ? 'bg-[#2B2625] text-white font-medium shadow-2xs'
                        : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] hover:text-[#2B2625] hover:bg-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCatKey === cat.key ? 'bg-white/20 text-white' : 'bg-[#E7DDD2] text-[#5C5450]'
                    }`}>
                      {cat.imageCount}
                    </span>
                    {cat.isServiceLinked && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C39E96]/20 text-[#C39E96] font-medium uppercase tracking-wider">
                        Service
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="px-3.5 py-2 rounded-xl text-xs font-sans border border-dashed border-[#C39E96] text-[#C39E96] hover:bg-[#FAF6F3] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  + Add Custom Category
                </button>
              </div>

              {/* Right Scroll Button */}
              {canScrollNavRight && (
                <button
                  type="button"
                  onClick={() => scrollCategoryNav('right')}
                  aria-label="Scroll categories right"
                  className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-[#E7DDD2] shadow-md flex items-center justify-center text-[#2B2625] hover:bg-[#FAF6F3] hover:text-[#C39E96] hover:scale-105 transition-all cursor-pointer"
                >
                  <HiChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {isAddingCategory && (
              <form onSubmit={handleAddNewCategory} className="p-4 bg-[#FAF6F3] border border-[#C39E96]/40 rounded-xl flex items-center gap-3 animate-fadeIn">
                <input
                  type="text"
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  placeholder="e.g. Toddler, Milestone, Pre-Wedding..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2B2625] text-white text-xs rounded-lg uppercase tracking-wider font-medium hover:bg-[#1C1817] cursor-pointer"
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingCategory(false); setCustomCatName(''); }}
                  className="px-3 py-2 text-xs text-[#7C706D] hover:text-[#2B2625] cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Service-Link Info Banner */}
            {selectedCategoryMeta?.isServiceLinked && (
              <div className="p-3.5 bg-[#FAF6F3] border border-[#C39E96]/30 rounded-xl flex items-center justify-between gap-3 text-xs text-[#5C5450]">
                <div className="flex items-center gap-2">
                  <HiLink className="w-4 h-4 text-[#C39E96] shrink-0" />
                  <span>
                    Linked to Service: <strong>{selectedCategoryMeta.serviceTitle}</strong> (Slug/Key: <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#E7DDD2]">{selectedCatKey}</code>).
                  </span>
                </div>
                <span className="text-[11px] text-[#7C706D] shrink-0">
                  Auto-synced from Admin → Services
                </span>
              </div>
            )}

            {/* Intro Editor Fields */}
            <div className="bg-[#FAF6F3] p-6 rounded-xl border border-[#E7DDD2] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-[#2B2625]">
                    Editing Narrative: {formatCategory(selectedCatKey)}
                  </span>
                  <span className="text-[11px] font-mono text-[#7C706D]">
                    ({selectedCategoryMeta?.imageCount ?? 0} photos)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#7C706D]">
                    Key: {selectedCatKey}
                  </span>
                  {!selectedCategoryMeta?.isServiceLinked && selectedCatKey !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomCategory(selectedCatKey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Delete this custom category narrative"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                      <span>Delete Category</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                    Eyebrow Tag
                  </label>
                  <input
                    type="text"
                    value={currentCategoryIntro.eyebrow}
                    onChange={(e) => handleUpdateCurrentIntro('eyebrow', e.target.value)}
                    placeholder="e.g. FINE ART COLLECTION"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                    Category Heading
                  </label>
                  <input
                    type="text"
                    value={currentCategoryIntro.heading}
                    onChange={(e) => handleUpdateCurrentIntro('heading', e.target.value)}
                    placeholder="e.g. Newborn & Heritage Sessions"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Category Story / Description
                </label>
                <textarea
                  rows={3}
                  value={currentCategoryIntro.description}
                  onChange={(e) => handleUpdateCurrentIntro('description', e.target.value)}
                  placeholder="Introduce the emotion, philosophy, and artistic vision of this photography series..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 2: PHOTOS & MEDIA MANAGEMENT */}
      {activeTab === 'media' && (
        <AdminCard
          title="Curated Photography Archive"
          description="Upload new high-resolution photographs to Supabase, update captions/alt text, and manage presentation order across dynamic categories."
        >
          <AdminMediaManager
            items={mediaItems}
            bucketPath="gallery"
            categories={mediaCategories}
            onAddImage={handleAddImage}
            onUpdateImage={handleUpdateImage}
            onDeleteImage={handleDeleteImage}
            onMoveImage={handleMoveImage}
          />
        </AdminCard>
      )}

      {/* TAB 3: TYPOGRAPHY & SIZING */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <FocusedTypographyManager
            title="Gallery Typography Hierarchy"
            description="Style each element of the public gallery with precision typography, responsive sizing, and authentic luxury contrast."
            elements={typographyDefs}
          />

          <AdminCard
            title="Public Gallery Typography Preset"
            description="Overall font family styling for public portfolio headers and narratives."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#7C706D] mb-1">
                  Font Family Theme
                </label>
                <select
                  value={settings.fontFamily || 'serif'}
                  onChange={(e) =>
                    setSettings({ ...settings, fontFamily: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E7DDD2] text-[#2B2625]"
                >
                  <option value="serif">Cormorant Garamond (Editorial Serif)</option>
                  <option value="sans">Plus Jakarta Sans (Modern Clean)</option>
                  <option value="mono">JetBrains Mono (Architectural)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#7C706D] mb-1">
                  Headline Scale
                </label>
                <select
                  value={settings.headingSize || 'normal'}
                  onChange={(e) =>
                    setSettings({ ...settings, headingSize: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E7DDD2] text-[#2B2625]"
                >
                  <option value="compact">Compact (3xl - 5xl)</option>
                  <option value="normal">Normal (4xl - 6xl)</option>
                  <option value="large">Large (5xl - 7xl)</option>
                  <option value="display">Display Monumental (6xl - 8xl)</option>
                </select>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 4: LAYOUT & DISPLAY */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminCard
            title="Gallery Display Layout"
            description="Select how photographs are arranged on the public portfolio."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DISPLAY_STYLES.map((style) => {
                const isSelected = (settings.displayStyle || 'editorial-grid') === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => setSettings({ ...settings, displayStyle: style.id })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2B2625] bg-[#FAF6F3] shadow-xs'
                        : 'border-[#E7DDD2] bg-white hover:border-[#2B2625]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif text-sm font-semibold text-[#2B2625]">
                        {style.label}
                      </span>
                      {isSelected && <HiCheck className="w-4 h-4 text-[#C39E96]" />}
                    </div>
                    <p className="text-xs text-[#7C706D] leading-relaxed font-sans">
                      {style.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard
            title="Image Grid Sizing & Spacing"
            description="Configure column counts, aspect ratios, gaps, and corner rounding."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#7C706D] mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={settings.aspectRatio || '4:5'}
                  onChange={(e) =>
                    setSettings({ ...settings, aspectRatio: e.target.value as GalleryAspectRatio })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E7DDD2] text-[#2B2625]"
                >
                  <option value="original">Original Ratio</option>
                  <option value="4:5">4:5 (Editorial Portrait)</option>
                  <option value="3:4">3:4 (Classic Portrait)</option>
                  <option value="2:3">2:3 (Fine Art Film)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Cinematic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#7C706D] mb-1">
                  Desktop Columns
                </label>
                <select
                  value={settings.desktopColumns || 3}
                  onChange={(e) =>
                    setSettings({ ...settings, desktopColumns: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E7DDD2] text-[#2B2625]"
                >
                  <option value={2}>2 Columns (Spacious)</option>
                  <option value={3}>3 Columns (Standard)</option>
                  <option value={4}>4 Columns (Dense)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#7C706D] mb-1">
                  Image Gap
                </label>
                <select
                  value={settings.imageGap || 'medium'}
                  onChange={(e) =>
                    setSettings({ ...settings, imageGap: e.target.value as GalleryImageGap })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E7DDD2] text-[#2B2625]"
                >
                  <option value="none">No Gap (0px)</option>
                  <option value="small">Small (8px)</option>
                  <option value="medium">Medium (16px)</option>
                  <option value="large">Large (24px)</option>
                  <option value="extra-large">Extra Large (32px)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#7C706D] mb-1">
                  Border Radius
                </label>
                <select
                  value={settings.borderRadius || 'small'}
                  onChange={(e) =>
                    setSettings({ ...settings, borderRadius: e.target.value as GalleryBorderRadius })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E7DDD2] text-[#2B2625]"
                >
                  <option value="none">Sharp Corners (0px)</option>
                  <option value="small">Subtle Round (4px)</option>
                  <option value="medium">Medium Round (8px)</option>
                  <option value="large">Soft Round (16px)</option>
                </select>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Thumbnail Sizing"
            description="Fine-tune the display dimensions for filmstrip, preview strips, and compact cards."
          >
            <GalleryThumbnailControl
              value={settings.thumbnailSize || 'normal'}
              customValue={settings.customThumbnailSize}
              onChangePreset={(preset) =>
                setSettings({
                  ...settings,
                  thumbnailSize: preset,
                })
              }
              onChangeCustom={(custom) =>
                setSettings({
                  ...settings,
                  customThumbnailSize: custom,
                })
              }
            />
          </AdminCard>
        </div>
      )}

      {/* Sticky Save Bar */}
      <StickySaveBar
        hasUnsavedChanges={hasUnsavedSettings}
        isSaving={savingSettings}
        onSave={handleSaveSettings}
        onReset={() => setSettings(savedSettings)}
      />
    </div>
  );
}
