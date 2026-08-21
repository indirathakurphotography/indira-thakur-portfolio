'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import MediaUploader from '@/components/admin/MediaUploader';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';
import { 
  HiBuildingStorefront, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiArrowPath, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiEye,
  HiEyeSlash,
  HiLink,
  HiXMark
} from 'react-icons/hi2';

interface BrandItem {
  _id: string;
  name: string;
  logo: { url: string; alt?: string } | string;
  websiteUrl?: string;
  category: 'Featured In' | 'Trusted By' | string;
  displayOrder?: number;
  isActive: boolean;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrandItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Section Header & Typography State
  const [sectionEyebrow, setSectionEyebrow] = useState('Client & Editorial Partners');
  const [sectionHeading, setSectionHeading] = useState('BRANDS I HAVE WORKED WITH');
  const [sectionDescription, setSectionDescription] = useState('A curated selection of brands and clients Indira Thakur Photography has had the pleasure of working with.');
  const [eyebrowTypography, setEyebrowTypography] = useState<any>({});
  const [headingTypography, setHeadingTypography] = useState<any>({});
  const [descriptionTypography, setDescriptionTypography] = useState<any>({});
  const [brandNameTypography, setBrandNameTypography] = useState<any>({});
  const [savingHeader, setSavingHeader] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    category: 'Featured In',
    isActive: true,
    displayOrder: 0,
  });

  const fetchSiteConfigHeader = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.brands) {
          if (data.brands.eyebrow) setSectionEyebrow(data.brands.eyebrow);
          if (data.brands.heading) setSectionHeading(data.brands.heading);
          if (data.brands.description) setSectionDescription(data.brands.description);
          if (data.brands.eyebrowTypography) setEyebrowTypography(data.brands.eyebrowTypography);
          if (data.brands.headingTypography) setHeadingTypography(data.brands.headingTypography);
          if (data.brands.descriptionTypography) setDescriptionTypography(data.brands.descriptionTypography);
          if (data.brands.brandNameTypography) setBrandNameTypography(data.brands.brandNameTypography);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingHeader(true);
      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          brands: {
            eyebrow: sectionEyebrow,
            heading: sectionHeading,
            description: sectionDescription,
            eyebrowTypography,
            headingTypography,
            descriptionTypography,
            brandNameTypography,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save brands header & typography');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: 'Brands header & typography saved successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error updating settings' });
    } finally {
      setSavingHeader(false);
    }
  };

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/brands?all=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load brands from MongoDB');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Error fetching brands.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchSiteConfigHeader();
  }, [fetchBrands, fetchSiteConfigHeader]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      logoUrl: '',
      websiteUrl: '',
      category: 'Featured In',
      isActive: true,
      displayOrder: brands.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingItem(brand);
    const logoUrl = typeof brand.logo === 'string' ? brand.logo : brand.logo?.url || '';
    setFormData({
      name: brand.name || '',
      logoUrl: logoUrl,
      websiteUrl: brand.websiteUrl || '',
      category: brand.category || 'Featured In',
      isActive: brand.isActive !== false,
      displayOrder: brand.displayOrder ?? 0,
    });
    setModalOpen(true);

  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Brand name is required');
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        name: formData.name,
        logo: { url: formData.logoUrl, alt: formData.name },
        websiteUrl: formData.websiteUrl,
        category: formData.category,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };

      let res;
      if (editingItem) {
        res = await fetch(`/api/brands/${editingItem._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/brands', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Failed to save brand to database');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: editingItem ? 'Brand updated!' : 'New brand added!' });
      setModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving brand.' });

    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand logo?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: 'Brand deleted successfully.' });
      fetchBrands();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete brand.' });
    }
  };

  const handleToggleActive = async (brand: BrandItem) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/brands/${brand._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !brand.isActive }),
      });

      if (!res.ok) throw new Error('Update failed');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      fetchBrands();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to update brand status.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiBuildingStorefront className="w-3.5 h-3.5" />
            MongoDB Brand Directory
          </div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal mt-1">
            Brands & Press Partners ({brands.length})
          </h1>
          <p className="font-sans text-xs text-[#7C706D]">
            Manage featured publications, client logos, and brand collaboration press cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBrands}
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
            <span>Add Brand Logo</span>
          </button>
        </div>
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

      {/* Brands Section Header & Typography Settings */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
        <div>
          <h2 className="font-serif text-lg font-medium text-[#2B2625]">
            Brands Section Header & Typography Styling
          </h2>
          <p className="font-sans text-xs text-[#7C706D] mt-0.5">
            Configure section header titles and customize typography (Font Size, Font Family, Font Weight, and Text Colors) for the public Brands & Press section.
          </p>
        </div>

        <form onSubmit={handleSaveHeader} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Eyebrow Badge Label
              </label>
              <input
                type="text"
                value={sectionEyebrow}
                onChange={(e) => setSectionEyebrow(e.target.value)}
                placeholder="Client & Editorial Partners"
                className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Main Heading Title
              </label>
              <input
                type="text"
                value={sectionHeading}
                onChange={(e) => setSectionHeading(e.target.value)}
                placeholder="BRANDS I HAVE WORKED WITH"
                className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Section Subtitle / Description
              </label>
              <input
                type="text"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                placeholder="A curated selection of brands and clients Indira Thakur Photography has had the pleasure of working with."
                className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>

          {/* Centralized Typography Customization Section */}
          <SectionTypographyManager
            title="Brands Section Typography"
            description="Select a text element to customize its font size, font style, font weight, and text color independently."
            elements={[
              {
                id: 'eyebrow',
                label: 'Eyebrow Badge Label',
                sublabel: 'Styles "Client & Editorial Partners" badge',
                value: eyebrowTypography,
                onChange: setEyebrowTypography,
                defaultColor: '#C39E96',
              },
              {
                id: 'heading',
                label: 'Main Section Heading',
                sublabel: 'Styles "BRANDS I HAVE WORKED WITH" section title',
                value: headingTypography,
                onChange: setHeadingTypography,
                defaultColor: '#2B2625',
              },
              {
                id: 'description',
                label: 'Section Description / Subtitle',
                sublabel: 'Styles intro text below the heading',
                value: descriptionTypography,
                onChange: setDescriptionTypography,
                defaultColor: '#7C706D',
              },
              {
                id: 'brandName',
                label: 'Brand Text Name',
                sublabel: 'Styles brand name when displayed in text or without logo image',
                value: brandNameTypography,
                onChange: setBrandNameTypography,
                defaultColor: '#2B2625',
              },
            ]}
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingHeader}
              className="px-5 py-2.5 bg-[#2B2625] text-white rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingHeader ? 'Saving Settings...' : 'Save Brands Typography'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70">
          <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-[#7C706D]">Reading MongoDB Brand Directory...</p>
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70 space-y-3">
          <HiBuildingStorefront className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
          <p className="font-serif text-base text-[#2B2625]">No brand logos stored in database.</p>
          <button onClick={openCreateModal} className="text-xs text-[#C39E96] hover:underline font-medium">Add your first brand partner</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((brand) => {
            const logoUrl = typeof brand.logo === 'string' ? brand.logo : brand.logo?.url || 'https://picsum.photos/seed/brand/300/150';
            return (
              <div key={brand._id} className="bg-white rounded-xl border border-[#E7DDD2]/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#2B2625] transition-all p-4 space-y-4">
                <div className="space-y-3">
                  <div className="relative aspect-[3/1] bg-[#FAF6F3] rounded-lg overflow-hidden border border-[#E7DDD2]/50 p-2 flex items-center justify-center">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={brand.name}
                        fill
                        sizes="250px"
                        className="object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif text-sm font-semibold text-[#2B2625]">{brand.name}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-base text-[#2B2625] font-medium">{brand.name}</h3>
                    <p className="font-mono text-[10px] text-[#C39E96] uppercase tracking-wider mt-0.5">{brand.category}</p>
                    {brand.websiteUrl && (
                      <a href={brand.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#7C706D] hover:underline mt-1 truncate max-w-full">
                        <HiLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{brand.websiteUrl}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E7DDD2]/40 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(brand)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                      brand.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {brand.isActive ? <HiEye className="w-3.5 h-3.5" /> : <HiEyeSlash className="w-3.5 h-3.5" />}
                    <span>{brand.isActive ? 'Active' : 'Hidden'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(brand)}
                      className="p-1.5 rounded bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] hover:bg-white text-xs"
                      title="Edit Brand"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand._id)}
                      className="p-1.5 rounded bg-[#FAF6F3] border border-[#E7DDD2] text-rose-700 hover:bg-rose-50 text-xs"
                      title="Delete Brand"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-xl border border-[#E7DDD2] shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between border-b border-[#E7DDD2]/50 px-6 py-4 bg-[#FAF6F3]/50">
              <h2 className="font-serif text-xl text-[#2B2625]">
                {editingItem ? 'Edit Brand Logo' : 'Add Brand Partner'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#7C706D] hover:text-[#2B2625] p-1 rounded-md">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vogue India"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>

                <MediaUploader
                  label="Brand Logo *"
                  description="Upload brand logo file (PNG, SVG, JPG, WebP), drag & drop, or paste a link."
                  value={formData.logoUrl}
                  onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                  aspectRatio="aspect-[16/9]"
                  folder="brands"
                />

                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Website URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://vogue.in"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>

                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  >
                    <option value="Featured In">Featured In (Publications & Press)</option>
                    <option value="Trusted By">Trusted By (Clients & Corporate)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="active-brand"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#2B2625] rounded"
                  />
                  <label htmlFor="active-brand" className="text-[#2B2625] font-medium cursor-pointer">
                    Display on Website Homepage
                  </label>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7DDD2]/50 bg-[#FAF6F3]/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E7DDD2] text-[#7C706D] hover:text-[#2B2625] bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#2B2625] text-white hover:bg-[#3D3534] uppercase font-medium tracking-wider disabled:opacity-50 transition-colors shadow-xs"
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
