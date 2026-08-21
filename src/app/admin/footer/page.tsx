'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiSparkles,
  HiPlus,
  HiTrash,
  HiArrowTopRightOnSquare,
  HiGlobeAlt,
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
import TypographyControl from '@/components/admin/TypographyControl';

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiGlobeAlt className="w-3.5 h-3.5" />
            Global Footer Management
          </div>
          <h1 className="font-serif text-3xl text-[#2B2625] font-normal mt-2">
            Footer Configuration & Brand Details
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans">
            Customize the editorial footer copy, contact info, social links, booking buttons, and SEO tags.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-xs"
        >
          <HiSparkles className="w-4 h-4 text-[#C39E96]" />
          {saving ? 'Saving to Database...' : 'Save All Changes'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <HiExclamationCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <HiCheckCircle className="w-5 h-5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={save} className="space-y-8">
        {/* 1. Brand Narrative & Tagline */}
        <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Brand Statement & Tagline
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Tagline (Editorial Subtitle)
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. FINE ART PHOTOGRAPHY"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Booking Button Label & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.bookButtonText}
                  onChange={(e) => setFormData({ ...formData, bookButtonText: e.target.value })}
                  placeholder="Book a Session"
                  className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
                <input
                  type="text"
                  value={formData.bookButtonLink}
                  onChange={(e) => setFormData({ ...formData, bookButtonLink: e.target.value })}
                  placeholder="/contact"
                  className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Footer Bio Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>

        {/* 2. Direct Contact Information */}
        <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Contact Information
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Direct Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="photography@indirathakur.com"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Phone Number / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98196 20484"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2B2625] mb-1">
                Studio Location / Physical Address
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Tilak Nagar, Chembur, Mumbai, India"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
        </div>

        {/* 3. Social Media Journal Links */}
        <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Social Media Links
          </h2>
          <p className="text-xs text-[#7C706D]">
            Leave empty any platform you do not wish to display in the footer.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#2B2625] mb-1">
                <FaInstagram className="text-[#E1306C]" /> Instagram Profile URL
              </label>
              <input
                type="text"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://www.instagram.com/indirathakurphotography/"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#2B2625] mb-1">
                <FaWhatsapp className="text-[#25D366]" /> WhatsApp Number or Chat Link
              </label>
              <input
                type="text"
                value={formData.whatsappUrl}
                onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                placeholder="+919819620484 or https://wa.me/919819620484"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#2B2625] mb-1">
                <FaYoutube className="text-[#FF0000]" /> YouTube Channel URL
              </label>
              <input
                type="text"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/@indirathakurphotography"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#2B2625] mb-1">
                <FaFacebookF className="text-[#1877F2]" /> Facebook Page URL
              </label>
              <input
                type="text"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/indirathakurphotography"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#2B2625] mb-1">
                <FaLinkedinIn className="text-[#0A66C2]" /> LinkedIn Profile URL
              </label>
              <input
                type="text"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/indirathakur"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#2B2625] mb-1">
                <FaPinterestP className="text-[#E60023]" /> Pinterest Profile URL
              </label>
              <input
                type="text"
                value={formData.pinterestUrl}
                onChange={(e) => setFormData({ ...formData, pinterestUrl: e.target.value })}
                placeholder="https://pinterest.com/indirathakurphotography"
                className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
        </div>

        {/* 4. SEO & Coverage Keywords */}
        <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Specialized Services & Coverage Keywords
          </h2>
          <p className="text-xs text-[#7C706D]">
            These badges appear at the bottom of the footer for local search authority and user discovery.
          </p>

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
              placeholder="e.g. Newborn Photography Chembur Mumbai"
              className="flex-1 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534]"
            >
              <HiPlus className="w-4 h-4" /> Add Tag
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FAF6F3] text-xs font-sans text-[#2B2625] border border-[#E7DDD2]"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(i)}
                  className="text-[#7C706D] hover:text-rose-600 ml-1"
                >
                  <HiTrash className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 5. Copyright & Legal */}
        <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B2625] border-b border-[#E7DDD2]/60 pb-3">
            Copyright Notice & Legal Attribution
          </h2>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Copyright Text
            </label>
            <input
              type="text"
              value={formData.copyright}
              onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>

        {/* 6. Footer Global Typography Controls */}
        <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-serif text-xl text-[#2B2625]">
              Footer Typography Styling
            </h2>
            <p className="font-sans text-xs text-[#7C706D] mt-0.5">
              Customize font size, font family, font weight, and text colors for all elements across the footer.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-2">
            <TypographyControl
              label="Brand / Site Title Typography"
              sublabel="Styles the text brand name if no logo image is displayed"
              value={formData.brandTitleTypography}
              onChange={(val) => setFormData({ ...formData, brandTitleTypography: val })}
              defaultColor="#FAF6F3"
            />
            <TypographyControl
              label="Tagline / Subtitle Typography"
              sublabel="Styles the 'FINE ART PHOTOGRAPHY' tagline"
              value={formData.taglineTypography}
              onChange={(val) => setFormData({ ...formData, taglineTypography: val })}
              defaultColor="#C39E96"
            />
            <TypographyControl
              label="Description / Bio Typography"
              sublabel="Styles the editorial studio description paragraph"
              value={formData.descriptionTypography}
              onChange={(val) => setFormData({ ...formData, descriptionTypography: val })}
              defaultColor="rgba(255, 255, 255, 0.5)"
            />
            <TypographyControl
              label="Column Headers Typography"
              sublabel="Styles 'Navigation', 'Get In Touch', and section category headings"
              value={formData.columnHeaderTypography}
              onChange={(val) => setFormData({ ...formData, columnHeaderTypography: val })}
              defaultColor="#C39E96"
            />
            <TypographyControl
              label="Navigation & Info Links Typography"
              sublabel="Styles footer menu items and contact items"
              value={formData.navLinksTypography}
              onChange={(val) => setFormData({ ...formData, navLinksTypography: val })}
              defaultColor="rgba(255, 255, 255, 0.5)"
            />
            <TypographyControl
              label="Copyright Text Typography"
              sublabel="Styles the copyright notice line at the bottom"
              value={formData.copyrightTypography}
              onChange={(val) => setFormData({ ...formData, copyrightTypography: val })}
              defaultColor="rgba(255, 255, 255, 0.9)"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-md"
          >
            <HiSparkles className="w-4 h-4 text-[#C39E96]" />
            {saving ? 'Saving...' : 'Save All Footer Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
