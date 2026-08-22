'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  HiTrash,
  HiAdjustmentsHorizontal,
} from 'react-icons/hi2';
import AdminSectionHeader from '@/components/admin/AdminSectionHeader';
import AdminSectionTabs, { AdminTabItem } from '@/components/admin/AdminSectionTabs';
import AdminCard from '@/components/admin/AdminCard';
import MediaUploader from '@/components/admin/MediaUploader';
import FocusedTypographyManager, { TypographyElementDef } from '@/components/admin/FocusedTypographyManager';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminAboutPage() {
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'typography' | 'settings'>('content');
  const [about, setAbout] = useState<any>({});
  const [savedAbout, setSavedAbout] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchAbout = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/about', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load About page data');
      const data = await res.json();
      setAbout(data || {});
      setSavedAbout(data || {});
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to load About section' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  const hasUnsavedChanges = JSON.stringify(about) !== JSON.stringify(savedAbout);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

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
      if (updatedData) {
        setAbout(updatedData);
        setSavedAbout(updatedData);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setFeedback({ type: 'success', msg: 'About biography and visual settings saved successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving About section' });
    } finally {
      setSaving(false);
    }
  };

  const statsList = Array.isArray(about.stats) && about.stats.length > 0
    ? about.stats
    : [
        { value: '13+', label: 'Years of Experience' },
        { value: '500+', label: 'Families Documented' },
        { value: '15+', label: 'Publications & Festivals' },
        { value: '100%', label: 'Satisfaction Rating' },
      ];

  const typographyElements: TypographyElementDef[] = [
    {
      id: 'aboutEyebrow',
      label: 'Artist Eyebrow Badge',
      sublabel: 'Small uppercase tracking badge above artist name',
      value: about.typography?.eyebrow,
      onChange: (val) =>
        setAbout((prev: any) => ({
          ...prev,
          typography: { ...(prev.typography || {}), eyebrow: val },
        })),
      defaultColor: '#C39E96',
      sampleText: 'THE ARTIST & STORYTELLER',
    },
    {
      id: 'aboutHeading',
      label: 'Main Artist Heading',
      sublabel: 'Display title for Indira Thakur',
      value: about.typography?.heading,
      onChange: (val) =>
        setAbout((prev: any) => ({
          ...prev,
          typography: { ...(prev.typography || {}), heading: val },
        })),
      defaultColor: '#2B2625',
      sampleText: 'Indira Thakur',
    },
    {
      id: 'aboutSubheading',
      label: 'Tagline & Location',
      sublabel: 'City location and craft specialization tagline',
      value: about.typography?.subheading,
      onChange: (val) =>
        setAbout((prev: any) => ({
          ...prev,
          typography: { ...(prev.typography || {}), subheading: val },
        })),
      defaultColor: '#7C706D',
      sampleText: 'Lifestyle Stills & Films • Mumbai',
    },
    {
      id: 'aboutStory',
      label: 'Narrative Story Paragraph',
      sublabel: 'Primary introductory artist story',
      value: about.typography?.story,
      onChange: (val) =>
        setAbout((prev: any) => ({
          ...prev,
          typography: { ...(prev.typography || {}), story: val },
        })),
      defaultColor: '#5C5450',
      sampleText: 'I am Indira Thakur, a passionate storyteller and professional photographer...',
    },
    {
      id: 'aboutPhilosophy',
      label: 'Highlighted Philosophy Quote',
      sublabel: 'Prominent quote text block with serif display accents',
      value: about.typography?.philosophy,
      onChange: (val) =>
        setAbout((prev: any) => ({
          ...prev,
          typography: { ...(prev.typography || {}), philosophy: val },
        })),
      defaultColor: '#2B2625',
      sampleText: 'Photography, for me, is much more than taking pictures.',
    },
  ];

  const tabs: AdminTabItem[] = [
    { id: 'content', label: 'Story & Biography', icon: HiDocumentText },
    { id: 'media', label: 'Photography & Portraits', icon: HiPhoto },
    { id: 'typography', label: 'Typography & Milestones', icon: HiPaintBrush },
    { id: 'settings', label: 'Display & Layout', icon: HiAdjustmentsHorizontal },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans">
      {/* Section Header */}
      <AdminSectionHeader
        title="About & Biography"
        description="Manage Indira Thakur's biography, artistic philosophy, milestones, founder portraits, and collapsible extended bio."
        previewUrl="/about"
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

      {/* TAB 1: STORY & BIOGRAPHY */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <AdminCard
            title="Artist Identity & Headings"
            description="Core headlines and category badges presented at the top of the artist section."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Eyebrow Category Badge
                </label>
                <input
                  type="text"
                  value={about.eyebrow || ''}
                  onChange={(e) => handleChange('eyebrow', e.target.value)}
                  placeholder="THE ARTIST & STORYTELLER"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Artist Display Name
                </label>
                <input
                  type="text"
                  value={about.heading || ''}
                  onChange={(e) => handleChange('heading', e.target.value)}
                  placeholder="Indira Thakur"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                Subheading / City & Craft Tagline
              </label>
              <input
                type="text"
                value={about.subheading || ''}
                onChange={(e) => handleChange('subheading', e.target.value)}
                placeholder="Lifestyle Stills & Films • Mumbai"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </AdminCard>

          <AdminCard
            title="Biography & Written Narrative"
            description="Craft the narrative flow of Indira's journey from introductory paragraphs to the expandable extended biography."
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Introductory Story (Paragraph 1)
                </label>
                <textarea
                  value={about.story || ''}
                  onChange={(e) => handleChange('story', e.target.value)}
                  rows={4}
                  placeholder="I am Indira Thakur, a passionate storyteller and professional photographer..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Specialization & Background (Paragraph 2)
                </label>
                <textarea
                  value={about.storyContinued || ''}
                  onChange={(e) => handleChange('storyContinued', e.target.value)}
                  rows={3}
                  placeholder="I am a certified newborn photographer and specialise in child photography, maternity..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Philosophy Statement (Featured Quote)
                </label>
                <textarea
                  value={about.philosophy || ''}
                  onChange={(e) => handleChange('philosophy', e.target.value)}
                  rows={2}
                  placeholder="Photography, for me, is much more than taking pictures."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Extended Biography (Full story on /about page)
                </label>
                <textarea
                  value={about.extendedBio || about.journeyContinued || ''}
                  onChange={(e) => {
                    handleChange('extendedBio', e.target.value);
                    handleChange('journeyContinued', e.target.value);
                  }}
                  rows={5}
                  placeholder="Write the in-depth artist journey, film achievements, and creative milestones that expand on /about..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 2: PHOTOGRAPHY & MEDIA */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <AdminCard
            title="Founder Portrait & Studio Visuals"
            description="Manage the high-resolution portrait of Indira Thakur and the supporting craft imagery displayed across the site."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MediaUploader
                label="1. Founder Main Portrait *"
                description="Primary artist portrait of Indira Thakur."
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
                description="Camera craft and behind-the-scenes artistry."
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
                description="Client heirloom memory or heirloom portrait session."
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
          </AdminCard>
        </div>
      )}

      {/* TAB 3: TYPOGRAPHY & MILESTONES */}
      {activeTab === 'typography' && (
        <div className="space-y-8">
          <AdminCard
            title="Milestone & Achievement Counters"
            description="Numeric highlight counters displayed below the biography narrative."
            headerAction={
              <button
                type="button"
                onClick={() => {
                  const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                  handleChange('stats', [...currentStats, { value: '10+', label: 'New Milestone' }]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] hover:bg-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
                <span>Add Counter</span>
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {statsList.map((stat: any, idx: number) => (
                <div key={idx} className="p-4 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-[#C39E96] font-semibold">
                      Stat #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                        handleChange(
                          'stats',
                          currentStats.filter((_, i) => i !== idx)
                        );
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                      title="Remove Counter"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-semibold text-[#7C706D] uppercase mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={stat.value || ''}
                        onChange={(e) => {
                          const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                          currentStats[idx] = { ...currentStats[idx], value: e.target.value };
                          handleChange('stats', currentStats);
                        }}
                        placeholder="13+"
                        className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-[#7C706D] uppercase mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={stat.label || ''}
                        onChange={(e) => {
                          const currentStats = Array.isArray(about.stats) ? [...about.stats] : [...statsList];
                          currentStats[idx] = { ...currentStats[idx], label: e.target.value };
                          handleChange('stats', currentStats);
                        }}
                        placeholder="Years of Experience"
                        className="w-full px-3 py-2 bg-white border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="About Section Typography"
            description="Select any text element to customize its font family, font size, weight, and color palette."
          >
            <FocusedTypographyManager elements={typographyElements} />
          </AdminCard>
        </div>
      )}

      {/* TAB 4: DISPLAY & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminCard
            title="Section Layout & CTAs"
            description="Configure action buttons, links, and layout presentation for the About section."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={about.ctaText || 'Read Full Story'}
                  onChange={(e) => handleChange('ctaText', e.target.value)}
                  placeholder="Read Full Story"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Primary Button Destination URL
                </label>
                <input
                  type="text"
                  value={about.ctaLink || '/about'}
                  onChange={(e) => handleChange('ctaLink', e.target.value)}
                  placeholder="/about"
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
        onReset={() => setAbout(savedAbout)}
        label="About Biography Settings"
      />
    </div>
  );
}
