'use client';

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { toast } from '@/lib/toast';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiEye, 
  HiEyeSlash, 
  HiArrowUp, 
  HiArrowDown, 
  HiLink,
  HiBuildingStorefront,
  HiCheck,
  HiXMark
} from 'react-icons/hi2';

interface BrandItem {
  _id: string;
  name: string;
  logo: {
    url: string;
    alt?: string;
  };
  websiteUrl?: string;
  category: 'Featured In' | 'Trusted By';
  displayOrder: number;
  isActive: boolean;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Featured In' | 'Trusted By'>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    logo: { url: '', alt: '' },
    websiteUrl: '',
    category: 'Featured In' as 'Featured In' | 'Trusted By',
    isActive: true,
    displayOrder: 0,
  });

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
      const res = await fetch('/api/brands?all=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      } else {
        toast.error('Failed to load brands');
      }
    } catch {
      toast.error('Network error loading brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      logo: { url: '', alt: '' },
      websiteUrl: '',
      category: 'Featured In',
      isActive: true,
      displayOrder: brands.length,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      logo: { url: brand.logo?.url || '', alt: brand.logo?.alt || brand.name },
      websiteUrl: brand.websiteUrl || '',
      category: brand.category || 'Featured In',
      isActive: brand.isActive,
      displayOrder: brand.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a brand name');
      return;
    }
    if (!formData.logo.url) {
      toast.error('Please upload or provide a logo URL');
      return;
    }

    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      if (editingBrand) {
        // Update
        const res = await fetch(`/api/brands/${editingBrand._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success('Brand updated successfully');
          setIsModalOpen(false);
          fetchBrands();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update brand');
        }
      } else {
        // Create
        const res = await fetch('/api/brands', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success('Brand created successfully');
          setIsModalOpen(false);
          fetchBrands();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create brand');
        }
      }
    } catch {
      toast.error('Error saving brand');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (brand: BrandItem) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    try {
      const res = await fetch(`/api/brands/${brand._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: !brand.isActive }),
      });
      if (res.ok) {
        toast.success(`Brand ${!brand.isActive ? 'activated' : 'deactivated'}`);
        setBrands(prev =>
          prev.map(b => (b._id === brand._id ? { ...b, isActive: !b.isActive } : b))
        );
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    try {
      const res = await fetch(`/api/brands/${deleteId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast.success('Brand deleted');
        setBrands(prev => prev.filter(b => b._id !== deleteId));
        setDeleteId(null);
      } else {
        toast.error('Failed to delete brand');
      }
    } catch {
      toast.error('Error deleting brand');
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= brands.length) return;

    const reordered = [...brands];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    // Update display orders
    const updated = reordered.map((b, idx) => ({ ...b, displayOrder: idx }));
    setBrands(updated);

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    try {
      const res = await fetch('/api/brands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated.map(item => ({ _id: item._id, displayOrder: item.displayOrder }))),
      });
      if (res.ok) {
        toast.success('Display order updated');
      } else {
        fetchBrands();
      }
    } catch {
      fetchBrands();
    }
  };

  const filteredBrands = brands.filter(b => filterCategory === 'All' || b.category === filterCategory);

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto w-full space-y-6">
      <AdminPageHeader
        title="Brands & Media Partners"
        description="Manage publication features, client brands, and media logos displayed on the homepage"
      />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#7C706D] mr-1">Filter:</span>
          {(['All', 'Featured In', 'Trusted By'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-[#2B2625] text-white shadow-2xs'
                  : 'bg-[#FAF6F3] text-[#7C706D] hover:text-[#2B2625] hover:bg-white border border-[#E7DDD2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add Brand Button */}
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-[#C39E96] transition-all shadow-sm active:scale-95"
        >
          <HiPlus className="w-4 h-4" />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Brands List Table */}
      <div className="bg-white rounded-xl border border-[#E7DDD2]/70 shadow-2xs overflow-hidden flex-1">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
            <p className="font-mono text-xs text-[#7C706D] uppercase tracking-wider">Loading Brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-20 text-center px-4">
            <HiBuildingStorefront className="w-12 h-12 text-[#E7DDD2] mx-auto mb-3" />
            <h3 className="font-serif text-lg text-[#2B2625] font-medium">No Brands Found</h3>
            <p className="text-xs text-[#7C706D] max-w-sm mx-auto mt-1 mb-4">
              Add publication logos or client brands to showcase "Brands We've Worked With" on the homepage.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg"
            >
              <HiPlus className="w-4 h-4" />
              <span>Add Your First Brand</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E7DDD2]/50 overflow-x-auto">
            {filteredBrands.map((brand, index) => (
              <div
                key={brand._id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-[#FAF6F3]/50 transition-colors"
              >
                {/* Brand Logo & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-12 bg-[#FAF6F3] border border-[#E7DDD2]/70 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      src={brand.logo.url}
                      alt={brand.logo.alt || brand.name}
                      className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x50?text=Logo';
                      }}
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-[#2B2625] truncate">
                        {brand.name}
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                          brand.category === 'Featured In'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {brand.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#7C706D] mt-0.5">
                      {brand.websiteUrl ? (
                        <a
                          href={brand.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-[#C39E96] transition-colors truncate"
                        >
                          <HiLink className="w-3.5 h-3.5" />
                          <span className="truncate">{brand.websiteUrl.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        <span className="italic text-[#7C706D]/60">No website URL</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Action Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Active Toggle Button */}
                  <button
                    onClick={() => handleToggleActive(brand)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      brand.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                    }`}
                    title={brand.isActive ? 'Active on homepage' : 'Hidden from homepage'}
                  >
                    {brand.isActive ? (
                      <>
                        <HiEye className="w-4 h-4 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <HiEyeSlash className="w-4 h-4 text-stone-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>

                  {/* Reorder Buttons */}
                  <div className="flex items-center border border-[#E7DDD2] rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-[#7C706D] hover:bg-[#FAF6F3] hover:text-[#2B2625] disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Up"
                    >
                      <HiArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === filteredBrands.length - 1}
                      className="p-1.5 text-[#7C706D] hover:bg-[#FAF6F3] hover:text-[#2B2625] disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Down"
                    >
                      <HiArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-2 text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3] rounded-lg transition-colors border border-[#E7DDD2]"
                    title="Edit Brand"
                  >
                    <HiPencil className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteId(brand._id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                    title="Delete Brand"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1817]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E7DDD2] space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/60 pb-4">
              <h3 className="font-serif text-xl font-semibold text-[#2B2625]">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#7C706D] hover:text-[#2B2625] rounded-lg"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#7C706D] mb-1.5 font-semibold">
                  Brand / Media Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vogue India, Harper's Bazaar, Femina"
                  className="w-full px-4 py-2.5 bg-white border border-[#E7DDD2] rounded-xl text-sm text-[#2B2625] focus:outline-none focus:ring-2 focus:ring-[#C39E96]"
                />
              </div>

              {/* Logo Manager */}
              <div>
                <ImageManager
                  label="Brand Logo *"
                  description="Upload transparent PNG, SVG, or high quality JPG logo"
                  value={{ url: formData.logo.url, alt: formData.logo.alt || formData.name }}
                  onChange={img => setFormData({ ...formData, logo: { url: img.url, alt: img.alt || formData.name } })}
                  aspect="aspect-[3/1]"
                  folder="brands"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#7C706D] mb-1.5 font-semibold">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value as 'Featured In' | 'Trusted By' })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E7DDD2] rounded-xl text-sm text-[#2B2625] focus:outline-none focus:ring-2 focus:ring-[#C39E96]"
                >
                  <option value="Featured In">Featured In (Press & Publications)</option>
                  <option value="Trusted By">Trusted By (Corporate & Commercial Clients)</option>
                </select>
              </div>

              {/* Website URL */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#7C706D] mb-1.5 font-semibold">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://www.brandwebsite.com"
                  className="w-full px-4 py-2.5 bg-white border border-[#E7DDD2] rounded-xl text-sm text-[#2B2625] focus:outline-none focus:ring-2 focus:ring-[#C39E96]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2]">
                <span className="font-serif text-sm font-medium text-[#2B2625]">Show on Homepage</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2B2625]"></div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DDD2]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-[#E7DDD2] rounded-xl text-xs font-semibold uppercase tracking-wider text-[#7C706D] hover:bg-[#FAF6F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#2B2625] text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#C39E96] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-[#1C1817]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E7DDD2] space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2B2625]">Confirm Delete</h3>
            <p className="text-xs text-[#7C706D]">
              Are you sure you want to delete this brand? This action cannot be undone and will remove it from the homepage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-[#E7DDD2] rounded-xl text-xs font-semibold text-[#7C706D] hover:bg-[#FAF6F3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>Delete Brand</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
