'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HiSwatch,
  HiEye,
  HiCheck,
  HiPlus,
  HiTrash,
  HiArrowUp,
  HiArrowDown,
  HiSparkles,
  HiPhoto,
  HiDocumentText,
  HiCursorArrowRays,
  HiTag,
  HiPaintBrush,
  HiAdjustmentsHorizontal,
} from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import AdminSectionHeader from '@/components/admin/AdminSectionHeader';
import AdminSectionTabs, { AdminTabItem } from '@/components/admin/AdminSectionTabs';
import AdminCard from '@/components/admin/AdminCard';
import FocusedTypographyManager, { TypographyElementDef } from '@/components/admin/FocusedTypographyManager';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminHomepage() {
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'typography' | 'settings'>('content');
  const [home, setHome] = useState<any>({});
  const [savedHome, setSavedHome] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchHome = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/home', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load homepage data');
      const data = await res.json();
      setHome(data || {});
      setSavedHome(data || {});
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to load homepage content' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  const hasUnsavedChanges = JSON.stringify(home) !== JSON.stringify(savedHome);

  const handleHomeChange = (field: string, value: any) => {
    setHome((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleHeroImageChange = (index: number, field: string, value: any) => {
    const updated = [...(home.heroImages || [])];
    if (!updated[index]) return;
    updated[index] = { ...updated[index], [field]: value };
    handleHomeChange('heroImages', updated);
  };

  const handleAddHeroImage = () => {
    const updated = [
      ...(home.heroImages || []),
      {
        url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
        alt: 'Fine Art Portrait Storytelling',
        duration: 7,
        animation: 'kenburns',
      },
    ];
    handleHomeChange('heroImages', updated);
  };

  const handleRemoveHeroImage = (index: number) => {
    const updated = (home.heroImages || []).filter((_: any, i: number) => i !== index);
    handleHomeChange('heroImages', updated);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const images = [...(home.heroImages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const temp = images[index];
    images[index] = images[targetIndex];
    images[targetIndex] = temp;
    handleHomeChange('heroImages', images);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const res = await fetch('/api/home', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(home),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save homepage settings');
      }

      const updatedData = await res.json();
      if (updatedData) {
        setHome(updatedData);
        setSavedHome(updatedData);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setFeedback({ type: 'success', msg: 'Homepage content & hero slideshow updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving homepage' });
    } finally {
      setSaving(false);
    }
  };

  const heroImagesList = Array.isArray(home.heroImages) ? home.heroImages : [];
  const categoriesList = Array.isArray(home.categories)
    ? home.categories
    : ['Newborn', 'Maternity', 'Portrait', 'Events'];

  const typographyElements: TypographyElementDef[] = [
    {
      id: 'taglineTypography',
      label: 'Hero Eyebrow Tagline',
      sublabel: 'Small category label above the main headline',
      value: home.taglineTypography,
      onChange: (val) => handleHomeChange('taglineTypography', val),
      defaultColor: '#C39E96',
      sampleText: 'FINE ART PHOTOGRAPHY',
    },
    {
      id: 'headingTypography',
      label: 'Main Hero Heading',
      sublabel: 'Primary hero headline text and its italic companion',
      value: home.headingTypography,
      onChange: (val) => handleHomeChange('headingTypography', val),
      defaultColor: '#FFFFFF',
      sampleText: 'Every Frame Tells a Story',
    },
    {
      id: 'subtextTypography',
      label: 'Subtext & Narrative Description',
      sublabel: 'Introductory subtitle and descriptive narrative text',
      value: home.subtextTypography,
      onChange: (val) => handleHomeChange('subtextTypography', val),
      defaultColor: '#FAF6F3',
      sampleText: 'Newborn • Maternity • Fine Art Portrait • Events & Collaborations',
    },
  ];

  const tabs: AdminTabItem[] = [
    { id: 'content', label: 'Hero Headlines & Narrative', icon: HiDocumentText },
    { id: 'media', label: 'Hero Slideshow', icon: HiPhoto, badge: heroImagesList.length },
    { id: 'typography', label: 'Typography & Tags', icon: HiPaintBrush },
    { id: 'settings', label: 'CTAs & Actions', icon: HiCursorArrowRays },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans">
      {/* Section Header */}
      <AdminSectionHeader
        title="Hero Banner & Homepage"
        description="Manage the main landing hero headlines, background cinematic slideshow loop, action buttons, and discovering tags."
        previewUrl="/"
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        isSaving={saving}
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

      {/* TAB 1: HERO HEADLINES & NARRATIVE */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <AdminCard
            title="Main Hero Headlines"
            description="Control the display copy presented prominently upon visitor arrival."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Eyebrow Category Tagline
                </label>
                <input
                  type="text"
                  value={home.tagline || ''}
                  onChange={(e) => handleHomeChange('tagline', e.target.value)}
                  placeholder="FINE ART PHOTOGRAPHY"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Heading Main Title
                </label>
                <input
                  type="text"
                  value={home.heading || ''}
                  onChange={(e) => handleHomeChange('heading', e.target.value)}
                  placeholder="Every Frame"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Heading Italic Accent Text
                </label>
                <input
                  type="text"
                  value={home.headingItalic || ''}
                  onChange={(e) => handleHomeChange('headingItalic', e.target.value)}
                  placeholder="Tells a Story"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Heading Scale Preset
                </label>
                <select
                  value={home.headingFontSize || 'standard'}
                  onChange={(e) => handleHomeChange('headingFontSize', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  <option value="small">Small / Reduced Scale</option>
                  <option value="compact">Medium-Small</option>
                  <option value="standard">Standard Editorial (Default)</option>
                  <option value="large">Large</option>
                  <option value="xl">Extra Large Dramatic</option>
                </select>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Narrative Copy & Subtitles"
            description="Descriptive subtitle and introductory quote displayed beneath the main hero headline."
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Subtext Description
                </label>
                <input
                  type="text"
                  value={home.subtext || ''}
                  onChange={(e) => handleHomeChange('subtext', e.target.value)}
                  placeholder="Newborn • Maternity • Fine Art Portrait • Events & Collaborations"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Additional Narrative / Quote
                </label>
                <textarea
                  rows={2}
                  value={home.additionalText || home.description || ''}
                  onChange={(e) => {
                    handleHomeChange('additionalText', e.target.value);
                    handleHomeChange('description', e.target.value);
                  }}
                  placeholder="Additional introductory hero text or narrative quote displayed below the headline..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 2: HERO SLIDESHOW */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <AdminCard
            title="Cinematic Hero Slideshow"
            description="Manage background photography slides, display duration, and Ken Burns cinematic motion effects."
            headerAction={
              <button
                type="button"
                onClick={handleAddHeroImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] hover:bg-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
                <span>Add Slide</span>
              </button>
            }
          >
            <div className="space-y-6">
              {heroImagesList.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 border border-[#E7DDD2] rounded-2xl bg-white space-y-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-[#E7DDD2]/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#2B2625] bg-[#FAF6F3] px-3 py-1 rounded-md border border-[#E7DDD2]">
                        Slide #{idx + 1}
                      </span>
                      <span className="text-xs text-[#7C706D] truncate max-w-[200px]">
                        {img.alt || 'Untitled Slide'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSlide(idx, 'up')}
                        className="p-1.5 text-[#2B2625] hover:bg-[#FAF6F3] border border-[#E7DDD2] rounded-md transition-colors disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <HiArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === heroImagesList.length - 1}
                        onClick={() => handleMoveSlide(idx, 'down')}
                        className="p-1.5 text-[#2B2625] hover:bg-[#FAF6F3] border border-[#E7DDD2] rounded-md transition-colors disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <HiArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroImage(idx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1 ml-2 cursor-pointer"
                        title="Remove Slide"
                      >
                        <HiTrash className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <MediaUploader
                        label={`Hero Slide ${idx + 1} Image`}
                        description="Upload high-res photography asset or specify direct image URL."
                        value={img.url || ''}
                        onChange={(url) => handleHeroImageChange(idx, 'url', url)}
                        folder="hero-slideshow"
                        aspectRatio="aspect-video"
                      />
                    </div>

                    <div className="space-y-4 bg-[#FAF6F3] p-4 rounded-xl border border-[#E7DDD2]">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7C706D] font-semibold">
                          Alt Text / Caption
                        </label>
                        <input
                          type="text"
                          value={img.alt || ''}
                          onChange={(e) => handleHeroImageChange(idx, 'alt', e.target.value)}
                          placeholder="e.g. Fine Art Newborn Storytelling"
                          className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7C706D] font-semibold">
                          Duration (Seconds)
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="30"
                          value={img.duration || 7}
                          onChange={(e) =>
                            handleHeroImageChange(idx, 'duration', parseInt(e.target.value) || 7)
                          }
                          className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7C706D] font-semibold">
                          Motion Animation
                        </label>
                        <select
                          value={img.animation || 'kenburns'}
                          onChange={(e) => handleHeroImageChange(idx, 'animation', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                        >
                          <option value="kenburns">Ken Burns Slow Zoom & Pan</option>
                          <option value="fade">Smooth Crossfade</option>
                          <option value="none">Static Display</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 3: TYPOGRAPHY & TAGS */}
      {activeTab === 'typography' && (
        <div className="space-y-8">
          <AdminCard
            title="Category Tags & Highlights"
            description="Specialized tags displayed in the hero section and discovery metadata."
            headerAction={
              <button
                type="button"
                onClick={() => {
                  const current = [...categoriesList, 'Fine Art Photography'];
                  handleHomeChange('categories', current);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] hover:bg-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
                <span>Add Tag</span>
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categoriesList.map((cat: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2.5 bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl"
                >
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => {
                      const list = [...categoriesList];
                      list[index] = e.target.value;
                      handleHomeChange('categories', list);
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                    placeholder="e.g. Newborn Photography"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const list = categoriesList.filter((_: any, i: number) => i !== index);
                      handleHomeChange('categories', list);
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Delete Tag"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Hero Section Typography"
            description="Customize the font styling, scale, and color palette for hero text elements."
          >
            <FocusedTypographyManager elements={typographyElements} />
          </AdminCard>
        </div>
      )}

      {/* TAB 4: CTAs & ACTIONS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminCard
            title="Call-To-Action Buttons"
            description="Configure primary and secondary action buttons rendered over the hero section."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Primary CTA Label
                </label>
                <input
                  type="text"
                  value={home.ctaText || ''}
                  onChange={(e) => handleHomeChange('ctaText', e.target.value)}
                  placeholder="Reserve Your Session"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Primary CTA Link Target
                </label>
                <input
                  type="text"
                  value={home.ctaLink || ''}
                  onChange={(e) => handleHomeChange('ctaLink', e.target.value)}
                  placeholder="/#contact"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Secondary CTA Label
                </label>
                <input
                  type="text"
                  value={home.secondaryCtaText || ''}
                  onChange={(e) => handleHomeChange('secondaryCtaText', e.target.value)}
                  placeholder="Explore Gallery"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Secondary CTA Link Target
                </label>
                <input
                  type="text"
                  value={home.secondaryCtaLink || ''}
                  onChange={(e) => handleHomeChange('secondaryCtaLink', e.target.value)}
                  placeholder="/services"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Sticky Save Bar */}
      <StickySaveBar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={saving}
        onSave={handleSave}
        onReset={() => setHome(savedHome)}
        label="Homepage Hero Settings"
      />
    </div>
  );
}
