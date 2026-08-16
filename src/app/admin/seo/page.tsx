'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiGlobeAlt, HiShare, HiEye, HiArrowPath } from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import { SITE_METADATA } from '@/lib/seoConfig';

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: string;
  favicon: string;
}

export default function AdminSEOPage() {
  const [seo, setSeo] = useState<SEOSettings>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCard: 'summary_large_image',
    favicon: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'google' | 'og' | 'twitter'>('google');

  const fetchSeo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/seo', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch SEO settings');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setSeo({
          metaTitle: data.metaTitle || data.title || SITE_METADATA.targetedKeywords ? `Indira Thakur Photography | Best Maternity & Newborn Photographer in Tilak Nagar, Chembur, Mumbai` : '',
          metaDescription: data.metaDescription || data.description || 'Premier Mumbai maternity photographer, best newborn photographer in Chembur, birth photographer, and luxury family portrait studio in Tilak Nagar, Chembur, Mumbai by Indira Thakur.',
          keywords: data.keywords || SITE_METADATA.targetedKeywords.join(', '),
          canonicalUrl: data.canonicalUrl || 'https://indirathakurphotography.com',
          ogTitle: data.ogTitle || data.metaTitle || 'Indira Thakur Photography | Fine Art Newborn & Maternity Studio Mumbai',
          ogDescription: data.ogDescription || data.metaDescription || 'Premier luxury photographer specializing in newborn, maternity, portrait, and wedding storytelling in Tilak Nagar, Chembur, Mumbai, Maharashtra, India.',
          ogImage: data.ogImage || 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
          twitterTitle: data.twitterTitle || data.ogTitle || 'Indira Thakur Photography | Luxury Photography Studio Mumbai',
          twitterDescription: data.twitterDescription || data.ogDescription || 'Bespoke fine art photographer specializing in newborn, maternity, and portrait photography in Tilak Nagar, Chembur, Mumbai.',
          twitterImage: data.twitterImage || data.ogImage || 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
          twitterCard: data.twitterCard || 'summary_large_image',
          favicon: data.favicon || 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load SEO configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeo();
  }, [fetchSeo]);

  const handleChange = (field: keyof SEOSettings, value: string) => {
    setSeo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const res = await fetch('/api/seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(seo),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save SEO settings');
      }

      setSuccess('SEO configuration saved and verified live in database!');
    } catch (err: any) {
      setError(err?.message || 'Error saving SEO settings');
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
            <HiGlobeAlt className="w-7 h-7 text-[#C39E96]" />
            Search Engine & Social Metadata CMS
          </h1>
          <p className="font-sans text-sm text-[#7C706D] mt-1">
            Configure metadata, Open Graph cards, Twitter cards, keywords, and favicons for Tilak Nagar, Chembur, Mumbai.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Search Engine Meta */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
            <HiGlobeAlt className="w-5 h-5 text-[#C39E96]" />
            Core Search Engine Metadata
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={seo.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                placeholder="Indira Thakur Photography | Best Maternity & Newborn Photographer in Tilak Nagar, Chembur, Mumbai"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
              <p className="text-[11px] text-[#7C706D] mt-1">Recommended length: 50–60 characters ({seo.metaTitle.length} chars)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Meta Description
              </label>
              <textarea
                value={seo.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                rows={3}
                placeholder="Premier Mumbai maternity photographer, best newborn photographer in Chembur, birth photographer, and luxury family portrait studio in Tilak Nagar, Chembur, Mumbai."
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
              <p className="text-[11px] text-[#7C706D] mt-1">Recommended length: 150–160 characters ({seo.metaDescription.length} chars)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Canonical URL
              </label>
              <input
                type="url"
                value={seo.canonicalUrl}
                onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                placeholder="https://indirathakurphotography.com"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D]">
                  Keywords (Targeted Local & Service Strategy)
                </label>
                <span className="text-[11px] text-[#C39E96] font-medium">
                  {seo.keywords.split(',').filter(Boolean).length} Keywords Active
                </span>
              </div>
              <textarea
                value={seo.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                rows={5}
                placeholder="photographer, newborn photography, maternity portrait, fine art portraiture, Tilak Nagar, Chembur, Mumbai..."
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>
        </div>

        {/* Open Graph Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
            <HiShare className="w-5 h-5 text-[#C39E96]" />
            Open Graph (Facebook, LinkedIn, WhatsApp)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                OG Title
              </label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => handleChange('ogTitle', e.target.value)}
                placeholder="Indira Thakur Photography | Fine Art Studio Mumbai"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                OG Description
              </label>
              <textarea
                value={seo.ogDescription}
                onChange={(e) => handleChange('ogDescription', e.target.value)}
                rows={2}
                placeholder="Bespoke luxury photographer in Tilak Nagar, Chembur, Mumbai..."
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div className="md:col-span-2">
              <MediaUploader
                label="Open Graph Image (1200 x 630 px)"
                description="Upload, drag & drop, or paste URL for social preview thumbnail."
                value={seo.ogImage}
                onChange={(url) => handleChange('ogImage', url)}
                aspectRatio="aspect-[1200/630]"
                folder="seo"
              />
            </div>
          </div>
        </div>

        {/* Twitter Card Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
            <HiShare className="w-5 h-5 text-[#C39E96]" />
            Twitter / X Metadata
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Twitter Card Style
              </label>
              <select
                value={seo.twitterCard}
                onChange={(e) => handleChange('twitterCard', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              >
                <option value="summary_large_image">Summary Card with Large Image (Recommended)</option>
                <option value="summary">Standard Summary Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Twitter Title
              </label>
              <input
                type="text"
                value={seo.twitterTitle}
                onChange={(e) => handleChange('twitterTitle', e.target.value)}
                placeholder="Indira Thakur Photography | Luxury Photography Studio Mumbai"
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Twitter Description
              </label>
              <textarea
                value={seo.twitterDescription}
                onChange={(e) => handleChange('twitterDescription', e.target.value)}
                rows={2}
                placeholder="Bespoke fine art photographer specializing in newborn, maternity, and portrait photography in Tilak Nagar, Chembur, Mumbai."
                className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>

            <div className="md:col-span-2">
              <MediaUploader
                label="Twitter / X Header Image"
                description="Upload or specify URL for Twitter link preview card."
                value={seo.twitterImage}
                onChange={(url) => handleChange('twitterImage', url)}
                aspectRatio="aspect-[1200/630]"
                folder="seo"
              />
            </div>
          </div>
        </div>

        {/* Favicon & Site Icon */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
            <HiGlobeAlt className="w-5 h-5 text-[#C39E96]" />
            Favicon & Site Icon
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <MediaUploader
                label="Favicon / Touch Icon (Square PNG/WEBP)"
                description="Upload square logo icon for browser tab and mobile bookmarks."
                value={seo.favicon}
                onChange={(url) => handleChange('favicon', url)}
                aspectRatio="aspect-square"
                folder="seo"
              />
            </div>
          </div>
        </div>

        {/* Visual Live Preview Card */}
        <div className="bg-[#FAF6F3] p-6 rounded-xl border border-[#E7DDD2] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
            <h3 className="font-serif text-base font-medium text-[#2B2625] flex items-center gap-2">
              <HiEye className="w-5 h-5 text-[#C39E96]" />
              Live Search & Social Card Simulation
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setPreviewTab('google')}
                className={`px-3 py-1 rounded-md transition-colors ${previewTab === 'google' ? 'bg-[#2B2625] text-white' : 'bg-white text-[#7C706D] border border-[#E7DDD2]'}`}
              >
                Google Search
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('og')}
                className={`px-3 py-1 rounded-md transition-colors ${previewTab === 'og' ? 'bg-[#2B2625] text-white' : 'bg-white text-[#7C706D] border border-[#E7DDD2]'}`}
              >
                Open Graph Card
              </button>
            </div>
          </div>

          {previewTab === 'google' ? (
            <div className="bg-white p-4 rounded-lg border border-[#E7DDD2] space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#202124]">
                <span className="text-xs text-[#4d5156]">https://indirathakurphotography.com</span>
              </div>
              <h4 className="text-lg text-[#1a0dab] font-sans hover:underline cursor-pointer leading-tight">
                {seo.metaTitle || 'Indira Thakur Photography'}
              </h4>
              <p className="text-sm text-[#4d5156] leading-snug">
                {seo.metaDescription || 'Premier maternity, newborn and fine art portrait studio.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E7DDD2] overflow-hidden max-w-lg mx-auto shadow-sm">
              {seo.ogImage ? (
                <div className="aspect-[1200/630] relative bg-[#2B2625]/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={seo.ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[1200/630] bg-[#FAF6F3] flex items-center justify-center text-xs text-[#7C706D]">
                  No Open Graph Image Set
                </div>
              )}
              <div className="p-4 bg-[#F8F9FA] space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#7C706D]">INDIRATHAKURPHOTOGRAPHY.COM</span>
                <h4 className="text-sm font-semibold text-[#1C1E21] leading-tight">
                  {seo.ogTitle || seo.metaTitle || 'Indira Thakur Photography'}
                </h4>
                <p className="text-xs text-[#606770] line-clamp-2">
                  {seo.ogDescription || seo.metaDescription || 'Fine art photography studio.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-8 py-3 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-md"
          >
            {saving ? 'Saving & Verifying DB...' : 'Save SEO Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
