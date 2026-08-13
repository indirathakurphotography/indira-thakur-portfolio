'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiSwatch, HiPlus, HiTrash, HiCheck, HiArrowUp, HiArrowDown, HiEye } from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import { invalidateSiteConfigCache } from '@/hooks/useSiteConfig';

export default function AdminHomepageConfigPage() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load homepage configuration');
      const data = await res.json();
      setConfig(data || {});
    } catch (err: any) {
      setError(err?.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const home = config.home || {};

  const handleHomeChange = (field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      home: {
        ...(prev.home || {}),
        [field]: value,
      },
    }));
  };

  const handleAddHeroImage = () => {
    const images = [...(home.heroImages || [])];
    if (images.length >= 7) {
      setError('The production homepage requires exactly 7 hero slides. Replace an existing slide instead.');
      return;
    }
    images.push({
      url: '',
      alt: 'Fine Art Portfolio Slide',
      duration: 7,
      animation: 'kenburns',
    });
    handleHomeChange('heroImages', images);
  };

  const handleHeroImageChange = (index: number, field: string, value: any) => {
    const images = [...(home.heroImages || [])];
    images[index] = { ...images[index], [field]: value };
    handleHomeChange('heroImages', images);
  };

  const handleRemoveHeroImage = (index: number) => {
    if ((home.heroImages || []).length <= 7) {
      setError('The production homepage requires exactly 7 hero slides. Replace an existing slide instead.');
      return;
    }
    const images = (home.heroImages || []).filter((_: any, i: number) => i !== index);
    handleHomeChange('heroImages', images);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if ((config.home?.heroImages || []).length !== 7) {
        throw new Error('Homepage requires exactly 7 hero slides before it can be saved.');
      }

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save homepage settings to MongoDB');
      }

      const updatedData = await res.json();
      if (!updatedData || !updatedData.home) {
        throw new Error('Database write returned invalid site configuration.');
      }

      // Read-after-write verification fetch from /api/site-config
      const verifyRes = await fetch('/api/site-config', { cache: 'no-store' });
      if (!verifyRes.ok) {
        throw new Error('Read-after-write verification failed: Unable to fetch /api/site-config');
      }
      const verifiedData = await verifyRes.json();

      if (config.home?.heading && verifiedData.home?.heading !== config.home?.heading) {
        throw new Error(`Read-after-write verification failed: Expected heading "${config.home.heading}", but MongoDB returned "${verifiedData.home?.heading}"`);
      }

      setConfig(verifiedData);
      invalidateSiteConfigCache();
      localStorage.setItem('site-config-updated', Date.now().toString());
      setSuccess('Homepage configuration saved to MongoDB and live website updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Error saving homepage configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7DDD2] pb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] flex items-center gap-2">
            <HiSwatch className="w-7 h-7 text-[#C39E96]" />
            Homepage Content & Hero Slideshow CMS
          </h1>
          <p className="font-sans text-sm text-[#7C706D] mt-1">
            Manage main hero headlines, call-to-actions, and background slideshow loop. Updates persist directly to MongoDB.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B2625] text-white rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors shadow-xs"
        >
          <HiEye className="w-4 h-4 text-[#C39E96]" />
          View Live Homepage
        </a>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <HiCheck className="w-5 h-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Main Banner Headlines */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3">
            Hero Headlines & Call-To-Action
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Eyebrow / Category Tagline
              </label>
              <input
                type="text"
                value={home.tagline || ''}
                onChange={(e) => handleHomeChange('tagline', e.target.value)}
                placeholder="FINE ART PHOTOGRAPHY"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Heading Main Text
              </label>
              <input
                type="text"
                value={home.heading || ''}
                onChange={(e) => handleHomeChange('heading', e.target.value)}
                placeholder="Every Frame"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Heading Italic Accent Text
              </label>
              <input
                type="text"
                value={home.headingItalic || ''}
                onChange={(e) => handleHomeChange('headingItalic', e.target.value)}
                placeholder="Tells a Story"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Subtext Description
              </label>
              <input
                type="text"
                value={home.subtext || ''}
                onChange={(e) => handleHomeChange('subtext', e.target.value)}
                placeholder="Newborn • Maternity • Fine Art Portrait • Events & Collaborations"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E7DDD2]/60">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Primary CTA Button Label
              </label>
              <input
                type="text"
                value={home.ctaText || ''}
                onChange={(e) => handleHomeChange('ctaText', e.target.value)}
                placeholder="Reserve Your Session"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Primary CTA Link Target
              </label>
              <input
                type="text"
                value={home.ctaLink || ''}
                onChange={(e) => handleHomeChange('ctaLink', e.target.value)}
                placeholder="/#contact"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Secondary CTA Button Label
              </label>
              <input
                type="text"
                value={home.secondaryCtaText || ''}
                onChange={(e) => handleHomeChange('secondaryCtaText', e.target.value)}
                placeholder="Explore Gallery"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Secondary CTA Link Target
              </label>
              <input
                type="text"
                value={home.secondaryCtaLink || ''}
                onChange={(e) => handleHomeChange('secondaryCtaLink', e.target.value)}
                placeholder="/gallery"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>
        </div>

        {/* Hero Slideshow Images Rebuild */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7DDD2] pb-3">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#2B2625]">
                Hero Slideshow Manager ({home.heroImages?.length || 0}/7 Slides)
              </h2>
              <p className="text-xs text-[#7C706D]">
                Upload, reorder, preview, and configure high-resolution background slides for the hero section.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddHeroImage}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
            >
              <HiPlus className="w-4 h-4 text-[#C39E96]" />
              Add Hero Slide
            </button>
          </div>

          <div className="space-y-6">
            {(home.heroImages || []).map((img: any, idx: number) => (
              <div key={idx} className="p-5 border border-[#E7DDD2] rounded-xl bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E7DDD2]/60 pb-3">
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
                      disabled={idx === (home.heroImages?.length || 1) - 1}
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

                  <div className="space-y-4 bg-[#FAF6F3]/60 p-4 rounded-xl border border-[#E7DDD2]/80">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[#7C706D] mb-1">
                        Slide Alt Text / Caption
                      </label>
                      <input
                        type="text"
                        value={img.alt || ''}
                        onChange={(e) => handleHeroImageChange(idx, 'alt', e.target.value)}
                        placeholder="e.g. Fine Art Newborn Storytelling"
                        className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-[#7C706D] mb-1">
                        Slide Duration (Seconds)
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={img.duration || 7}
                        onChange={(e) => handleHeroImageChange(idx, 'duration', parseInt(e.target.value) || 7)}
                        className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-[#7C706D] mb-1">
                        Ken Burns Animation Effect
                      </label>
                      <select
                        value={img.animation || 'kenburns'}
                        onChange={(e) => handleHeroImageChange(idx, 'animation', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
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
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-8 py-3 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-md"
          >
            {saving ? 'Saving & Verifying MongoDB...' : 'Save Homepage Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
