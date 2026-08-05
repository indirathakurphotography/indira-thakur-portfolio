"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminSEOPage() {
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    twitterHandle: '',
    canonicalUrl: '',
  });
  const [initialSeo, setInitialSeo] = useState(seo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchSEO = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seo');
      if (!response.ok) throw new Error('Failed to fetch SEO settings');
      const data = await response.json();
      setSeo(data);
      setInitialSeo(data);
      setDirty(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSEO();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seo),
      });
      if (!response.ok) throw new Error('Failed to save');
      setInitialSeo(seo);
      setDirty(false);
      toast.success('Changes Saved Successfully');
    } catch {
      toast.error('Failed to Save Changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSeo(initialSeo);
    setDirty(false);
    toast.info('Changes discarded');
  };

  const handleChange = (field: string, value: string) => {
    setSeo(prev => {
      const next = { ...prev, [field]: value };
      return next;
    });
  };

  useEffect(() => {
    setDirty(JSON.stringify(seo) !== JSON.stringify(initialSeo));
  }, [seo, initialSeo]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl text-rich-black mb-2">SEO Settings</h1>
        <p className="font-sans text-sm text-warm-gray/60">Manage your website's SEO and metadata</p>
      </div>

      <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full p-4">
        <div className="bg-white border border-cream/50 rounded-lg p-6 space-y-6">
          <div>
            <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
              Site Title
            </label>
            <input
              type="text"
              value={seo.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              placeholder="Indira Thakur Photography"
            />
          </div>

          <div>
            <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
              Meta Description
            </label>
            <textarea
              value={seo.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 resize-none"
              placeholder="Professional photography services by Indira Thakur..."
            />
            <p className="font-sans text-xs text-warm-gray/40 mt-1">Max 160 characters for optimal SEO</p>
          </div>

          <div>
            <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={seo.keywords}
              onChange={(e) => handleChange('keywords', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              placeholder="photography, portraits, wedding, newborn, maternity"
            />
            <p className="font-sans text-xs text-warm-gray/40 mt-1">Separate keywords with commas</p>
          </div>

          <div>
            <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
              Open Graph Image URL
            </label>
            <input
              type="url"
              value={seo.ogImage}
              onChange={(e) => handleChange('ogImage', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="font-sans text-xs text-warm-gray/40 mt-1">Recommended: 1200x630px</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                Twitter Handle
              </label>
              <input
                type="text"
                value={seo.twitterHandle}
                onChange={(e) => handleChange('twitterHandle', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                placeholder="@indirathakur"
              />
            </div>

            <div>
              <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                Canonical URL
              </label>
              <input
                type="url"
                value={seo.canonicalUrl}
                onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                placeholder="https://indirathakur.com"
              />
            </div>
          </div>
        </div>
      </div>
      <StickySaveBar
        dirty={dirty}
        saving={saving}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}