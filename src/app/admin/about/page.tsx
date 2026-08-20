'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiHeart, HiCheck, HiPhoto } from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';

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

      setSuccess('About section updated and verified live!');
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] flex items-center gap-2">
          <HiHeart className="w-7 h-7 text-[#C39E96]" />
          About & Artist Biography CMS
        </h1>
        <p className="font-sans text-sm text-[#7C706D] mt-1">
          Manage Indira Thakur's biography, fine art philosophy, journey milestones, and studio photography assets.
        </p>
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
        {/* Main Biography Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3">
            Artist Identity & Headlines
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Eyebrow Category
              </label>
              <input
                type="text"
                value={about.eyebrow || ''}
                onChange={(e) => handleChange('eyebrow', e.target.value)}
                placeholder="THE ARTIST & VISIONARY"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Heading / Artist Name
              </label>
              <input
                type="text"
                value={about.heading || ''}
                onChange={(e) => handleChange('heading', e.target.value)}
                placeholder="Indira Thakur"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Subheading / Tagline
            </label>
            <input
              type="text"
              value={about.subheading || ''}
              onChange={(e) => handleChange('subheading', e.target.value)}
              placeholder="Former Journalist Turning Human Emotion into Fine Art Storytelling in Mumbai"
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Biography / Story Paragraph 1
            </label>
            <textarea
              value={about.story || ''}
              onChange={(e) => handleChange('story', e.target.value)}
              rows={4}
              placeholder="Indira Thakur's artistic journey began in investigative journalism..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Biography / Story Paragraph 2
            </label>
            <textarea
              value={about.storyContinued || ''}
              onChange={(e) => handleChange('storyContinued', e.target.value)}
              rows={4}
              placeholder="With a focus on luxury newborn, maternity, and family portraiture in Tilak Nagar, Chembur, Mumbai..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>
        </div>

        {/* Philosophy & Milestones */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3">
            Philosophy & Experience
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Creative Philosophy (Highlighted Quote)
            </label>
            <textarea
              value={about.philosophy || ''}
              onChange={(e) => handleChange('philosophy', e.target.value)}
              rows={3}
              placeholder="Photography, for me, is much more than taking pictures."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Journey & Milestones Narrative (Story Paragraph 3)
            </label>
            <textarea
              value={about.journey || ''}
              onChange={(e) => handleChange('journey', e.target.value)}
              rows={3}
              placeholder="It is about preserving emotions, celebrating life, documenting milestones..."
              className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>
        </div>

        {/* Homepage & Story Statistics */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#2B2625]">
                Key Milestone Statistics
              </h2>
              <p className="font-sans text-xs text-[#7C706D]">
                These statistics appear on the homepage and about narrative (e.g., Years of Experience, Families Documented).
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
                        const currentStats = Array.isArray(about.stats)
                          ? [...about.stats]
                          : [
                              { value: '13+', label: 'Years of Experience' },
                              { value: '500+', label: 'Families Documented' },
                              { value: '15+', label: 'Publications & Festivals' },
                              { value: '100%', label: 'Satisfaction Rating' },
                            ];
                        currentStats[idx] = { ...currentStats[idx], value: e.target.value };
                        handleChange('stats', currentStats);
                      }}
                      placeholder="13+"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7DDD2] rounded text-sm text-[#2B2625] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-[#7C706D] uppercase">Label / Description</label>
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => {
                        const currentStats = Array.isArray(about.stats)
                          ? [...about.stats]
                          : [
                              { value: '13+', label: 'Years of Experience' },
                              { value: '500+', label: 'Families Documented' },
                              { value: '15+', label: 'Publications & Festivals' },
                              { value: '100%', label: 'Satisfaction Rating' },
                            ];
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

        {/* Media Management Section with Drag & Drop MediaUploader */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
            <HiPhoto className="w-5 h-5 text-[#C39E96]" />
            Founder Portrait
          </h2>

          <div className="max-w-md">
            <MediaUploader
              label="Founder Portrait (Live Website)"
              description="Primary portrait of Indira Thakur displayed on the homepage and about page."
              value={about.images?.founderPortrait?.url || ''}
              onChange={(url) => handleImageChange('founderPortrait', url)}
              aspectRatio="aspect-[4/5]"
              folder="about"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-8 py-3 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-md"
          >
            {saving ? 'Saving & Verifying DB...' : 'Save About Page Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
