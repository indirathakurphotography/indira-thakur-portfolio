'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  HiHeart, 
  HiCheck, 
  HiPhoto, 
  HiSparkles, 
  HiEye, 
  HiDocumentText, 
  HiChartBar, 
  HiPaintBrush,
  HiPlus,
  HiTrash
} from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import AdminCardSection from '@/components/admin/AdminCardSection';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        const errData = await res.json().catch(() => ({}));
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#7C706D] uppercase tracking-wider">Loading About Configuration...</span>
      </div>
    );
  }

  const statsList = Array.isArray(about.stats) && about.stats.length > 0
    ? about.stats
    : [
        { value: '13+', label: 'Years of Experience' },
        { value: '500+', label: 'Families Documented' },
        { value: '15+', label: 'Publications & Festivals' },
        { value: '100%', label: 'Satisfaction Rating' },
      ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DDD2] shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiHeart className="w-3.5 h-3.5" />
            Artist Story & Biography CMS
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B2625] font-normal mt-2">
            About Indira Thakur
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans max-w-2xl">
            Manage Indira Thakur's biography, artistic philosophy, milestones, photography showcases, and collapsible extended bio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] text-xs font-medium uppercase tracking-wider hover:bg-white transition-colors"
          >
            <HiEye className="w-4 h-4 text-[#C39E96]" />
            <span>View /about</span>
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
        {/* GROUP 1: Basic Content & Headlines */}
        <AdminCardSection
          title="1. Basic Content & Identity Headlines"
          description="Main artist title, category badges, and initial introductory paragraphs visible across the homepage and /about page."
          icon={<HiDocumentText className="w-5 h-5" />}
          badge="Essential Info"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Eyebrow Category Badge
              </label>
              <input
                type="text"
                value={about.eyebrow || ''}
                onChange={(e) => handleChange('eyebrow', e.target.value)}
                placeholder="THE ARTIST & STORYTELLER"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Heading / Artist Name
              </label>
              <input
                type="text"
                value={about.heading || ''}
                onChange={(e) => handleChange('heading', e.target.value)}
                placeholder="Indira Thakur"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Subheading / City Tagline
            </label>
            <input
              type="text"
              value={about.subheading || ''}
              onChange={(e) => handleChange('subheading', e.target.value)}
              placeholder="Lifestyle Stills & Films • Mumbai"
              className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Introductory Story (Paragraph 1)
            </label>
            <textarea
              value={about.story || ''}
              onChange={(e) => handleChange('story', e.target.value)}
              rows={4}
              placeholder="I am Indira Thakur, a passionate storyteller and professional photographer..."
              className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Specialization & Background (Paragraph 2)
            </label>
            <textarea
              value={about.storyContinued || ''}
              onChange={(e) => handleChange('storyContinued', e.target.value)}
              rows={3}
              placeholder="I am a certified newborn photographer and specialise in child photography, maternity..."
              className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>
        </AdminCardSection>

        {/* GROUP 2: Founder & Studio Photography */}
        <AdminCardSection
          title="2. Founder & Studio Photography"
          description="High-resolution portrait of Indira Thakur and the supporting studio craft images shown on the public /about page."
          icon={<HiPhoto className="w-5 h-5" />}
          badge="3 Visual Assets"
          defaultOpen={true}
        >
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
        </AdminCardSection>

        {/* GROUP 3: Philosophy & Extended Story ("Read More") */}
        <AdminCardSection
          title="3. Philosophy & Extended Story ('Read More' Narrative)"
          description="In-depth artist journey, film achievements, and creative philosophy displayed on the dedicated /about page."
          icon={<HiHeart className="w-5 h-5" />}
          badge="In-Depth Narrative"
          defaultOpen={false}
        >
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Highlighted Philosophy Statement (Quote)
            </label>
            <textarea
              value={about.philosophy || ''}
              onChange={(e) => handleChange('philosophy', e.target.value)}
              rows={2}
              placeholder="Photography, for me, is much more than taking pictures."
              className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Milestones Summary (Paragraph 3)
            </label>
            <textarea
              value={about.journey || ''}
              onChange={(e) => handleChange('journey', e.target.value)}
              rows={3}
              placeholder="It is about preserving emotions, celebrating life, documenting milestones..."
              className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Extended Biography Narrative (Complete story on /about)
            </label>
            <textarea
              value={about.extendedBio || about.journeyContinued || ''}
              onChange={(e) => {
                handleChange('extendedBio', e.target.value);
                handleChange('journeyContinued', e.target.value);
              }}
              rows={6}
              placeholder="Write the in-depth artist journey, film achievements, and creative philosophy that expands on /about..."
              className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>
        </AdminCardSection>

        {/* GROUP 4: Key Milestone Statistics */}
        <AdminCardSection
          title="4. Key Milestone Statistics"
          description="Numeric achievement counters highlighted on the about narrative and homepage banner."
          icon={<HiChartBar className="w-5 h-5" />}
          badge={`${statsList.length} Counters`}
          defaultOpen={false}
          headerAction={
            <button
              type="button"
              onClick={() => {
                const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                handleChange('stats', [...currentStats, { value: '10+', label: 'New Milestone' }]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] hover:bg-white rounded-lg text-xs font-medium transition-colors"
            >
              <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
              <span>Add Counter</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {statsList.map((stat: any, idx: number) => (
              <div key={idx} className="p-4 bg-[#FAF6F3]/60 rounded-xl border border-[#E7DDD2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[#C39E96] font-semibold">Stat #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                      handleChange(
                        'stats',
                        currentStats.filter((_, i) => i !== idx)
                      );
                    }}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    title="Remove Counter"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-[#7C706D] uppercase mb-1">Value</label>
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => {
                        const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                        currentStats[idx] = { ...currentStats[idx], value: e.target.value };
                        handleChange('stats', currentStats);
                      }}
                      placeholder="13+"
                      className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:border-[#2B2625]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-[#7C706D] uppercase mb-1">Label</label>
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => {
                        const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                        currentStats[idx] = { ...currentStats[idx], label: e.target.value };
                        handleChange('stats', currentStats);
                      }}
                      placeholder="Years of Experience"
                      className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:border-[#2B2625]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCardSection>

        {/* GROUP 5: Typography Customization */}
        <AdminCardSection
          title="5. About Section Typography"
          description="Select any text element to customize its font size, font family, font weight, color, and spacing."
          icon={<HiPaintBrush className="w-5 h-5" />}
          badge="Independent Font Controls"
          defaultOpen={false}
        >
          <SectionTypographyManager
            title="About Page Text Elements"
            description="Click on any text element card below to open its specific typography controls."
            elements={[
              {
                id: 'eyebrow',
                label: 'Eyebrow Category Badge',
                sublabel: 'Upper badge label (e.g. THE ARTIST & STORYTELLER)',
                value: about.eyebrowTypography,
                onChange: (val) => handleChange('eyebrowTypography', val),
                defaultColor: '#C39E96',
              },
              {
                id: 'heading',
                label: 'Artist Name / Main Heading',
                sublabel: 'Prominent name heading (e.g. Indira Thakur)',
                value: about.headingTypography,
                onChange: (val) => handleChange('headingTypography', val),
                defaultColor: '#2B2625',
              },
              {
                id: 'subheading',
                label: 'Subheading / Tagline',
                sublabel: 'Subtitle below name (e.g. Lifestyle Stills & Films • Mumbai)',
                value: about.subheadingTypography,
                onChange: (val) => handleChange('subheadingTypography', val),
                defaultColor: '#7C706D',
              },
              {
                id: 'body',
                label: 'Story & Biography Body Text',
                sublabel: 'Introductory paragraphs, philosophy quotes, and extended story',
                value: about.bodyTypography,
                onChange: (val) => handleChange('bodyTypography', val),
                defaultColor: '#5C5250',
              },
            ]}
          />
        </AdminCardSection>

        {/* Sticky-Style Bottom Action Button */}
        <div className="pt-4 flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#2B2625] text-white rounded-xl text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-colors disabled:opacity-50 shadow-md cursor-pointer"
          >
            <HiSparkles className="w-4 h-4 text-[#C39E96]" />
            <span>{saving ? 'Saving to Database...' : 'Save All About Page Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
