'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  HiPhoto,
  HiPlus,
  HiPencil,
  HiTrash,
  HiArrowPath,
  HiCheckCircle,
  HiExclamationCircle,
  HiStar,
  HiFunnel,
  HiMagnifyingGlass,
  HiXMark,
  HiAdjustmentsHorizontal,
  HiEye,
  HiSparkles,
  HiArrowsPointingOut,
  HiSquare2Stack,
  HiViewColumns,
  HiRectangleGroup,
  HiCheck,
} from 'react-icons/hi2';
import {
  IGallerySettings,
  DEFAULT_GALLERY_SETTINGS,
  DEFAULT_CATEGORY_INTRODUCTIONS,
  resolveCategoryIntro,
  ICategoryIntro,
  GalleryDisplayStyle,
  GalleryImageInteraction,
  GalleryClickBehavior,
  GalleryAspectRatio,
  GalleryCategoryStyle,
  GalleryHeaderAlignment,
  GalleryHeaderSpacing,
  GalleryIntroWidth,
  GalleryImageGap,
  GalleryBorderRadius,
} from '@/types/gallerySettings';
import { normalizeCategory, formatCategory } from '@/lib/categoryUtils';
import { cn } from '@/lib/imageUtils';

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

const CATEGORIES = [
  'All',
  'Newborn',
  'Maternity',
  'Portrait',
  'Wedding',
  'Events',
  'Brand',
];

const DISPLAY_STYLES: {
  id: GalleryDisplayStyle;
  label: string;
  desc: string;
  badge?: string;
}[] = [
  {
    id: 'editorial-grid',
    label: 'Editorial Grid',
    desc: 'Original continuous asymmetric column grid (Default)',
    badge: 'Default',
  },
  {
    id: 'masonry',
    label: 'Masonry Flow',
    desc: 'Fluid vertical columns matching natural image heights',
  },
  {
    id: 'uniform-grid',
    label: 'Uniform Grid',
    desc: 'Clean symmetrical grid with consistent aspect ratio for all images',
  },
  {
    id: 'large-editorial',
    label: 'Large Editorial',
    desc: '2-column prominent high-impact showcase with large captions',
  },
  {
    id: 'horizontal-scroll',
    label: 'Horizontal Carousel',
    desc: 'Interactive smooth horizontal slider with scroll arrows',
  },
  {
    id: 'circular',
    label: 'Circular Fine Art',
    desc: 'Elegant circular framed portrait tokens with gold accents',
  },
  {
    id: 'polaroid',
    label: 'Polaroid & Matted Cards',
    desc: 'Fine art gallery matted print cards with crisp white borders',
  },
  {
    id: 'filmstrip',
    label: 'Filmstrip Reel',
    desc: 'Dark cinematic horizontal reel with exposure numbers',
  },
];

const INTERACTIONS: {
  id: GalleryImageInteraction;
  label: string;
  desc: string;
}[] = [
  {
    id: 'subtle-zoom',
    label: 'Subtle Zoom (Default)',
    desc: 'Smooth 1.03x gentle scale on hover',
  },
  {
    id: 'lift',
    label: 'Lift & Shadow',
    desc: 'Card lifts up with an elegant soft drop shadow',
  },
  {
    id: 'reveal',
    label: 'Dark Overlay Reveal',
    desc: 'Deep vignette darkens with smooth subtitle reveal',
  },
  {
    id: 'scroll-motion',
    label: 'Scroll Motion',
    desc: 'Smooth parallax zoom and viewport motion',
  },
  {
    id: 'circular-motion',
    label: 'Subtle Micro-Tilt',
    desc: 'Gentle tilt and scale for playful elegance',
  },
  {
    id: 'cinematic',
    label: 'Cinematic Ken-Burns',
    desc: 'Slow atmospheric zoom with radial shadow',
  },
  {
    id: 'static',
    label: 'Static / Still',
    desc: 'No movement on hover for pure stillness',
  },
];

const ASPECT_RATIOS: { id: GalleryAspectRatio; label: string; ratio: string }[] =
  [
    { id: 'original', label: 'Original', ratio: 'Natural (Default)' },
    { id: '4:5', label: '4:5 Portrait', ratio: 'Classic Fine Art' },
    { id: '3:4', label: '3:4 Portrait', ratio: 'Editorial Standard' },
    { id: '1:1', label: '1:1 Square', ratio: 'Symmetrical' },
    { id: '2:3', label: '2:3 35mm', ratio: 'Classic Photography' },
    { id: '3:2', label: '3:2 Landscape', ratio: 'Horizontal Fine Art' },
    { id: '16:9', label: '16:9 Cinema', ratio: 'Widescreen' },
  ];

const CATEGORY_STYLES: {
  id: GalleryCategoryStyle;
  label: string;
  desc: string;
}[] = [
  {
    id: 'text-tabs',
    label: 'Minimalist Text (Default)',
    desc: 'Clean typography with animated underline indicator',
  },
  {
    id: 'underline-tabs',
    label: 'Underline Tabs',
    desc: 'Classic tab bar with subtle baseline divider',
  },
  {
    id: 'pills',
    label: 'Rounded Pills',
    desc: 'Elegant pill badges with solid active fill',
  },
  {
    id: 'minimal-buttons',
    label: 'Framed Buttons',
    desc: 'Crisp bordered buttons with sharp corners',
  },
];

