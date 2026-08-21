'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import MediaUploader from '@/components/admin/MediaUploader';
import TypographyControl from '@/components/admin/TypographyControl';
import { 
  HiDocumentText, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiArrowPath, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiStar,
  HiXMark
} from 'react-icons/hi2';

interface ServiceItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  cta?: string;
  heroImage?: string;
  image?: string;
  featured?: boolean;
  order: number;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Services Overview Header State
  const [overviewEyebrow, setOverviewEyebrow] = useState('BESPOKE COLLECTIONS');
  const [overviewHeading, setOverviewHeading] = useState('Bespoke Photography Services');
  const [overviewDescription, setOverviewDescription] = useState('Every portrait session is tailored with infinite care, artistic vision, and gentle guidance.');
  const [eyebrowTypography, setEyebrowTypography] = useState<any>({});
  const [headingTypography, setHeadingTypography] = useState<any>({});
  const [descriptionTypography, setDescriptionTypography] = useState<any>({});
  const [cardTitleTypography, setCardTitleTypography] = useState<any>({});
  const [cardDescriptionTypography, setCardDescriptionTypography] = useState<any>({});
  const [savingOverview, setSavingOverview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    cta: 'View Portfolio',
    heroImage: '',
    featured: false,
    order: 0,
  });

  const fetchOverviewConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.services) {
          if (data.services.eyebrow) setOverviewEyebrow(data.services.eyebrow);
          if (data.services.heading) setOverviewHeading(data.services.heading);
          if (data.services.description) setOverviewDescription(data.services.description);
          if (data.services.eyebrowTypography) setEyebrowTypography(data.services.eyebrowTypography);
          if (data.services.headingTypography) setHeadingTypography(data.services.headingTypography);
          if (data.services.descriptionTypography) setDescriptionTypography(data.services.descriptionTypography);
          if (data.services.cardTitleTypography) setCardTitleTypography(data.services.cardTitleTypography);
          if (data.services.cardDescriptionTypography) setCardDescriptionTypography(data.services.cardDescriptionTypography);
        }
      }
    } catch (e) {
      console.warn('Could not fetch site config for services overview:', e);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/services', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch services from database');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchOverviewConfig();
  }, [fetchServices, fetchOverviewConfig]);

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingOverview(true);
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          services: {
            eyebrow: overviewEyebrow,
            heading: overviewHeading,
            description: overviewDescription,
            eyebrowTypography,
            headingTypography,
            descriptionTypography,
            cardTitleTypography,
            cardDescriptionTypography,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update services overview header');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }
      setFeedback({ type: 'success', msg: 'Services section & typography updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to update section header.' });
    } finally {
      setSavingOverview(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      cta: 'View Portfolio',
      heroImage: '',
      featured: false,
      order: services.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingItem(service);
    setFormData({
      title: service.title || '',
      slug: service.slug || '',
      description: service.description || '',
      cta: service.cta || 'View Portfolio',
      heroImage: service.heroImage || (typeof service.image === 'string' ? service.image : '') || '',
      featured: !!service.featured,
      order: service.order ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Service title is required');
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const generatedSlug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = { ...formData, slug: generatedSlug };

      let res;
      if (editingItem) {
        res = await fetch('/api/services', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ _id: editingItem._id, ...payload }),
        });
      } else {
        res = await fetch('/api/services', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Failed to save service in database');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: editingItem ? 'Service package updated!' : 'New service package created!' });
      setModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving service.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photography service package?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: 'Service deleted successfully.' });
      fetchServices();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete service package.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiDocumentText className="w-3.5 h-3.5" />
            Offerings & Services Engine
          </div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal mt-1">
            Photography Packages ({services.length})
          </h1>
          <p className="font-sans text-xs text-[#7C706D]">
            Manage session packages, descriptions, pricing, hero banners, and call-to-action buttons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServices}
            disabled={loading}
            className="p-2.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] hover:bg-white transition-colors"
            title="Refresh database records"
          >
            <HiArrowPath className={`w-4 h-4 text-[#C39E96] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-all shadow-sm"
          >
            <HiPlus className="w-4 h-4 text-[#C39E96]" />
            <span>Add Package</span>
          </button>
        </div>
      </div>

      {/* Services Overview Section Header Card */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7DDD2]/60 pb-3">
          <div>
            <h2 className="font-serif text-lg text-[#2B2625] font-medium">Services Page Header Content</h2>
            <p className="font-sans text-xs text-[#7C706D]">Edit the main heading and introductory description displayed on the public Services section.</p>
          </div>
        </div>
        <form onSubmit={handleSaveOverview} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#2B2625] font-medium mb-1">Eyebrow Tag</label>
              <input
                type="text"
                value={overviewEyebrow}
                onChange={(e) => setOverviewEyebrow(e.target.value)}
                placeholder="BESPOKE COLLECTIONS"
                className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
            <div>
              <label className="block text-[#2B2625] font-medium mb-1">Main Heading</label>
              <input
                type="text"
                value={overviewHeading}
                onChange={(e) => setOverviewHeading(e.target.value)}
                placeholder="Bespoke Photography Services"
                className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#2B2625] font-medium mb-1">Introduction Description</label>
            <textarea
              rows={2}
              value={overviewDescription}
              onChange={(e) => setOverviewDescription(e.target.value)}
              placeholder="Every portrait session is tailored with infinite care..."
              className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          {/* Typography Customization Section */}
          <div className="pt-4 border-t border-[#E7DDD2]/70 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2B2625]">
              Services Typography & Text Styling
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <TypographyControl
                label="Eyebrow Category Typography"
                sublabel="Styles the 'BESPOKE COLLECTIONS' section header badge"
                value={eyebrowTypography}
                onChange={setEyebrowTypography}
                defaultColor="#C39E96"
              />
              <TypographyControl
                label="Main Section Heading Typography"
                sublabel="Styles 'Bespoke Photography Services' section title"
                value={headingTypography}
                onChange={setHeadingTypography}
                defaultColor="#2B2625"
              />
              <TypographyControl
                label="Header Intro Description Typography"
                sublabel="Styles the introductory paragraph below the services heading"
                value={descriptionTypography}
                onChange={setDescriptionTypography}
                defaultColor="#7C706D"
              />
              <TypographyControl
                label="Service Card Package Title Typography"
                sublabel="Styles each package title (e.g., Newborn Artistry, Maternity)"
                value={cardTitleTypography}
                onChange={setCardTitleTypography}
                defaultColor="#2B2625"
              />
              <TypographyControl
                label="Service Card Description Typography"
                sublabel="Styles the package detail paragraph inside each card"
                value={cardDescriptionTypography}
                onChange={setCardDescriptionTypography}
                defaultColor="#5C5250"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingOverview}
              className="px-5 py-2.5 bg-[#2B2625] text-white text-xs rounded-lg hover:bg-[#3D3534] transition-colors font-medium cursor-pointer"
            >
              {savingOverview ? 'Updating...' : 'Save Services Content & Typography'}
            </button>
          </div>
        </form>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <HiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#7C706D] hover:text-[#2B2625]"><HiXMark className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70">
          <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-[#7C706D]">Loading Photography Packages...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70 space-y-3">
          <HiDocumentText className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
          <p className="font-serif text-base text-[#2B2625]">No photography services defined in database.</p>
          <button onClick={openCreateModal} className="text-xs text-[#C39E96] hover:underline font-medium">Create your first service package</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const imgSrc = service.heroImage || (typeof service.image === 'string' ? service.image : '') || 'https://picsum.photos/seed/service/800/600';
            return (
              <div key={service._id} className="bg-white rounded-xl border border-[#E7DDD2]/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#2B2625] transition-all">
                <div>
                  <div className="relative aspect-[16/9] bg-[#FAF6F3]">
                    <Image
                      src={imgSrc}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {service.featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <HiStar className="w-3.5 h-3.5 fill-current" />
                        Featured
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#2B2625]/80 backdrop-blur-xs text-white text-[10px] font-mono">
                      #{service.order}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-serif text-lg text-[#2B2625] font-medium">{service.title}</h3>
                      <p className="font-sans text-xs text-[#7C706D] line-clamp-3 leading-relaxed mt-1">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#E7DDD2]/40 text-xs">
                      <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider">Public Offering</span>
                      <span className="font-mono text-[10px] text-[#7C706D]">{service.cta || 'View Portfolio'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF6F3]/50 border-t border-[#E7DDD2]/50 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#7C706D]">/{service.slug}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-1.5 rounded bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] text-xs flex items-center gap-1 font-medium"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="p-1.5 rounded bg-white border border-[#E7DDD2] text-rose-700 hover:bg-rose-50 text-xs"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7DDD2] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-4">
              <h2 className="font-serif text-xl text-[#2B2625]">
                {editingItem ? 'Edit Service Package' : 'Create Service Package'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#7C706D] hover:text-[#2B2625]">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Newborn Photography"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Custom Slug / URL Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. newborn-photography (auto-generated if left blank)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Button Text (CTA)</label>
                <input
                  type="text"
                  placeholder="e.g. View Portfolio"
                  value={formData.cta}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <MediaUploader
                label="Hero Image & Banner"
                description="Upload an image file (drag & drop or select) or paste an image URL. Shown on public package cards."
                value={formData.heroImage}
                onChange={(url) => setFormData({ ...formData, heroImage: url })}
                folder="services"
              />

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Full Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed description of what is included in this package (visible on public services cards)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-srv"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-[#2B2625] rounded"
                />
                <label htmlFor="featured-srv" className="text-[#2B2625] font-medium cursor-pointer">
                  Feature on Homepage Offerings Grid
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7DDD2]/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E7DDD2] text-[#7C706D] hover:text-[#2B2625]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#2B2625] text-white hover:bg-[#3D3534] uppercase font-medium tracking-wider"
                >
                  {saving ? 'Saving...' : 'Save to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
