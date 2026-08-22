'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import MediaUploader from '@/components/admin/MediaUploader';
import AdminSectionHeader from '@/components/admin/AdminSectionHeader';
import AdminSectionTabs, { AdminTabItem } from '@/components/admin/AdminSectionTabs';
import AdminCard from '@/components/admin/AdminCard';
import FocusedTypographyManager, { TypographyElementDef } from '@/components/admin/FocusedTypographyManager';
import StickySaveBar from '@/components/admin/StickySaveBar';
import {
  HiDocumentText,
  HiPlus,
  HiPencil,
  HiTrash,
  HiStar,
  HiXMark,
  HiSparkles,
  HiPaintBrush,
  HiAdjustmentsHorizontal,
  HiPhoto,
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
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'typography'>('content');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Services Overview Header State
  const [overviewEyebrow, setOverviewEyebrow] = useState('BESPOKE COLLECTIONS');
  const [overviewHeading, setOverviewHeading] = useState('Bespoke Photography Services');
  const [overviewDescription, setOverviewDescription] = useState(
    'Every portrait session is tailored with infinite care, artistic vision, and gentle guidance.'
  );
  const [savedOverview, setSavedOverview] = useState<any>({});
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
          const s = data.services;
          if (s.eyebrow) setOverviewEyebrow(s.eyebrow);
          if (s.heading) setOverviewHeading(s.heading);
          if (s.description) setOverviewDescription(s.description);
          if (s.eyebrowTypography) setEyebrowTypography(s.eyebrowTypography);
          if (s.headingTypography) setHeadingTypography(s.headingTypography);
          if (s.descriptionTypography) setDescriptionTypography(s.descriptionTypography);
          if (s.cardTitleTypography) setCardTitleTypography(s.cardTitleTypography);
          if (s.cardDescriptionTypography) setCardDescriptionTypography(s.cardDescriptionTypography);

          setSavedOverview({
            eyebrow: s.eyebrow || 'BESPOKE COLLECTIONS',
            heading: s.heading || 'Bespoke Photography Services',
            description:
              s.description ||
              'Every portrait session is tailored with infinite care, artistic vision, and gentle guidance.',
            eyebrowTypography: s.eyebrowTypography || {},
            headingTypography: s.headingTypography || {},
            descriptionTypography: s.descriptionTypography || {},
            cardTitleTypography: s.cardTitleTypography || {},
            cardDescriptionTypography: s.cardDescriptionTypography || {},
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch site config for services overview:', e);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch services from database');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to load services.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchOverviewConfig();
  }, [fetchServices, fetchOverviewConfig]);

  const currentOverviewState = {
    eyebrow: overviewEyebrow,
    heading: overviewHeading,
    description: overviewDescription,
    eyebrowTypography,
    headingTypography,
    descriptionTypography,
    cardTitleTypography,
    cardDescriptionTypography,
  };

  const hasUnsavedOverview =
    JSON.stringify(currentOverviewState) !== JSON.stringify(savedOverview);

  const handleSaveOverview = async () => {
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

      setSavedOverview(currentOverviewState);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }
      setFeedback({ type: 'success', msg: 'Services overview and typography saved successfully!' });
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

  const handleSaveServiceModal = async (e: React.FormEvent) => {
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

      const generatedSlug =
        formData.slug.trim() ||
        formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save service');
      }

      setFeedback({
        type: 'success',
        msg: `Service "${formData.title}" ${editingItem ? 'updated' : 'created'} successfully!`,
      });
      setModalOpen(false);
      fetchServices();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving service.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/services?id=${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete service');

      setFeedback({ type: 'success', msg: `Service "${title}" deleted.` });
      fetchServices();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error deleting service.' });
    }
  };

  const typographyElements: TypographyElementDef[] = [
    {
      id: 'servicesEyebrow',
      label: 'Section Eyebrow',
      sublabel: 'Small uppercase tracking badge',
      value: eyebrowTypography,
      onChange: (val) => setEyebrowTypography(val),
      defaultColor: '#C39E96',
      sampleText: 'BESPOKE COLLECTIONS',
    },
    {
      id: 'servicesHeading',
      label: 'Section Main Heading',
      sublabel: 'Display title for photography collections',
      value: headingTypography,
      onChange: (val) => setHeadingTypography(val),
      defaultColor: '#2B2625',
      sampleText: 'Bespoke Photography Services',
    },
    {
      id: 'servicesDescription',
      label: 'Section Description',
      sublabel: 'Introductory narrative under the main heading',
      value: descriptionTypography,
      onChange: (val) => setDescriptionTypography(val),
      defaultColor: '#7C706D',
      sampleText: 'Every portrait session is tailored with infinite care, artistic vision, and gentle guidance.',
    },
    {
      id: 'cardTitle',
      label: 'Service Card Title',
      sublabel: 'Title rendered on individual service showcase cards',
      value: cardTitleTypography,
      onChange: (val) => setCardTitleTypography(val),
      defaultColor: '#2B2625',
      sampleText: 'Newborn & Baby Portraiture',
    },
    {
      id: 'cardDescription',
      label: 'Service Card Description',
      sublabel: 'Summary text rendered inside service cards',
      value: cardDescriptionTypography,
      onChange: (val) => setCardDescriptionTypography(val),
      defaultColor: '#7C706D',
      sampleText: 'Gentle, timeless photography honoring the delicate beginnings of life.',
    },
  ];

  const tabs: AdminTabItem[] = [
    { id: 'content', label: 'Services Catalogue', icon: HiDocumentText, badge: services.length },
    { id: 'settings', label: 'Section Narrative', icon: HiAdjustmentsHorizontal },
    { id: 'typography', label: 'Typography Styling', icon: HiPaintBrush },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans">
      {/* Section Header */}
      <AdminSectionHeader
        title="Services & Collections"
        description="Manage bespoke photography offerings, session descriptions, cover imagery, and section typography."
        previewUrl="/#services"
        hasUnsavedChanges={hasUnsavedOverview}
        onSave={handleSaveOverview}
        isSaving={savingOverview}
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

      {/* TAB 1: SERVICES CATALOGUE */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <AdminCard
            title="Curated Photography Services"
            description="Add, edit, or reorder photography offerings displayed across the portfolio."
            headerAction={
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2B2625] text-white hover:bg-[#1C1817] rounded-xl text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
              >
                <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
                <span>Add Service</span>
              </button>
            }
          >
            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-[#7C706D]">
                Loading services catalogue...
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2]">
                <p className="text-xs text-[#7C706D]">No photography services configured yet.</p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-[#2B2625] text-white text-xs rounded-lg font-medium cursor-pointer"
                >
                  Create First Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((service) => {
                  const coverImg =
                    service.heroImage ||
                    (typeof service.image === 'string' ? service.image : '') ||
                    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg';

                  return (
                    <div
                      key={service._id}
                      className="bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#2B2625]/40 transition-all shadow-2xs group"
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div className="relative w-full aspect-[4/3] bg-neutral-200 overflow-hidden">
                          <Image
                            src={coverImg}
                            alt={service.title}
                            fill
                            className="object-cover group-hover:scale-103 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          {service.featured && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#2B2625] text-white text-[10px] font-mono flex items-center gap-1 shadow-xs">
                              <HiStar className="w-3 h-3 text-[#C39E96]" />
                              Featured
                            </span>
                          )}
                          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                            Order #{service.order ?? 0}
                          </span>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-serif text-sm font-semibold text-[#2B2625]">
                            {service.title}
                          </h4>
                          <p className="text-xs text-[#7C706D] font-sans line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="px-4 py-3 bg-white border-t border-[#E7DDD2] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#7C706D] truncate max-w-[120px]">
                          /{service.slug || 'service'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(service)}
                            className="p-1.5 text-[#2B2625] hover:bg-[#FAF6F3] rounded border border-[#E7DDD2] transition-colors cursor-pointer"
                            title="Edit Service"
                          >
                            <HiPencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(service._id, service.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Service"
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
          </AdminCard>
        </div>
      )}

      {/* TAB 2: SECTION NARRATIVE */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminCard
            title="Services Section Narrative"
            description="Customize the eyebrow badge, section title, and introduction displayed above the services grid."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Eyebrow Category Badge
                </label>
                <input
                  type="text"
                  value={overviewEyebrow}
                  onChange={(e) => setOverviewEyebrow(e.target.value)}
                  placeholder="BESPOKE COLLECTIONS"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Section Main Heading
                </label>
                <input
                  type="text"
                  value={overviewHeading}
                  onChange={(e) => setOverviewHeading(e.target.value)}
                  placeholder="Bespoke Photography Services"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                Section Narrative Introduction
              </label>
              <textarea
                rows={3}
                value={overviewDescription}
                onChange={(e) => setOverviewDescription(e.target.value)}
                placeholder="Every portrait session is tailored with infinite care, artistic vision, and gentle guidance."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
              />
            </div>
          </AdminCard>
        </div>
      )}

      {/* TAB 3: TYPOGRAPHY */}
      {activeTab === 'typography' && (
        <div className="space-y-8">
          <AdminCard
            title="Services Section Typography"
            description="Select an individual text element to customize its font size, font family, font weight, and color palette."
          >
            <FocusedTypographyManager elements={typographyElements} />
          </AdminCard>
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#E7DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E7DDD2] flex items-center justify-between bg-[#FAF6F3]">
              <h3 className="font-serif text-base font-semibold text-[#2B2625]">
                {editingItem ? `Edit Service: ${editingItem.title}` : 'Create New Photography Service'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#7C706D] hover:text-[#2B2625] rounded cursor-pointer"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceModal} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase text-[#2B2625] font-semibold">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Newborn & Baby Sessions"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase text-[#2B2625] font-semibold">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="newborn-and-baby"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase text-[#2B2625] font-semibold">
                  Service Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the experience, artistic philosophy, and deliverables included in this session..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase text-[#2B2625] font-semibold">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    placeholder="View Portfolio"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase text-[#2B2625] font-semibold">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-sans text-[#2B2625] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-[#E7DDD2] text-[#2B2625] focus:ring-[#C39E96]"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="pt-2">
                <MediaUploader
                  label="Service Showcase Cover Image"
                  description="Upload a high-resolution portrait or craft photo representing this service."
                  value={formData.heroImage}
                  onChange={(url) => setFormData({ ...formData, heroImage: url })}
                  folder="services"
                  aspectRatio="aspect-[4/3]"
                />
              </div>

              <div className="pt-4 border-t border-[#E7DDD2] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#7C706D] hover:text-[#2B2625] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-[#1C1817] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Save Bar */}
      <StickySaveBar
        hasUnsavedChanges={hasUnsavedOverview}
        isSaving={savingOverview}
        onSave={handleSaveOverview}
        onReset={() => {
          if (savedOverview) {
            setOverviewEyebrow(savedOverview.eyebrow || 'BESPOKE COLLECTIONS');
            setOverviewHeading(savedOverview.heading || 'Bespoke Photography Services');
            setOverviewDescription(savedOverview.description || '');
            setEyebrowTypography(savedOverview.eyebrowTypography || {});
            setHeadingTypography(savedOverview.headingTypography || {});
            setDescriptionTypography(savedOverview.descriptionTypography || {});
            setCardTitleTypography(savedOverview.cardTitleTypography || {});
            setCardDescriptionTypography(savedOverview.cardDescriptionTypography || {});
          }
        }}
        label="Services Overview & Typography"
      />
    </div>
  );
}
