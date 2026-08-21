'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiHeart, HiCheck, HiPhoto, HiSparkles } from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import TypographyControl from '@/components/admin/TypographyControl';

export default function AdminAboutPage() {
  const [about, setAbout] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAbout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/about', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load About page data');
      const data = await res.json();
      setAbout(data || {});
    } catch (err: any) {
      setError(err?.message || 'Failed to load About section');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  const handleChange = (field: string, value: any) => {
    setAbout((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (key: string, url: string, alt?: string) => {
    setAbout((prev: any) => ({
      ...prev,
      images: {
        ...(prev.images || {}),
        [key]: {
          ...(prev.images?.[key] || {}),
          url,
          alt: alt !== undefined ? alt : prev.images?.[key]?.alt || '',
        },
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const res = await fetch('/api/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(about),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save About section');
      }

      const updatedData = await res.json();
      if (updatedData) setAbout(updatedData);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setSuccess('About section updated and verified live in MongoDB!');
    } catch (err: any) {
      setError(err?.message || 'Error saving About section');
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
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiHeart className="w-3.5 h-3.5" />
            Artist Story & Biography CMS
          </div>
          <h1 className="font-serif text-3xl text-[#2B2625] font-normal mt-2">
            About Indira Thakur
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans">
            Manage Indira Thakur's biography, artistic philosophy, milestones, multiple showcase photos, and collapsible extended bio.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-xs"
        >
          <HiSparkles className="w-4 h-4 text-[#C39E96]" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
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
        {/* Headlines & Identity */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Artist Identity & Headlines
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Eyebrow Category
              </label>
              <input
                type="text"
                value={about.eyebrow || ''}
                onChange={(e) => handleChange('eyebrow', e.target.value)}
                placeholder="THE ARTIST & STORYTELLER"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Heading / Artist Name
              </label>
              <input
                type="text"
                value={about.heading || ''}
                onChange={(e) => handleChange('heading', e.target.value)}
                placeholder="Indira Thakur"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Subheading / Tagline
            </label>
            <input
              type="text"
              value={about.subheading || ''}
              onChange={(e) => handleChange('subheading', e.target.value)}
              placeholder="Lifestyle Stills & Films • Mumbai"
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Intro Story Paragraph 1
            </label>
            <textarea
              value={about.story || ''}
              onChange={(e) => handleChange('story', e.target.value)}
              rows={4}
              placeholder="I am Indira Thakur, a passionate storyteller and professional photographer..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Specialization & Background Paragraph 2
            </label>
            <textarea
              value={about.storyContinued || ''}
              onChange={(e) => handleChange('storyContinued', e.target.value)}
              rows={3}
              placeholder="I am a certified newborn photographer and specialise in child photography, maternity..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          {/* Typography Customization Section */}
          <div className="pt-4 border-t border-[#E7DDD2]/70 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2B2625]">
              About Section Typography & Text Styling
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <TypographyControl
                label="Eyebrow Category Typography"
                sublabel="Styles the small upper label 'THE ARTIST & STORYTELLER'"
                value={about.eyebrowTypography}
                onChange={(val) => handleChange('eyebrowTypography', val)}
                defaultColor="#C39E96"
              />
              <TypographyControl
                label="Main Heading / Artist Name Typography"
                sublabel="Styles the prominent title / Indira Thakur headline"
                value={about.headingTypography}
                onChange={(val) => handleChange('headingTypography', val)}
                defaultColor="#2B2625"
              />
              <TypographyControl
                label="Subheading / Tagline Typography"
                sublabel="Styles the lifestyle stills & films subtitle"
                value={about.subheadingTypography}
                onChange={(val) => handleChange('subheadingTypography', val)}
                defaultColor="#7C706D"
              />
              <TypographyControl
                label="Story Body Text Typography"
                sublabel="Styles the main biography paragraphs, philosophy quotes, and extended story"
                value={about.bodyTypography}
                onChange={(val) => handleChange('bodyTypography', val)}
                defaultColor="#5C5250"
              />
            </div>
          </div>
        </div>

        {/* Philosophy & Extended Story ("Read More") */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Philosophy, Milestones & "Read More" Narrative
          </h2>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Highlighted Philosophy Statement (Quote)
            </label>
            <textarea
              value={about.philosophy || ''}
              onChange={(e) => handleChange('philosophy', e.target.value)}
              rows={2}
              placeholder="Photography, for me, is much more than taking pictures."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Milestones Summary Paragraph 3
            </label>
            <textarea
              value={about.journey || ''}
              onChange={(e) => handleChange('journey', e.target.value)}
              rows={3}
              placeholder="It is about preserving emotions, celebrating life, documenting milestones..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Extended Bio Narrative (Revealed by "Read More" Button)
            </label>
            <textarea
              value={about.extendedBio || about.journeyContinued || ''}
              onChange={(e) => {
                handleChange('extendedBio', e.target.value);
                handleChange('journeyContinued', e.target.value);
              }}
              rows={5}
              placeholder="Write the in-depth artist journey, film achievements, and creative philosophy that expands when clients click 'Read Full Story'..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>

        {/* Milestone Statistics */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DDD2]/60 pb-3">
            <div>
              <h2 className="font-serif text-xl text-[#2B2625]">
                Key Milestone Statistics
              </h2>
              <p className="font-sans text-xs text-[#7C706D] mt-0.5">
                Displays on the about narrative and homepage banner.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const currentStats = Array.isArray(about.stats) ? [...about.stats] : [];
                handleChange('stats', [...currentStats, { value: '10+', label: 'New Milestone' }]);
              }}
              className="px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] hover:bg-[#E7DDD2]/40 rounded text-xs font-medium"
            >
              + Add Statistic
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Array.isArray(about.stats) && about.stats.length > 0
              ? about.stats
              : [
                  { value: '13+', label: 'Years of Experience' },
                  { value: '500+', label: 'Families Documented' },
                  { value: '15+', label: 'Publications & Festivals' },
                  { value: '100%', label: 'Satisfaction Rating' },
                ]
            ).map((stat: any, idx: number) => (
              <div key={idx} className="p-3 bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]/70 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[#C39E96] font-semibold">Stat #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentStats = Array.isArray(about.stats) ? [...about.stats] : [];
                      handleChange(
                        'stats',
                        currentStats.filter((_, i) => i !== idx)
                      );
                    }}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                  >
                    ✕ Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-[#7C706D] uppercase">Value</label>
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => {
                        const currentStats = Array.isArray(about.stats) ? [...about.stats] : [];
                        currentStats[idx] = { ...currentStats[idx], value: e.target.value };
                        handleChange('stats', currentStats);
                      }}
                      placeholder="13+"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7DDD2] rounded text-sm text-[#2B2625] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-[#7C706D] uppercase">Label</label>
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => {
                        const currentStats = Array.isArray(about.stats) ? [...about.stats] : [];
                        currentStats[idx] = { ...currentStats[idx], label: e.target.value };
                        handleChange('stats', currentStats);
                      }}
                      placeholder="Years of Experience"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7DDD2] rounded text-sm text-[#2B2625] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multiple Visual Images Showcase */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-xs space-y-6">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3 flex items-center gap-2">
            <HiPhoto className="w-5 h-5 text-[#C39E96]" />
            About Page Photography & Studio Visuals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MediaUploader
              label="1. Founder Main Portrait *"
              description="Primary portrait of Indira Thakur."
              value={
                (typeof about.images?.founderPortrait === 'string'
                  ? about.images.founderPortrait
                  : about.images?.founderPortrait?.url) ||
                about.image ||
                about.heroImage ||
                'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg'
              }
              onChange={(url) => handleImageChange('founderPortrait', url)}
              aspectRatio="aspect-[4/5]"
              folder="about"
            />

            <MediaUploader
              label="2. Studio & Behind The Scenes"
              description="Studio setting or camera craft in action."
              value={
                (typeof about.images?.behindTheScenes === 'string'
                  ? about.images.behindTheScenes
                  : about.images?.behindTheScenes?.url) ||
                about.images?.storyImage?.url ||
                'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg'
              }
              onChange={(url) => handleImageChange('behindTheScenes', url)}
              aspectRatio="aspect-[4/3]"
              folder="about"
            />

            <MediaUploader
              label="3. Fine Art Heirloom Visual"
              description="Client heirloom memory or portraiture session."
              value={
                (typeof about.images?.journeyImage === 'string'
                  ? about.images.journeyImage
                  : about.images?.journeyImage?.url) ||
                about.images?.welcomeImage?.url ||
                'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg'
              }
              onChange={(url) => handleImageChange('journeyImage', url)}
              aspectRatio="aspect-[4/3]"
              folder="about"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#2B2625] text-white rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-colors disabled:opacity-50 shadow-md"
          >
            <HiSparkles className="w-4 h-4 text-[#C39E96]" />
            {saving ? 'Saving & Verifying DB...' : 'Save All About Page Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