export default function AdminGalleryPage() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'photos'>(
    'appearance'
  );

  // Appearance CMS State
  const [settings, setSettings] = useState<IGallerySettings>(
    DEFAULT_GALLERY_SETTINGS
  );
  const [savedSettings, setSavedSettings] = useState<IGallerySettings>(
    DEFAULT_GALLERY_SETTINGS
  );
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<
    'split' | 'settings-only' | 'preview-only'
  >('split');

  // Photo Management State
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    src: '',
    thumbnail: '',
    title: '',
    alt: '',
    description: '',
    category: 'Portrait',
    featured: false,
    order: 0,
  });

  // Category Introductions Manager State
  const [selectedCatIntroKey, setSelectedCatIntroKey] = useState<string>('all');
  const [previewCategory, setPreviewCategory] = useState<string>('all');
  const [customCatInput, setCustomCatInput] = useState<string>('');
  const [isAddingCustomCat, setIsAddingCustomCat] = useState<boolean>(false);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/gallery-settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_GALLERY_SETTINGS, ...data });
        setSavedSettings({ ...DEFAULT_GALLERY_SETTINGS, ...data });
      }
    } catch (err) {
      console.warn('Failed to load gallery settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Fetch Photos
  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/gallery-images?page=1&limit=60', {
        cache: 'no-store',
      });
      if (!res.ok)
        throw new Error('Failed to connect to database for gallery images.');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(1);
    } catch (err: any) {
      setError(err?.message || 'Error fetching gallery data from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchGallery();
  }, [fetchSettings, fetchGallery]);

  const hasUnsavedSettings =
    JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || 'Failed to save gallery appearance settings'
        );
      }

      const verified = await res.json();
      setSettings(verified);
      setSavedSettings(verified);
      setFeedback({
        type: 'success',
        msg: 'Gallery appearance settings verified & saved to MongoDB!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err?.message || 'Failed to save settings to database.',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (
      confirm(
        'Reset all Gallery appearance settings back to the default Indira Thakur luxury layout?'
      )
    ) {
      setSettings(DEFAULT_GALLERY_SETTINGS);
    }
  };

  // Dynamic admin categories list (canonical + images + intros)
  const allAdminCategories = useMemo(() => {
    const defaultList = [
      'all',
      'newborn',
      'maternity',
      'portrait',
      'weddings',
      'events',
      'brand',
    ];
    const catsSet = new Set<string>(defaultList);
    items.forEach((item) => {
      if (item.category) {
        const norm = normalizeCategory(item.category);
        if (norm && norm !== 'all') catsSet.add(norm);
      }
    });
    if (settings.categoryIntroductions) {
      Object.keys(settings.categoryIntroductions).forEach((k) => {
        const norm = normalizeCategory(k);
        if (norm && norm !== 'all') catsSet.add(norm);
      });
    }
    return Array.from(catsSet);
  }, [items, settings.categoryIntroductions]);

  // Current category intro being edited
  const currentEditingIntro = useMemo(() => {
    const norm = normalizeCategory(selectedCatIntroKey) || 'all';
    return resolveCategoryIntro(norm, settings);
  }, [selectedCatIntroKey, settings]);

  const handleUpdateCategoryIntro = (
    field: 'eyebrow' | 'heading' | 'description',
    value: string
  ) => {
    const norm = normalizeCategory(selectedCatIntroKey) || 'all';
    const current =
      settings.categoryIntroductions?.[norm] ||
      resolveCategoryIntro(norm, settings);

    const updated = {
      ...current,
      [field]: value,
    };

    setSettings({
      ...settings,
      categoryIntroductions: {
        ...(settings.categoryIntroductions || {}),
        [norm]: updated,
      },
    });
  };

  const handleResetCategoryIntro = (catKey: string) => {
    const norm = normalizeCategory(catKey) || 'all';
    const defaultTemplate = DEFAULT_CATEGORY_INTRODUCTIONS[norm] || {
      eyebrow: (formatCategory(catKey) || catKey).toUpperCase(),
      heading: `${formatCategory(catKey) || catKey} Collection`,
      description:
        'Capturing timeless moments and authentic stories with elegance and care.',
    };

    setSettings({
      ...settings,
      categoryIntroductions: {
        ...(settings.categoryIntroductions || {}),
        [norm]: { ...defaultTemplate },
      },
    });
  };

  const handleClearCategoryIntroToFallback = (catKey: string) => {
    const norm = normalizeCategory(catKey) || 'all';
    if (!settings.categoryIntroductions) return;
    const updated = { ...settings.categoryIntroductions };
    delete updated[norm];
    setSettings({
      ...settings,
      categoryIntroductions: updated,
    });
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCatInput.trim();
    if (!trimmed) return;
    const norm = normalizeCategory(trimmed) || trimmed.toLowerCase();
    if (!norm) return;

    if (!settings.categoryIntroductions?.[norm]) {
      const defaultTemplate = DEFAULT_CATEGORY_INTRODUCTIONS[norm] || {
        eyebrow: trimmed.toUpperCase(),
        heading: `${trimmed} Collection`,
        description: `Dedicated ${trimmed.toLowerCase()} photography capturing genuine moments with artistic distinction.`,
      };
      setSettings({
        ...settings,
        categoryIntroductions: {
          ...(settings.categoryIntroductions || {}),
          [norm]: defaultTemplate,
        },
      });
    }

    setSelectedCatIntroKey(norm);
    setPreviewCategory(norm);
    setCustomCatInput('');
    setIsAddingCustomCat(false);
  };

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(
        `/api/gallery-images?page=${nextPage}&limit=60`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Failed to load more gallery images.');
      const data = await res.json();
      setItems((current) => [...current, ...(data.items || [])]);
      setPage(nextPage);
      setTotal(data.total || total);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err?.message || 'Unable to load more gallery images.',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      src: '',
      thumbnail: '',
      title: '',
      alt: '',
      description: '',
      category: selectedCategory !== 'All' ? selectedCategory : 'Portrait',
      featured: false,
      order: items.length,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      src: item.src || '',
      thumbnail: item.thumbnail || item.src || '',
      title: item.title || '',
      alt: item.alt || '',
      description: item.description || '',
      category: item.category || 'Portrait',
      featured: !!item.featured,
      order: typeof item.order === 'number' ? item.order : 0,
    });
    setModalOpen(true);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.src.trim()) {
      alert('Image URL is required.');
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res;
      if (editingItem) {
        res = await fetch('/api/gallery-images', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ _id: editingItem._id, ...formData }),
        });
      } else {
        res = await fetch('/api/gallery-images', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save to database');
      }

      setFeedback({
        type: 'success',
        msg: editingItem
          ? 'Image updated in database!'
          : 'New image saved to database!',
      });
      setModalOpen(false);
      fetchGallery();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err?.message || 'Database mutation error.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo from MongoDB?'))
      return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/gallery-images?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Delete failed in MongoDB');

      setFeedback({
        type: 'success',
        msg: 'Photo deleted successfully from database.',
      });
      fetchGallery();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err?.message || 'Failed to delete record.',
      });
    }
  };

  const handleToggleFeatured = async (item: GalleryItem) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/gallery-images', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ _id: item._id, featured: !item.featured }),
      });

      if (!res.ok) throw new Error('Toggle failed');
      setFeedback({
        type: 'success',
        msg: item.featured
          ? 'Removed from featured'
          : 'Marked as featured on hero!',
      });
      fetchGallery();
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Failed to update featured status.',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.length} selected photos permanently from MongoDB?`
      )
    )
      return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      for (const id of selectedIds) {
        await fetch(`/api/gallery-images?id=${id}`, {
          method: 'DELETE',
          headers,
        });
      }

      setSelectedIds([]);
      setFeedback({
        type: 'success',
        msg: `${selectedIds.length} items deleted successfully from MongoDB.`,
      });
      fetchGallery();
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Bulk delete encountered an error.',
      });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'All' ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.alt && item.alt.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  // Sample images for preview if no images loaded yet
  const samplePreviewImages =
    items.length > 0
      ? items.slice(0, 12)
      : [
          {
            _id: 'p1',
            src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
            title: 'Ethereal Maternity',
            category: 'Maternity',
          },
          {
            _id: 'p2',
            src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
            title: 'Newborn Slumber',
            category: 'Newborn',
          },
          {
            _id: 'p3',
            src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
            title: 'Fine Art Wedding',
            category: 'Wedding',
          },
          {
            _id: 'p4',
            src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
            title: 'Natural Light Maternity',
            category: 'Maternity',
          },
          {
            _id: 'p5',
            src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
            title: 'Editorial Portraiture',
            category: 'Portrait',
          },
          {
            _id: 'p6',
            src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
            title: 'Tender Beginnings',
            category: 'Newborn',
          },
        ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiPhoto className="w-3.5 h-3.5" />
            Gallery CMS & Appearance
          </div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal mt-1">
            Gallery Management & Display Settings
          </h1>
          <p className="font-sans text-xs text-[#7C706D]">
            Customize the public gallery intro texts, editorial layout styles,
            hover interactions, grid columns, and photo collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'appearance' && (
            <>
              <button
                type="button"
                onClick={handleResetSettings}
                className="px-3.5 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#7C706D] text-xs hover:text-[#2B2625] hover:bg-white transition-colors"
                title="Reset to default luxury editorial layout"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-all shadow-sm disabled:opacity-50"
              >
                <HiCheck className="w-4 h-4 text-[#C39E96]" />
                <span>
                  {settingsSaving
                    ? 'Saving to MongoDB...'
                    : hasUnsavedSettings
                      ? 'Save Appearance Changes *'
                      : 'Save Settings'}
                </span>
              </button>
            </>
          )}

          {activeTab === 'photos' && (
            <>
              <button
                onClick={fetchGallery}
                disabled={loading}
                className="p-2.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] hover:bg-white transition-colors"
                title="Refresh database records"
              >
                <HiArrowPath
                  className={`w-4 h-4 text-[#C39E96] ${loading ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-all shadow-sm"
              >
                <HiPlus className="w-4 h-4 text-[#C39E96]" />
                <span>Add New Photo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <HiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#7C706D] hover:text-[#2B2625]"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-px">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('appearance')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-[0.2em] border-b-2 transition-all',
              activeTab === 'appearance'
                ? 'border-[#2B2625] text-[#2B2625] font-semibold'
                : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
            )}
          >
            <HiAdjustmentsHorizontal className="w-4 h-4 text-[#C39E96]" />
            <span>Appearance & Display Options</span>
            {hasUnsavedSettings && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-[0.2em] border-b-2 transition-all',
              activeTab === 'photos'
                ? 'border-[#2B2625] text-[#2B2625] font-semibold'
                : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
            )}
          >
            <HiPhoto className="w-4 h-4 text-[#C39E96]" />
            <span>Photo Library ({total || items.length})</span>
          </button>
        </div>

        {activeTab === 'appearance' && (
          <div className="hidden lg:flex items-center gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
            <button
              onClick={() => setPreviewMode('settings-only')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded',
                previewMode === 'settings-only'
                  ? 'bg-white text-[#2B2625] shadow-2xs font-semibold'
                  : 'text-[#7C706D] hover:text-[#2B2625]'
              )}
            >
              Controls Only
            </button>
            <button
              onClick={() => setPreviewMode('split')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded',
                previewMode === 'split'
                  ? 'bg-white text-[#2B2625] shadow-2xs font-semibold'
                  : 'text-[#7C706D] hover:text-[#2B2625]'
              )}
            >
              Side-by-Side Live
            </button>
            <button
              onClick={() => setPreviewMode('preview-only')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded',
                previewMode === 'preview-only'
                  ? 'bg-white text-[#2B2625] shadow-2xs font-semibold'
                  : 'text-[#7C706D] hover:text-[#2B2625]'
              )}
            >
              Preview Only
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPEARANCE & DISPLAY SETTINGS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div
          className={cn(
            'grid gap-8',
            previewMode === 'split'
              ? 'lg:grid-cols-12'
              : previewMode === 'settings-only'
                ? 'grid-cols-1 max-w-4xl mx-auto'
                : 'grid-cols-1'
          )}
        >
          {/* Controls Column */}
          {previewMode !== 'preview-only' && (
            <div
              className={cn(
                'space-y-8',
                previewMode === 'split' ? 'lg:col-span-7' : 'w-full'
              )}
            >
              {/* SECTION 1: GLOBAL HEADER & INTRO CONTENT */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625]">
                      1. Global Gallery Header & Introduction (Default)
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D]">
                      Default global header settings when viewing all collections or when a category has no custom intro.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">
                    Global Header CMS
                  </span>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1">
                      Global Eyebrow Text (Small Uppercase Tag)
                    </label>
                    <input
                      type="text"
                      value={settings.eyebrow}
                      onChange={(e) =>
                        setSettings({ ...settings, eyebrow: e.target.value })
                      }
                      placeholder="e.g. PORTFOLIO"
                      className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1">
                      Global Main Heading (Display Title)
                    </label>
                    <input
                      type="text"
                      value={settings.heading}
                      onChange={(e) =>
                        setSettings({ ...settings, heading: e.target.value })
                      }
                      placeholder="e.g. The Gallery"
                      className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] font-serif text-base focus:bg-white focus:outline-none focus:border-[#2B2625]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1">
                      Global Subtitle / Intro Copy
                    </label>
                    <textarea
                      rows={3}
                      value={settings.subtitle}
                      onChange={(e) =>
                        setSettings({ ...settings, subtitle: e.target.value })
                      }
                      placeholder="Where vision becomes visual language and every detail carries meaning..."
                      className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] font-serif focus:bg-white focus:outline-none focus:border-[#2B2625]"
                    />
                    <p className="text-[11px] text-[#7C706D]/70 mt-1">
                      Tip: You can use line breaks to create balanced editorial
                      two-line sentences.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-[#2B2625] font-medium mb-1.5">
                        Header Alignment
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                        {(['left', 'center', 'right'] as GalleryHeaderAlignment[]).map(
                          (align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  headerAlignment: align,
                                })
                              }
                              className={cn(
                                'py-1.5 text-[11px] capitalize rounded font-medium transition-colors',
                                settings.headerAlignment === align
                                  ? 'bg-white text-[#2B2625] shadow-xs'
                                  : 'text-[#7C706D] hover:text-[#2B2625]'
                              )}
                            >
                              {align}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#2B2625] font-medium mb-1.5">
                        Header Spacing
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                        {(['compact', 'normal', 'spacious'] as GalleryHeaderSpacing[]).map(
                          (sp) => (
                            <button
                              key={sp}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  headerSpacing: sp,
                                })
                              }
                              className={cn(
                                'py-1.5 text-[10px] capitalize rounded font-medium transition-colors',
                                settings.headerSpacing === sp
                                  ? 'bg-white text-[#2B2625] shadow-xs'
                                  : 'text-[#7C706D] hover:text-[#2B2625]'
                              )}
                            >
                              {sp}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#2B2625] font-medium mb-1.5">
                        Intro Text Width
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                        {(['narrow', 'medium', 'wide'] as GalleryIntroWidth[]).map(
                          (w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() =>
                                setSettings({ ...settings, introWidth: w })
                              }
                              className={cn(
                                'py-1.5 text-[10px] capitalize rounded font-medium transition-colors',
                                settings.introWidth === w
                                  ? 'bg-white text-[#2B2625] shadow-xs'
                                  : 'text-[#7C706D] hover:text-[#2B2625]'
                              )}
                            >
                              {w}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CATEGORY INTRODUCTIONS MANAGER */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625] flex items-center gap-2">
                      <span>2. Category Introductions Manager</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#C39E96]/20 text-[#2B2625] font-semibold">
                        Category-Wise
                      </span>
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D] mt-0.5">
                      Provide separate Eyebrow, Heading, and Introduction/Description for every individual Gallery category.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider shrink-0">
                    Category CMS
                  </span>
                </div>

                {/* Category Selection Tabs & Add Button */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[#2B2625] font-sans text-xs font-semibold uppercase tracking-wider">
                      Select Category to Edit:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomCat(!isAddingCustomCat)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-[#C39E96] hover:text-[#2B2625] transition-colors font-medium"
                    >
                      <HiPlus className="w-3.5 h-3.5" />
                      <span>{isAddingCustomCat ? 'Cancel' : '+ Add Custom Category'}</span>
                    </button>
                  </div>

                  {isAddingCustomCat && (
                    <div className="flex items-center gap-2 bg-[#FAF6F3] p-3 rounded-lg border border-[#E7DDD2]">
                      <input
                        type="text"
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        placeholder="e.g. Couples, Family, Commercial"
                        className="flex-1 px-3 py-1.5 rounded-md border border-[#E7DDD2] bg-white text-xs text-[#2B2625] focus:outline-none focus:border-[#2B2625]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        disabled={!customCatInput.trim()}
                        className="px-3 py-1.5 rounded-md bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  )}

                  {/* Horizontal Category Pill Selector */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {allAdminCategories.map((catKey) => {
                      const isSelected =
                        normalizeCategory(selectedCatIntroKey) ===
                        normalizeCategory(catKey);
                      const hasCustom =
                        !!settings.categoryIntroductions?.[
                          normalizeCategory(catKey)
                        ];

                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            setSelectedCatIntroKey(catKey);
                            setPreviewCategory(catKey);
                          }}
                          className={cn(
                            'px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border',
                            isSelected
                              ? 'bg-[#2B2625] text-white border-[#2B2625] shadow-xs font-semibold'
                              : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                          )}
                        >
                          <span>
                            {catKey === 'all'
                              ? 'ALL (Global)'
                              : formatCategory(catKey) || catKey.toUpperCase()}
                          </span>
                          {hasCustom && (
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isSelected ? 'bg-[#C39E96]' : 'bg-[#C39E96]'
                              )}
                              title="Customized content"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Category Intro Form */}
                <div className="bg-[#FAF6F3]/70 p-5 rounded-xl border border-[#E7DDD2] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E7DDD2]/60 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-[#C39E96] font-semibold tracking-wider">
                        Now Editing Category:
                      </span>
                      <span className="font-serif text-sm font-semibold text-[#2B2625]">
                        {selectedCatIntroKey === 'all'
                          ? 'ALL (Default / Global Gallery)'
                          : formatCategory(selectedCatIntroKey) ||
                            selectedCatIntroKey.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleResetCategoryIntro(selectedCatIntroKey)
                        }
                        className="text-[11px] font-sans text-[#7C706D] hover:text-[#2B2625] underline decoration-dotted"
                      >
                        Reset to Default Template
                      </button>
                      {selectedCatIntroKey !== 'all' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleClearCategoryIntroToFallback(
                              selectedCatIntroKey
                            )
                          }
                          className="text-[11px] font-sans text-rose-600 hover:text-rose-700 underline decoration-dotted ml-2"
                        >
                          Clear to Global Fallback
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    {/* Eyebrow */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#2B2625] font-medium">
                          Category Eyebrow Tag
                        </label>
                        <span className="font-mono text-[10px] text-[#7C706D]/70 uppercase">
                          e.g. {(formatCategory(selectedCatIntroKey) || selectedCatIntroKey).toUpperCase()}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={currentEditingIntro.eyebrow}
                        onChange={(e) =>
                          handleUpdateCategoryIntro('eyebrow', e.target.value)
                        }
                        placeholder={`e.g. ${(formatCategory(selectedCatIntroKey) || selectedCatIntroKey).toUpperCase()}`}
                        className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] font-mono text-xs focus:outline-none focus:border-[#2B2625]"
                      />
                    </div>

                    {/* Heading */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#2B2625] font-medium">
                          Category Heading (Display Title)
                        </label>
                        <span className="font-mono text-[10px] text-[#7C706D]/70 uppercase">
                          Main editorial title
                        </span>
                      </div>
                      <input
                        type="text"
                        value={currentEditingIntro.heading}
                        onChange={(e) =>
                          handleUpdateCategoryIntro('heading', e.target.value)
                        }
                        placeholder={`e.g. ${
                          DEFAULT_CATEGORY_INTRODUCTIONS[
                            normalizeCategory(selectedCatIntroKey)
                          ]?.heading || 'Collection Showcase'
                        }`}
                        className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] font-serif text-base focus:outline-none focus:border-[#2B2625]"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#2B2625] font-medium">
                          Category Introduction / Description
                        </label>
                        <span className="font-mono text-[10px] text-[#7C706D]/70 uppercase">
                          Editorial prose
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={currentEditingIntro.description}
                        onChange={(e) =>
                          handleUpdateCategoryIntro(
                            'description',
                            e.target.value
                          )
                        }
                        placeholder={`e.g. ${
                          DEFAULT_CATEGORY_INTRODUCTIONS[
                            normalizeCategory(selectedCatIntroKey)
                          ]?.description || 'Capturing timeless moments...'
                        }`}
                        className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] font-serif text-xs leading-relaxed focus:outline-none focus:border-[#2B2625]"
                      />
                      <p className="text-[11px] text-[#7C706D]/70 mt-1">
                        Tip: Line breaks create balanced two-line editorial subtitles on desktop displays.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Overview Grid of All Categories */}
                <div className="space-y-3 pt-2">
                  <span className="block font-mono text-[10px] text-[#7C706D] uppercase tracking-wider">
                    All Categories Overview & Fast Switcher
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {allAdminCategories.map((catKey) => {
                      const intro = resolveCategoryIntro(catKey, settings);
                      const isSelected =
                        normalizeCategory(selectedCatIntroKey) ===
                        normalizeCategory(catKey);

                      return (
                        <div
                          key={catKey}
                          onClick={() => {
                            setSelectedCatIntroKey(catKey);
                            setPreviewCategory(catKey);
                          }}
                          className={cn(
                            'p-3 rounded-lg border text-left cursor-pointer transition-all group',
                            isSelected
                              ? 'border-[#2B2625] bg-[#FAF6F3] ring-1 ring-[#2B2625]'
                              : 'border-[#E7DDD2]/70 bg-white hover:border-[#2B2625]'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider font-semibold">
                              {intro.eyebrow || (formatCategory(catKey) || catKey).toUpperCase()}
                            </span>
                            <span className="text-[9px] font-mono text-[#7C706D]/70 uppercase">
                              {catKey === 'all' ? 'All' : formatCategory(catKey) || catKey}
                            </span>
                          </div>
                          <h4 className="font-serif text-xs font-semibold text-[#2B2625] truncate">
                            {intro.heading}
                          </h4>
                          <p className="font-serif text-[11px] text-[#7C706D] line-clamp-2 mt-0.5 leading-snug">
                            {intro.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: DISPLAY STYLE & LAYOUT ARCHETYPE */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625]">
                      3. Gallery Display Style & Layout
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D]">
                      Select the primary presentation format for portfolio
                      photographs.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">
                    8 Layout Styles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DISPLAY_STYLES.map((style) => {
                    const isSelected = settings.displayStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, displayStyle: style.id })
                        }
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between group',
                          isSelected
                            ? 'border-[#2B2625] bg-[#FAF6F3] ring-1 ring-[#2B2625]'
                            : 'border-[#E7DDD2]/70 hover:border-[#2B2625] bg-white'
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-serif text-sm text-[#2B2625] font-medium">
                              {style.label}
                            </span>
                            {style.badge && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#C39E96]/20 text-[#2B2625] font-semibold">
                                {style.badge}
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xs text-[#7C706D] leading-relaxed">
                            {style.desc}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider">
                          <span
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                              isSelected
                                ? 'border-[#2B2625] bg-[#2B2625] text-white'
                                : 'border-[#E7DDD2]'
                            )}
                          >
                            {isSelected && <HiCheck className="w-2.5 h-2.5" />}
                          </span>
                          <span
                            className={
                              isSelected ? 'text-[#2B2625]' : 'text-[#7C706D]'
                            }
                          >
                            {isSelected ? 'Active Layout' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: IMAGE INTERACTION & HOVER EFFECTS */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625]">
                      4. Hover & Image Interactions
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D]">
                      Define the subtle micro-animation applied when visitors
                      hover over photography cards.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">
                    Hover Effects
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTERACTIONS.map((item) => {
                    const isSelected = settings.imageInteraction === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            imageInteraction: item.id,
                          })
                        }
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-[#2B2625] bg-[#FAF6F3] ring-1 ring-[#2B2625]'
                            : 'border-[#E7DDD2]/70 hover:border-[#2B2625] bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-xs text-[#2B2625] font-medium">
                            {item.label}
                          </span>
                          <span
                            className={cn(
                              'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
                              isSelected
                                ? 'border-[#2B2625] bg-[#2B2625] text-white'
                                : 'border-[#E7DDD2]'
                            )}
                          >
                            {isSelected && <HiCheck className="w-2 h-2" />}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-[#7C706D] mt-1 leading-snug">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: ASPECT RATIO & CLICK BEHAVIOR */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625]">
                      5. Aspect Ratio & Click Behavior
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D]">
                      Configure image framing proportions and interaction
                      triggers.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">
                    Aspect & Actions
                  </span>
                </div>

                <div className="space-y-5 text-xs">
                  <div>
                    <label className="block text-[#2B2625] font-medium mb-2">
                      Image Aspect Ratio
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() =>
                            setSettings({ ...settings, aspectRatio: ar.id })
                          }
                          className={cn(
                            'p-2.5 rounded-lg border text-center transition-colors',
                            settings.aspectRatio === ar.id
                              ? 'border-[#2B2625] bg-[#FAF6F3] text-[#2B2625] font-semibold'
                              : 'border-[#E7DDD2] bg-white text-[#7C706D] hover:border-[#2B2625]'
                          )}
                        >
                          <span className="block font-mono text-[11px]">
                            {ar.label}
                          </span>
                          <span className="block text-[9px] text-[#7C706D] mt-0.5">
                            {ar.ratio}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#2B2625] font-medium mb-2">
                      Card Click Behavior
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'lightbox' as GalleryClickBehavior,
                          label: 'Open Lightbox (Default)',
                          desc: 'Opens full-screen luxury viewer with arrow & keyboard controls',
                        },
                        {
                          id: 'full-image' as GalleryClickBehavior,
                          label: 'Open Full Image',
                          desc: 'Opens high-res photography modal view',
                        },
                        {
                          id: 'none' as GalleryClickBehavior,
                          label: 'No Click / Static',
                          desc: 'Disables modal click triggers',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              clickBehavior: item.id,
                            })
                          }
                          className={cn(
                            'p-3 rounded-lg border text-left transition-colors',
                            settings.clickBehavior === item.id
                              ? 'border-[#2B2625] bg-[#FAF6F3] text-[#2B2625]'
                              : 'border-[#E7DDD2] bg-white text-[#7C706D] hover:border-[#2B2625]'
                          )}
                        >
                          <span className="font-serif font-medium text-xs block">
                            {item.label}
                          </span>
                          <span className="font-sans text-[10px] text-[#7C706D] mt-1 block">
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 6: GRID COLUMNS, GAP & BORDER RADIUS */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625]">
                      6. Grid Columns, Spacing & Border Radius
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D]">
                      Fine-tune responsive columns, card gaps, and edge corners.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">
                    Grid Control
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1.5">
                      Desktop Columns
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                      {[2, 3, 4, 5].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              desktopColumns: cols as 2 | 3 | 4 | 5,
                            })
                          }
                          className={cn(
                            'py-1.5 text-center font-mono rounded transition-colors',
                            settings.desktopColumns === cols
                              ? 'bg-white text-[#2B2625] shadow-xs font-semibold'
                              : 'text-[#7C706D] hover:text-[#2B2625]'
                          )}
                        >
                          {cols} col
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1.5">
                      Tablet Columns
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                      {[2, 3, 4].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              tabletColumns: cols as 2 | 3 | 4,
                            })
                          }
                          className={cn(
                            'py-1.5 text-center font-mono rounded transition-colors',
                            settings.tabletColumns === cols
                              ? 'bg-white text-[#2B2625] shadow-xs font-semibold'
                              : 'text-[#7C706D] hover:text-[#2B2625]'
                          )}
                        >
                          {cols} col
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1.5">
                      Mobile Columns
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                      {[1, 2].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              mobileColumns: cols as 1 | 2,
                            })
                          }
                          className={cn(
                            'py-1.5 text-center font-mono rounded transition-colors',
                            settings.mobileColumns === cols
                              ? 'bg-white text-[#2B2625] shadow-xs font-semibold'
                              : 'text-[#7C706D] hover:text-[#2B2625]'
                          )}
                        >
                          {cols} col
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs pt-2">
                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1.5">
                      Image Gap Spacing
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                      {(['small', 'medium', 'large'] as GalleryImageGap[]).map(
                        (gap) => (
                          <button
                            key={gap}
                            type="button"
                            onClick={() =>
                              setSettings({ ...settings, imageGap: gap })
                            }
                            className={cn(
                              'py-1.5 text-center capitalize rounded font-medium transition-colors',
                              settings.imageGap === gap
                                ? 'bg-white text-[#2B2625] shadow-xs'
                                : 'text-[#7C706D] hover:text-[#2B2625]'
                            )}
                          >
                            {gap}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#2B2625] font-medium mb-1.5">
                      Border Radius
                    </label>
                    <div className="grid grid-cols-5 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                      {(['none', 'small', 'medium', 'large', 'full'] as GalleryBorderRadius[]).map(
                        (rad) => (
                          <button
                            key={rad}
                            type="button"
                            onClick={() =>
                              setSettings({ ...settings, borderRadius: rad })
                            }
                            className={cn(
                              'py-1.5 text-center capitalize text-[10px] rounded font-medium transition-colors',
                              settings.borderRadius === rad
                                ? 'bg-white text-[#2B2625] shadow-xs'
                                : 'text-[#7C706D] hover:text-[#2B2625]'
                            )}
                          >
                            {rad}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 7: CATEGORY FILTER TABS PRESENTATION */}
              <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-6">
                <div className="border-b border-[#E7DDD2]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#2B2625]">
                      7. Category Filter Presentation
                    </h2>
                    <p className="font-sans text-xs text-[#7C706D]">
                      Select how categories (Newborn, Maternity, Portrait, etc.)
                      are displayed to visitors.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">
                    Filter Tabs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORY_STYLES.map((catStyle) => {
                    const isSelected = settings.categoryStyle === catStyle.id;
                    return (
                      <button
                        key={catStyle.id}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            categoryStyle: catStyle.id,
                          })
                        }
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-[#2B2625] bg-[#FAF6F3] ring-1 ring-[#2B2625]'
                            : 'border-[#E7DDD2]/70 hover:border-[#2B2625] bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-xs text-[#2B2625] font-medium">
                            {catStyle.label}
                          </span>
                          <span
                            className={cn(
                              'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
                              isSelected
                                ? 'border-[#2B2625] bg-[#2B2625] text-white'
                                : 'border-[#E7DDD2]'
                            )}
                          >
                            {isSelected && <HiCheck className="w-2 h-2" />}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-[#7C706D] mt-1 leading-snug">
                          {catStyle.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[#E7DDD2] shadow-lg flex items-center justify-between">
                <div>
                  <span className="font-serif text-xs text-[#2B2625] font-medium block">
                    {hasUnsavedSettings
                      ? 'You have unsaved appearance changes.'
                      : 'All changes are synchronized with MongoDB.'}
                  </span>
                  <span className="font-sans text-[10px] text-[#7C706D]">
                    Click save to update the live public gallery instantly.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="px-3 py-2 text-xs text-[#7C706D] hover:text-[#2B2625]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="px-5 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-all shadow-sm disabled:opacity-50"
                  >
                    {settingsSaving ? 'Saving...' : 'Save & Verify Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Column */}
          {previewMode !== 'settings-only' && (
            <div
              className={cn(
                'space-y-4',
                previewMode === 'split' ? 'lg:col-span-5' : 'w-full'
              )}
            >
              <div className="sticky top-6 bg-white p-5 rounded-xl border border-[#E7DDD2]/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-3">
                  <div className="flex items-center gap-2">
                    <HiEye className="w-4 h-4 text-[#C39E96]" />
                    <span className="font-serif text-sm text-[#2B2625] font-medium">
                      Real-Time Live Preview
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-[#FAF6F3] border border-[#E7DDD2] text-[#7C706D]">
                    {settings.displayStyle}
                  </span>
                </div>

                {/* Mini Preview Canvas */}
                <div className="bg-[#FAF6F3]/50 p-4 rounded-lg border border-[#E7DDD2]/60 overflow-hidden max-h-[750px] overflow-y-auto space-y-6">
                  {/* Category switcher indicator in preview */}
                  <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-2">
                    <span className="font-mono text-[9px] text-[#7C706D] uppercase">
                      Category Simulation:
                    </span>
                    <span className="font-mono text-[9px] text-[#C39E96] uppercase font-semibold">
                      {previewCategory === 'all'
                        ? 'All Collections'
                        : formatCategory(previewCategory) || previewCategory}
                    </span>
                  </div>

                  {/* Header preview dynamically resolved for previewCategory */}
                  {(() => {
                    const previewIntro = resolveCategoryIntro(
                      previewCategory,
                      settings
                    );
                    return (
                      <div
                        className={cn(
                          'space-y-2',
                          settings.headerAlignment === 'left'
                            ? 'text-left'
                            : settings.headerAlignment === 'right'
                              ? 'text-right'
                              : 'text-center'
                        )}
                      >
                        <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.25em] block font-medium">
                          {previewIntro.eyebrow}
                        </span>
                        <h3 className="font-serif text-xl md:text-2xl text-[#2B2625]">
                          {previewIntro.heading}
                        </h3>
                        <div
                          className={cn(
                            'w-8 h-px bg-[#C39E96]/30',
                            settings.headerAlignment === 'left'
                              ? 'mr-auto'
                              : settings.headerAlignment === 'right'
                                ? 'ml-auto'
                                : 'mx-auto'
                          )}
                        />
                        <div className="font-serif text-xs text-[#6D625F] leading-relaxed max-w-sm mx-auto space-y-0.5">
                          {previewIntro.description.split('\n').map((l, i) => (
                            <span key={i} className="block">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Category tabs preview */}
                  <div className="flex items-center justify-center gap-2 text-[9px] font-mono uppercase overflow-x-auto pb-1">
                    {allAdminCategories.map((cat) => {
                      const isCatActive =
                        normalizeCategory(previewCategory) ===
                        normalizeCategory(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setPreviewCategory(cat);
                            setSelectedCatIntroKey(cat);
                          }}
                          className={cn(
                            'px-2 py-1 rounded transition-colors whitespace-nowrap',
                            isCatActive
                              ? settings.categoryStyle === 'pills'
                                ? 'bg-[#2B2625] text-white rounded-full'
                                : 'text-[#2B2625] font-bold border-b border-[#2B2625]'
                              : 'text-[#7C706D] hover:text-[#2B2625]'
                          )}
                        >
                          {cat === 'all'
                            ? 'All'
                            : formatCategory(cat) || cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mini Image Cards Mockup */}
                  <div
                    className={cn(
                      'grid gap-2.5',
                      settings.displayStyle === 'large-editorial'
                        ? 'grid-cols-1'
                        : settings.displayStyle === 'circular'
                          ? 'grid-cols-2'
                          : 'grid-cols-2'
                    )}
                  >
                    {samplePreviewImages.slice(0, 4).map((img, i) => (
                      <div
                        key={img._id || i}
                        className={cn(
                          'relative overflow-hidden bg-white border border-[#E7DDD2]/70 group',
                          settings.displayStyle === 'circular'
                            ? 'rounded-full aspect-square'
                            : settings.borderRadius === 'none'
                              ? 'rounded-none'
                              : settings.borderRadius === 'large'
                                ? 'rounded-xl'
                                : settings.borderRadius === 'full'
                                  ? 'rounded-2xl'
                                  : 'rounded-sm',
                          settings.imageInteraction === 'lift' &&
                            'hover:-translate-y-1 hover:shadow-md transition-all duration-300'
                        )}
                        style={{
                          aspectRatio:
                            settings.displayStyle === 'circular'
                              ? '1/1'
                              : settings.aspectRatio === '1:1'
                                ? '1/1'
                                : settings.aspectRatio === '4:5'
                                  ? '4/5'
                                  : settings.aspectRatio === '16:9'
                                    ? '16/9'
                                    : '3/4',
                        }}
                      >
                        <Image
                          src={img.src}
                          alt={img.title || 'Preview'}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className={cn(
                            'object-cover transition-transform duration-500',
                            settings.imageInteraction === 'subtle-zoom' &&
                              'group-hover:scale-105'
                          )}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                          <span className="text-[8px] font-mono text-white/80 uppercase">
                            {img.category}
                          </span>
                          <span className="text-[10px] font-serif text-white truncate">
                            {img.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-center font-mono text-[9px] text-[#7C706D]/60 uppercase tracking-widest pt-2">
                    Live layout simulation
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHOTO COLLECTION & MEDIA MANAGER                                  */}
      {/* ========================================================================= */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/70 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <HiFunnel className="w-4 h-4 text-[#C39E96] shrink-0 mr-1" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#2B2625] text-white shadow-xs'
                      : 'bg-[#FAF6F3] text-[#7C706D] hover:text-[#2B2625] border border-[#E7DDD2]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input & Bulk Action */}
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 transition-colors"
                >
                  <HiTrash className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}

              <div className="relative flex-1 md:w-64">
                <HiMagnifyingGlass className="w-4 h-4 text-[#7C706D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>
            </div>
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70">
              <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
              <p className="font-mono text-xs text-[#7C706D]">
                Reading MongoDB Gallery Records...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70 space-y-3">
              <HiPhoto className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
              <p className="font-serif text-base text-[#2B2625]">
                No photos found matching search/category.
              </p>
              <button
                onClick={openCreateModal}
                className="text-xs text-[#C39E96] hover:underline font-medium"
              >
                Add a photo to this category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item._id);
                return (
                  <div
                    key={item._id}
                    className={`group relative bg-white rounded-xl border overflow-hidden shadow-2xs transition-all flex flex-col ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-[#E7DDD2]/70 hover:border-[#2B2625]'
                    }`}
                  >
                    {/* Image Aspect Box */}
                    <div className="relative aspect-[4/5] bg-[#FAF6F3] overflow-hidden">
                      <Image
                        src={item.src}
                        alt={item.alt || item.title || 'Gallery item'}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Category Tag */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#2B2625]/80 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-wider">
                        {item.category}
                      </span>

                      {/* Featured Badge */}
                      {item.featured && (
                        <span
                          className="absolute top-2 right-2 p-1 rounded-full bg-amber-500 text-white shadow-xs"
                          title="Featured on Homepage"
                        >
                          <HiStar className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}

                      {/* Checkbox for Select */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedIds((prev) => [...prev, item._id]);
                          else
                            setSelectedIds((prev) =>
                              prev.filter((i) => i !== item._id)
                            );
                        }}
                        className="absolute bottom-2 left-2 w-4 h-4 accent-rose-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Info & Action Strip */}
                    <div className="p-3 bg-white space-y-2 flex-1 flex flex-col justify-between border-t border-[#E7DDD2]/40">
                      <div>
                        <h3
                          className="font-serif text-xs text-[#2B2625] font-medium truncate"
                          title={item.title || 'Untitled'}
                        >
                          {item.title || 'Untitled Photo'}
                        </h3>
                        <p className="font-sans text-[10px] text-[#7C706D] truncate mt-0.5">
                          Order: #{item.order ?? 0}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E7DDD2]/30">
                        <button
                          onClick={() => handleToggleFeatured(item)}
                          className={`p-1 rounded hover:bg-[#FAF6F3] transition-colors ${
                            item.featured ? 'text-amber-600' : 'text-[#7C706D]'
                          }`}
                          title={
                            item.featured
                              ? 'Remove from Homepage'
                              : 'Feature on Homepage'
                          }
                        >
                          <HiStar className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]"
                            title="Edit details"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(item._id)}
                            className="p-1 rounded text-[#7C706D] hover:text-rose-600 hover:bg-rose-50"
                            title="Delete photo"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && items.length < total && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#7C706D]">
                Showing {items.length} of {total} photos
              </p>
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg bg-[#2B2625] px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore ? 'Loading photos...' : 'Load remaining photos'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Photo Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7DDD2] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-4">
              <h2 className="font-serif text-xl text-[#2B2625]">
                {editingItem ? 'Edit Gallery Photo' : 'Add New Gallery Photo'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#7C706D] hover:text-[#2B2625]"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSavePhoto}
              className="space-y-4 text-xs font-sans"
            >
              <div>
                <label className="block text-[#2B2625] font-medium mb-1">
                  Image URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://storage.supabase.co/..."
                  value={formData.src}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      src: e.target.value,
                      thumbnail: formData.thumbnail || e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">
                  Thumbnail URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Defaults to main image URL if empty"
                  value={formData.thumbnail}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fine Art Maternity Shoot"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">
                  Alt Text (Accessibility & SEO)
                </label>
                <input
                  type="text"
                  placeholder="Describe image for search engines"
                  value={formData.alt}
                  onChange={(e) =>
                    setFormData({ ...formData, alt: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#2B2625] rounded"
                />
                <label
                  htmlFor="featured"
                  className="text-[#2B2625] font-medium cursor-pointer"
                >
                  Feature on Homepage Hero Slideshow
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7DDD2]/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E7DDD2] text-[#7C706D] hover:text-[#2B2625]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#2B2625] text-white hover:bg-[#3D3534] uppercase font-medium tracking-wider"
                >
                  {saving ? 'Saving...' : 'Save to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
