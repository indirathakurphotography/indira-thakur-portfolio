'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { normalizeCategory, formatCategory } from '@/lib/categoryUtils';
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

const CATEGORIES = [
  'All',
  'Newborn',
  'Maternity',
  'Portrait',
  'Weddings',
  'Events',
  'Brand',
];

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
  const [settings, setSettings] = useState<IGallerySettings>(DEFAULT_GALLERY_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<IGallerySettings>(DEFAULT_GALLERY_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Category intros state
  const [selectedCatKey, setSelectedCatKey] = useState<string>('all');
  const [customCatName, setCustomCatName] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);

  // Fetch Settings & Photos
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

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gallery-images?page=1&limit=100', {
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
    fetchPhotos();
  }, [fetchSettings, fetchPhotos]);

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
        msg: 'Gallery configuration and typography saved successfully!',
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

  // Image CRUD handlers
  const handleAddImage = async (newMedia: Omit<AdminMediaItem, 'id'>) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        src: newMedia.url,
        thumbnail: newMedia.url,
        title: newMedia.title || 'Fine Art Photography',
        alt: newMedia.alt || 'Indira Thakur Photography',
        category: newMedia.category || 'Portrait',
        order: newMedia.order || items.length + 1,
      };

      const res = await fetch('/api/gallery-images', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPhotos();
        setFeedback({ type: 'success', msg: 'Photo added to gallery!' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to add photo.' });
    }
  };

  const handleUpdateImage = async (id: string, updated: Partial<AdminMediaItem>) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const target = items.find((i) => i._id === id);
      if (!target) return;

      const payload = {
        _id: id,
        src: updated.url !== undefined ? updated.url : target.src,
        title: updated.title !== undefined ? updated.title : target.title,
        alt: updated.alt !== undefined ? updated.alt : target.alt,
        category: updated.category !== undefined ? updated.category : target.category,
        order: updated.order !== undefined ? updated.order : target.order,
      };

      const res = await fetch('/api/gallery-images', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPhotos();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to update photo details.' });
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/gallery-images?id=${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Photo removed from gallery.' });
        fetchPhotos();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete photo.' });
    }
  };

  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update orders
    const updated = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setItems(updated);

    // Save current reordered item
    handleUpdateImage(temp._id, { order: targetIndex + 1 });
    handleUpdateImage(newItems[index]._id, { order: index + 1 });
  };

  // Convert items to AdminMediaItem format
  const mediaItems: AdminMediaItem[] = useMemo(() => {
    return items.map((i, idx) => ({
      id: i._id,
      url: i.src,
      title: i.title || 'Fine Art Photograph',
      alt: i.alt || 'Fine Art Photography Mumbai',
      category: i.category || 'Portrait',
      order: i.order !== undefined ? i.order : idx + 1,
    }));
  }, [items]);

  // Dynamic Admin Categories derived from canonical + images + saved settings
  const adminCategories = useMemo(() => {
    const map = new Map<string, string>();
    map.set('all', 'All Portfolio');
    const CANONICAL = ['Newborn', 'Maternity', 'Portrait', 'Weddings', 'Events', 'Brand'];
    CANONICAL.forEach((c) => {
      const norm = normalizeCategory(c);
      if (norm && norm !== 'all' && norm !== 'other') {
        map.set(norm, formatCategory(c) || c);
      }
    });

    items.forEach((img) => {
      if (img.category) {
        const norm = normalizeCategory(img.category);
        if (norm && norm !== 'all' && norm !== 'other' && !map.has(norm)) {
          map.set(norm, formatCategory(img.category) || img.category);
        }
      }
    });

    if (settings?.categoryIntroductions) {
      Object.keys(settings.categoryIntroductions).forEach((k) => {
        const norm = normalizeCategory(k);
        if (norm && norm !== 'all' && norm !== 'other' && !map.has(norm)) {
          map.set(norm, formatCategory(k) || k);
        }
      });
    }

    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [items, settings.categoryIntroductions]);

  const mediaCategories = useMemo(() => {
    return adminCategories
      .filter((c) => c.key !== 'all')
      .map((c) => c.label);
  }, [adminCategories]);

  // Current category intro
  const currentCategoryIntro = resolveCategoryIntro(
    selectedCatKey,
    settings
  );

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatName.trim()) return;

    const raw = customCatName.trim();
    const norm = normalizeCategory(raw) || raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!norm || norm === 'all' || norm === 'other') return;

    const newIntro: ICategoryIntro = {
      eyebrow: raw.toUpperCase(),
      heading: `${formatCategory(raw)} Photography`,
      description: `Bespoke fine art ${raw} portraiture capturing timeless stories with elegance and emotion.`,
    };

    setSettings({
      ...settings,
      categoryIntroductions: {
        ...(settings.categoryIntroductions || {}),
        [norm]: newIntro,
      },
    });

    setSelectedCatKey(norm);
    setCustomCatName('');
    setIsAddingCategory(false);
  };

  const handleUpdateCurrentIntro = (field: keyof ICategoryIntro, value: string) => {
    const norm = normalizeCategory(selectedCatKey) || 'all';
    const updatedIntro: ICategoryIntro = {
      ...currentCategoryIntro,
      [field]: value,
    };

    const updatedSettings: IGallerySettings = {
      ...settings,
      categoryIntroductions: {
        ...(settings.categoryIntroductions || {}),
        [norm]: updatedIntro,
      },
    };

    if (norm === 'all') {
      if (field === 'eyebrow') updatedSettings.eyebrow = value;
      if (field === 'heading') updatedSettings.heading = value;
      if (field === 'description') updatedSettings.subtitle = value;
    }

    setSettings(updatedSettings);
  };

  // Typography elements definition
  const typographyElements: TypographyElementDef[] = [
    {
      id: 'galleryEyebrow',
      label: 'Section Eyebrow',
      sublabel: 'Small uppercase tracking badge above heading',
      value: settings.eyebrowTypography,
      onChange: (val) =>
        setSettings({
          ...settings,
          eyebrowTypography: val,
        }),
      defaultColor: '#C39E96',
      sampleText: 'CURATED ARCHIVE',
    },
    {
      id: 'galleryHeading',
      label: 'Main Gallery Heading',
      sublabel: 'Primary editorial display title',
      value: settings.headingTypography,
      onChange: (val) =>
        setSettings({
          ...settings,
          headingTypography: val,
        }),
      defaultColor: '#2B2625',
      sampleText: 'Fine Art Portfolio',
    },
    {
      id: 'categoryPills',
      label: 'Category Filter Buttons',
      sublabel: 'Interactive filter tags (All, Newborn, Maternity, Portrait...)',
      value: settings.customTypographies?.categoryTabs,
      onChange: (val) =>
        setSettings({
          ...settings,
          customTypographies: {
            ...(settings.customTypographies || {}),
            categoryTabs: val,
          },
        }),
      defaultColor: '#7C706D',
      sampleText: 'NEWBORN · MATERNITY · PORTRAIT',
    },
    {
      id: 'categoryDescription',
      label: 'Category Narrative Text',
      sublabel: 'Descriptive narrative under active category header',
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
            className="text-xs underline font-semibold ml-4"
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
            description="Select a photography category to customize its specific eyebrow, heading, and story narrative shown on the public gallery."
          >
            {/* Category Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {adminCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCatKey(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-sans capitalize transition-all cursor-pointer whitespace-nowrap ${
                    selectedCatKey === cat.key
                      ? 'bg-[#2B2625] text-white font-medium shadow-2xs'
                      : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] hover:text-[#2B2625]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="px-3 py-2 rounded-xl text-xs font-sans border border-dashed border-[#C39E96] text-[#C39E96] hover:bg-[#FAF6F3] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                + Add Custom Category
              </button>
            </div>

            {isAddingCategory && (
              <form onSubmit={handleAddNewCategory} className="p-4 bg-[#FAF6F3] border border-[#C39E96]/40 rounded-xl flex items-center gap-3">
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

            {/* Intro Editor Fields */}
            <div className="bg-[#FAF6F3] p-6 rounded-xl border border-[#E7DDD2] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
                <span className="font-serif text-sm font-semibold text-[#2B2625]">
                  Editing Narrative: {formatCategory(selectedCatKey)}
                </span>
                <span className="text-[11px] font-mono text-[#7C706D]">
                  Key: {selectedCatKey}
                </span>
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
          description="Upload new high-resolution photographs to Supabase, update captions/alt text, and manage presentation order."
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
        <div className="space-y-8">
          <AdminCard
            title="Gallery Thumbnail Sizing"
            description="Control the display dimensions and scaling of image cards across the public gallery."
          >
            <GalleryThumbnailControl
              value={settings.thumbnailSize || 'normal'}
              customValue={settings.customThumbnailSize || 340}
              onChangePreset={(preset) =>
                setSettings({ ...settings, thumbnailSize: preset })
              }
              onChangeCustom={(px) =>
                setSettings({ ...settings, customThumbnailSize: px, thumbnailSize: 'custom' })
              }
            />
          </AdminCard>

          <AdminCard
            title="Typography & Text Styling"
            description="Select an individual text element to customize its role, font family, font size, weight, and curated color palette."
          >
            <FocusedTypographyManager
              elements={typographyElements}
            />
          </AdminCard>
        </div>
      )}

      {/* TAB 4: LAYOUT & DISPLAY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminCard
            title="Gallery Grid & Layout Mode"
            description="Choose how fine art photographs are organized and displayed to visitors on desktop and mobile devices."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DISPLAY_STYLES.map((style) => {
                const isSelected = (settings.displayStyle || 'editorial-grid') === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, displayStyle: style.id })}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FAF6F3] border-[#2B2625] ring-2 ring-[#2B2625] shadow-xs'
                        : 'bg-white border-[#E7DDD2] hover:border-[#2B2625]/60 hover:bg-[#FAF6F3]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-[#2B2625]">
                          {style.label}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#2B2625] text-white flex items-center justify-center text-xs">
                            <HiCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7C706D] font-sans leading-relaxed">
                        {style.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard
            title="Spacing & Visual Finishing"
            description="Fine-tune image gaps, corner radius, and interactive lightbox behaviors."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Image Gap */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Grid Image Gap
                </label>
                <select
                  value={settings.imageGap || 'normal'}
                  onChange={(e) =>
                    setSettings({ ...settings, imageGap: e.target.value as GalleryImageGap })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  <option value="none">None (0px)</option>
                  <option value="compact">Compact (8px)</option>
                  <option value="normal">Standard (16px)</option>
                  <option value="spacious">Spacious (24px)</option>
                  <option value="luxurious">Luxurious (32px)</option>
                </select>
              </div>

              {/* Corner Radius */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Corner Radius
                </label>
                <select
                  value={settings.borderRadius || 'none'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      borderRadius: e.target.value as GalleryBorderRadius,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  <option value="none">Sharp / Museum Mat (0px)</option>
                  <option value="subtle">Subtle (4px)</option>
                  <option value="rounded">Soft Rounded (8px)</option>
                  <option value="large">Pill Curved (16px)</option>
                </select>
              </div>

              {/* Lightbox / Click behavior */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Click Behavior
                </label>
                <select
                  value={settings.clickBehavior || 'modal'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clickBehavior: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  <option value="modal">Full-Screen Fine Art Lightbox</option>
                  <option value="expand">Inline Expand</option>
                  <option value="none">Static (No modal)</option>
                </select>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Sticky Save Bar */}
      <StickySaveBar
        hasUnsavedChanges={hasUnsavedSettings}
        isSaving={savingSettings}
        onSave={handleSaveSettings}
        onReset={() => setSettings(savedSettings)}
        label="Gallery Settings"
      />
    </div>
  );
}
