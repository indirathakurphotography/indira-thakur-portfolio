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
  HiPaintBrush
} from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import AdminCardSection from '@/components/admin/AdminCardSection';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';

export default function AdminHomepage() {
  const [home, setHome] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchHome = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/home', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load homepage data');
      const data = await res.json();
      setHome(data || {});
    } catch (err: any) {
      setError(err?.message || 'Failed to load homepage content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

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
      if (updatedData) setHome(updatedData);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setSuccess('Homepage content & hero slideshow updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Error saving homepage');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#7C706D] uppercase tracking-wider">Loading Homepage CMS...</span>
      </div>
    );
  }

  const heroImagesList = Array.isArray(home.heroImages) ? home.heroImages : [];
  const categoriesList = Array.isArray(home.categories) ? home.categories : ['Newborn', 'Maternity', 'Portrait', 'Events'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DDD2] shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiSwatch className="w-3.5 h-3.5" />
            Hero Banner & Landing CMS
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B2625] font-normal mt-2">
            Homepage Content & Hero Slideshow
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans max-w-2xl">
            Manage main hero headlines, call-to-actions, category tags, and background cinematic slideshow loop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] text-xs font-medium uppercase tracking-wider hover:bg-white transition-colors"
          >
            <HiEye className="w-4 h-4 text-[#C39E96]" />
            <span>View Live Site</span>
          </a>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <HiSparkles className="w-4 h-4 text-[#C39E96]" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-bold ml-2">✕</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* GROUP 1: Hero Headlines & Story Content */}
        <AdminCardSection
          title="1. Hero Headlines & Narrative Copy"
          description="Main banner eyebrow tag, large headline texts, italic companion phrase, and narrative subtext."
          icon={<HiDocumentText className="w-5 h-5" />}
          badge="Main Hero"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Eyebrow / Category Tagline
              </label>
              <input
                type="text"
                value={home.tagline || ''}
                onChange={(e) => handleHomeChange('tagline', e.target.value)}
                placeholder="FINE ART PHOTOGRAPHY"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Heading Main Text
              </label>
              <input
                type="text"
                value={home.heading || ''}
                onChange={(e) => handleHomeChange('heading', e.target.value)}
                placeholder="Every Frame"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Heading Italic Accent Text
              </label>
              <input
                type="text"
                value={home.headingItalic || ''}
                onChange={(e) => handleHomeChange('headingItalic', e.target.value)}
                placeholder="Tells a Story"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Hero Heading Font Scale Preset
              </label>
              <select
                value={home.headingFontSize || 'standard'}
                onChange={(e) => handleHomeChange('headingFontSize', e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              >
                <option value="small">Small / Reduced Scale (Compact Headline)</option>
                <option value="compact">Medium-Small (Refined Scale)</option>
                <option value="standard">Standard Editorial (Default Balanced Scale)</option>
                <option value="large">Large (High Impact)</option>
                <option value="xl">Extra Large (Maximum Dramatic Scale)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Subtext Description
              </label>
              <input
                type="text"
                value={home.subtext || ''}
                onChange={(e) => handleHomeChange('subtext', e.target.value)}
                placeholder="Newborn • Maternity • Fine Art Portrait • Events & Collaborations"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Additional Narrative / Quote Box
              </label>
              <textarea
                rows={2}
                value={home.additionalText || home.description || ''}
                onChange={(e) => {
                  handleHomeChange('additionalText', e.target.value);
                  handleHomeChange('description', e.target.value);
                }}
                placeholder="Additional introductory hero text or narrative quote displayed below the headline..."
                className="w-full px-4 py-2 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
        </AdminCardSection>

        {/* GROUP 2: Call-To-Action Buttons */}
        <AdminCardSection
          title="2. Call-To-Action Buttons & Links"
          description="Primary reservation button and secondary portfolio exploration button linking across the site."
          icon={<HiCursorArrowRays className="w-5 h-5" />}
          badge="2 Action Links"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Primary CTA Button Label
              </label>
              <input
                type="text"
                value={home.ctaText || ''}
                onChange={(e) => handleHomeChange('ctaText', e.target.value)}
                placeholder="Reserve Your Session"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Primary CTA Link Target
              </label>
              <input
                type="text"
                value={home.ctaLink || ''}
                onChange={(e) => handleHomeChange('ctaLink', e.target.value)}
                placeholder="/#contact"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Secondary CTA Button Label
              </label>
              <input
                type="text"
                value={home.secondaryCtaText || ''}
                onChange={(e) => handleHomeChange('secondaryCtaText', e.target.value)}
                placeholder="Explore Gallery"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Secondary CTA Link Target
              </label>
              <input
                type="text"
                value={home.secondaryCtaLink || ''}
                onChange={(e) => handleHomeChange('secondaryCtaLink', e.target.value)}
                placeholder="/gallery"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
        </AdminCardSection>

        {/* GROUP 3: Hero Slideshow Manager */}
        <AdminCardSection
          title="3. Hero Slideshow Manager"
          description="High-resolution photography slides, display duration, and Ken Burns cinematic motion effects."
          icon={<HiPhoto className="w-5 h-5" />}
          badge={`${heroImagesList.length} Active Slides`}
          defaultOpen={true}
          headerAction={
            <button
              type="button"
              onClick={handleAddHeroImage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-white transition-colors"
            >
              <HiPlus className="w-4 h-4 text-[#C39E96]" />
              <span>Add Slide</span>
            </button>
          }
        >
          <div className="space-y-6">
            {heroImagesList.map((img: any, idx: number) => (
              <div key={idx} className="p-5 sm:p-6 border border-[#E7DDD2] rounded-2xl bg-white space-y-4 shadow-2xs">
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
                      className="p-1.5 text-[#2B2625] hover:bg-[#FAF6F3] border border-[#E7DDD2] rounded-md transition-colors disabled:opacity-30"
                      title="Move Up"
                    >
                      <HiArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === heroImagesList.length - 1}
                      onClick={() => handleMoveSlide(idx, 'down')}
                      className="p-1.5 text-[#2B2625] hover:bg-[#FAF6F3] border border-[#E7DDD2] rounded-md transition-colors disabled:opacity-30"
                      title="Move Down"
                    >
                      <HiArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveHeroImage(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1 ml-2"
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
                      label={`Hero Slide ${idx + 1} Media Asset`}
                      description="Upload high-res photography asset or specify direct image URL."
                      value={img.url || ''}
                      onChange={(url) => handleHeroImageChange(idx, 'url', url)}
                      folder="hero-slideshow"
                      aspectRatio="aspect-video"
                    />
                  </div>

                  <div className="space-y-4 bg-[#FAF6F3]/60 p-4 rounded-xl border border-[#E7DDD2]">
                    <div>
                      <label className="block text-xs font-semibold text-[#7C706D] uppercase mb-1">
                        Slide Alt Text / Caption
                      </label>
                      <input
                        type="text"
                        value={img.alt || ''}
                        onChange={(e) => handleHeroImageChange(idx, 'alt', e.target.value)}
                        placeholder="e.g. Fine Art Newborn Storytelling"
                        className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#7C706D] uppercase mb-1">
                        Duration (Seconds)
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={img.duration || 7}
                        onChange={(e) => handleHeroImageChange(idx, 'duration', parseInt(e.target.value) || 7)}
                        className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#7C706D] uppercase mb-1">
                        Ken Burns Animation Effect
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
        </AdminCardSection>

        {/* GROUP 4: Category Tags & Keywords */}
        <AdminCardSection
          title="4. Category Tags & Service Highlights"
          description="Specialized tags displayed in the hero section and discoverability metadata."
          icon={<HiTag className="w-5 h-5" />}
          badge={`${categoriesList.length} Tags`}
          defaultOpen={false}
          headerAction={
            <button
              type="button"
              onClick={() => {
                const current = [...categoriesList, 'Fine Art Photography'];
                handleHomeChange('categories', current);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
            >
              <HiPlus className="w-4 h-4 text-[#C39E96]" />
              <span>Add Tag</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categoriesList.map((cat: string, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2.5 bg-[#FAF6F3]/60 border border-[#E7DDD2] rounded-xl">
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
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  title="Delete Keyword"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </AdminCardSection>

        {/* GROUP 5: Homepage Typography */}
        <AdminCardSection
          title="5. Homepage & Hero Typography"
          description="Select any text element to customize its font size scale, font family, font weight, and text color independently."
          icon={<HiPaintBrush className="w-5 h-5" />}
          badge="Independent Font Controls"
          defaultOpen={false}
        >
          <SectionTypographyManager
            title="Homepage Hero Text Elements"
            description="Click on any text element card below to open its specific typography controls."
            elements={[
              {
                id: 'tagline',
                label: 'Eyebrow / Category Tagline',
                sublabel: 'Small category label above the main headline (e.g., FINE ART PHOTOGRAPHY)',
                value: home.taglineTypography,
                onChange: (val) => handleHomeChange('taglineTypography', val),
                defaultColor: '#C39E96',
              },
              {
                id: 'heading',
                label: 'Main Hero Heading',
                sublabel: 'Primary hero headline text and its italic companion',
                value: home.headingTypography,
                onChange: (val) => handleHomeChange('headingTypography', val),
                defaultColor: '#FFFFFF',
              },
              {
                id: 'subtext',
                label: 'Subtext & Narrative Description',
                sublabel: 'Introductory subtitle and descriptive narrative text',
                value: home.subtextTypography,
                onChange: (val) => handleHomeChange('subtextTypography', val),
                defaultColor: '#FAF6F3',
              },
            ]}
          />
        </AdminCardSection>

        {/* Bottom Save Action */}
        <div className="pt-4 flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#2B2625] text-white rounded-xl text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-colors disabled:opacity-50 shadow-md cursor-pointer"
          >
            <HiSparkles className="w-4 h-4 text-[#C39E96]" />
            <span>{saving ? 'Saving to Database...' : 'Save Homepage Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
