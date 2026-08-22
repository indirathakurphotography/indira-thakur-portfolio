'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiSparkles,
  HiPlus,
  HiTrash,
  HiGlobeAlt,
  HiPaintBrush,
  HiPhone,
  HiShare,
  HiTag,
  HiDocumentText,
} from 'react-icons/hi2';
import {
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaPinterestP,
} from 'react-icons/fa6';
import { DEFAULT_FOOTER_CONFIG, type FooterConfigData } from '@/types/footer';
import AdminCardSection from '@/components/admin/AdminCardSection';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';

function getAdminHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminFooterPage() {
  const [formData, setFormData] = useState<FooterConfigData>(DEFAULT_FOOTER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/footer', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load footer configuration.');
      const data = await res.json();
      setFormData(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load footer configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setNotice(null);

      const res = await fetch('/api/footer', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save footer settings.');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setNotice('Footer settings saved and synced to MongoDB successfully.');
      setFormData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to save footer settings.');
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (formData.keywords.includes(newKeyword.trim())) {
      setNewKeyword('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, newKeyword.trim()],
    }));
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#7C706D] uppercase tracking-wider">Loading Footer Configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DDD2] shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiGlobeAlt className="w-3.5 h-3.5" />
            Global Footer Management
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B2625] font-normal mt-2">
            Footer Configuration & Brand Details
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans max-w-2xl">
            Customize the editorial footer copy, contact info, social links, booking buttons, and SEO tags.
          </p>
        </div>
        <button
          onClick={() => save()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          <HiSparkles className="w-4 h-4 text-[#C39E96]" />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <HiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        {/* 1. Brand Narrative & Tagline */}
        <AdminCardSection
          title="1. Brand Narrative & Tagline"
          description="Headline subtitles, biography synopsis, and the primary session booking link."
          icon={<HiDocumentText className="w-5 h-5" />}
          badge="Brand Narrative"
          defaultOpen={true}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Tagline (Editorial Subtitle)
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. FINE ART PHOTOGRAPHY"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Booking Button Label & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.bookButtonText}
                  onChange={(e) => setFormData({ ...formData, bookButtonText: e.target.value })}
                  placeholder="Book a Session"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
                <input
                  type="text"
                  value={formData.bookButtonLink}
                  onChange={(e) => setFormData({ ...formData, bookButtonLink: e.target.value })}
                  placeholder="/contact"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
              Footer Bio Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>
        </AdminCardSection>

        {/* 2. Direct Contact Information */}
        <AdminCardSection
          title="2. Direct Contact Information"
          description="Studio communication channels displayed in the footer columns."
          icon={<HiPhone className="w-5 h-5" />}
          badge="Direct Channels"
          defaultOpen={false}
        >
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Direct Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="photography@indirathakur.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Phone Number / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98196 20484"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Studio Location / Address
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Tilak Nagar, Chembur, Mumbai, India"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
        </AdminCardSection>

        {/* 3. Social Media Links */}
        <AdminCardSection
          title="3. Social Media Channels"
          description="Connect social channels shown in the footer. Leave empty to hide any channel."
          icon={<HiShare className="w-5 h-5" />}
          badge="Social Icons"
          defaultOpen={false}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                <FaInstagram className="text-[#E1306C]" /> Instagram Profile URL
              </label>
              <input
                type="text"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://www.instagram.com/indirathakurphotography/"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                <FaWhatsapp className="text-[#25D366]" /> WhatsApp Link or Number
              </label>
              <input
                type="text"
                value={formData.whatsappUrl}
                onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                placeholder="+919819620484 or https://wa.me/919819620484"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                <FaYoutube className="text-[#FF0000]" /> YouTube Channel URL
              </label>
              <input
                type="text"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/@indirathakurphotography"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                <FaFacebookF className="text-[#1877F2]" /> Facebook Page URL
              </label>
              <input
                type="text"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/indirathakurphotography"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                <FaLinkedinIn className="text-[#0A66C2]" /> LinkedIn Profile URL
              </label>
              <input
                type="text"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                <FaPinterestP className="text-[#BD081C]" /> Pinterest URL
              </label>
              <input
                type="text"
                value={formData.pinterestUrl}
                onChange={(e) => setFormData({ ...formData, pinterestUrl: e.target.value })}
                placeholder="https://pinterest.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
        </AdminCardSection>

        {/* 4. SEO Keyword Tags */}
        <AdminCardSection
          title="4. SEO Keyword Tags"
          description="Metadata tags indexed and displayed in the bottom footer row."
          icon={<HiTag className="w-5 h-5" />}
          badge={`${formData.keywords.length} Keywords`}
          defaultOpen={false}
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="e.g. Newborn Photographer Mumbai"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534]"
              >
                <HiPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-xs text-[#2B2625]"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(idx)}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-xs"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </AdminCardSection>

        {/* 5. Typography Customization */}
        <AdminCardSection
          title="5. Footer Typography Customization"
          description="Select any text element to customize its font size, font family, font weight, and color independently."
          icon={<HiPaintBrush className="w-5 h-5" />}
          badge="Independent Typography"
          defaultOpen={false}
        >
          <SectionTypographyManager
            title="Footer Text Elements"
            description="Click on any text element card below to open its specific typography controls."
            elements={[
              {
                id: 'brandTitle',
                label: 'Brand Title / Studio Name',
                sublabel: 'Prominent logo title in the footer (e.g., Indira Thakur Photography)',
                value: formData.brandTitleTypography,
                onChange: (val) => setFormData((prev) => ({ ...prev, brandTitleTypography: val })),
                defaultColor: '#FAF6F3',
              },
              {
                id: 'tagline',
                label: 'Editorial Tagline',
                sublabel: 'Category label below brand title (e.g., FINE ART PHOTOGRAPHY)',
                value: formData.taglineTypography,
                onChange: (val) => setFormData((prev) => ({ ...prev, taglineTypography: val })),
                defaultColor: '#C39E96',
              },
              {
                id: 'description',
                label: 'Footer Bio Narrative',
                sublabel: 'Short studio summary paragraph in the first footer column',
                value: formData.descriptionTypography,
                onChange: (val) => setFormData((prev) => ({ ...prev, descriptionTypography: val })),
                defaultColor: '#A89E9B',
              },
              {
                id: 'columnHeader',
                label: 'Column Section Headers',
                sublabel: 'Headers like "EXPLORE", "COLLECTIONS", "STUDIO", "JOURNAL"',
                value: formData.columnHeaderTypography,
                onChange: (val) => setFormData((prev) => ({ ...prev, columnHeaderTypography: val })),
                defaultColor: '#FAF6F3',
              },
              {
                id: 'navLinks',
                label: 'Navigation & Contact Links',
                sublabel: 'Clickable navigation items and contact details',
                value: formData.navLinksTypography,
                onChange: (val) => setFormData((prev) => ({ ...prev, navLinksTypography: val })),
                defaultColor: '#D3C8C4',
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
            <span>{saving ? 'Saving to Database...' : 'Save All Footer Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
