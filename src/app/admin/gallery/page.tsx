'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  HiPhoto, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiArrowPath, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiStar,
  HiFunnel,
  HiMagnifyingGlass,
  HiXMark
} from 'react-icons/hi2';

interface GalleryItem {
  _id: string;
  src: string;
  thumbnail?: string;
  publicId?: string;
  alt?: string;
  title?: string;
  description?: string;
  category: string;
  featured?: boolean;
  order?: number;
}

const CATEGORIES = ['All', 'Newborn', 'Maternity', 'Portrait', 'Wedding', 'Events', 'Brand'];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    src: '',
    thumbnail: '',
    title: '',
    alt: '',
    description: '',
    category: 'Portrait',
    featured: false,
    order: 0,
  });

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/gallery-images?limit=1000', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to connect to database for gallery images.');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || 'Error fetching gallery data from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      src: '',
      thumbnail: '',
      title: '',
      alt: '',
      description: '',
      category: selectedCategory !== 'All' ? selectedCategory : 'Portrait',
      featured: false,
      order: items.length,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      src: item.src || '',
      thumbnail: item.thumbnail || item.src || '',
      title: item.title || '',
      alt: item.alt || '',
      description: item.description || '',
      category: item.category || 'Portrait',
      featured: !!item.featured,
      order: typeof item.order === 'number' ? item.order : 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.src.trim()) {
      alert('Image URL is required.');
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res;
      if (editingItem) {
        res = await fetch('/api/gallery-images', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ _id: editingItem._id, ...formData }),
        });
      } else {
        res = await fetch('/api/gallery-images', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save to database');
      }

      const persisted = await res.json();
      if (!persisted?._id) throw new Error('The database did not return the saved image.');
      await fetchGallery();
      setModalOpen(false);
      setFeedback({ type: 'success', msg: editingItem ? 'Image updated and refreshed.' : 'New image saved and refreshed.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Database mutation error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo from MongoDB?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/gallery-images?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed in MongoDB');

      setFeedback({ type: 'success', msg: 'Photo deleted successfully from database.' });
      fetchGallery();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Failed to delete record.' });
    }
  };

  const handleToggleFeatured = async (item: GalleryItem) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/gallery-images', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ _id: item._id, featured: !item.featured }),
      });

      if (!res.ok) throw new Error('Toggle failed');
      setFeedback({ type: 'success', msg: item.featured ? 'Removed from featured' : 'Marked as featured!' });
      fetchGallery();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to update featured status.' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected photos permanently from MongoDB?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      for (const id of selectedIds) {
        await fetch(`/api/gallery-images?id=${id}`, { method: 'DELETE', headers });
      }

      setSelectedIds([]);
      setFeedback({ type: 'success', msg: `${selectedIds.length} items deleted successfully from MongoDB.` });
      fetchGallery();
    } catch {
      setFeedback({ type: 'error', msg: 'Bulk delete encountered an error.' });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.alt && item.alt.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiPhoto className="w-3.5 h-3.5" />
            MongoDB Gallery Source
          </div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal mt-1">
            Portfolio Gallery CMS ({items.length} Images)
          </h1>
          <p className="font-sans text-xs text-[#7C706D]">
            Manage published studio images, order positions, and hero slideshow assignments directly in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGallery}
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
            <span>Add New Photo</span>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/70 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <HiFunnel className="w-4 h-4 text-[#C39E96] shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2B2625] text-white shadow-xs'
                  : 'bg-[#FAF6F3] text-[#7C706D] hover:text-[#2B2625] border border-[#E7DDD2]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input & Bulk Action */}
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 transition-colors"
            >
              <HiTrash className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          <div className="relative flex-1 md:w-64">
            <HiMagnifyingGlass className="w-4 h-4 text-[#7C706D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70">
          <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-[#7C706D]">Reading MongoDB Gallery Records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70 space-y-3">
          <HiPhoto className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
          <p className="font-serif text-base text-[#2B2625]">No photos found matching search/category.</p>
          <button onClick={openCreateModal} className="text-xs text-[#C39E96] hover:underline font-medium">Add a photo to this category</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item._id);
            return (
              <div
                key={item._id}
                className={`group relative bg-white rounded-xl border overflow-hidden shadow-2xs transition-all flex flex-col ${
                  isSelected ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-[#E7DDD2]/70 hover:border-[#2B2625]'
                }`}
              >
                {/* Image Aspect Box */}
                <div className="relative aspect-[4/5] bg-[#FAF6F3] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt || item.title || 'Gallery item'}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Category Tag */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#2B2625]/80 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-wider">
                    {item.category}
                  </span>

                  {/* Featured Badge */}
                  {item.featured && (
                    <span className="absolute top-2 right-2 p-1 rounded-full bg-amber-500 text-white shadow-xs" title="Featured on Homepage">
                      <HiStar className="w-3.5 h-3.5 fill-current" />
                    </span>
                  )}

                  {/* Checkbox for Select */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((prev) => [...prev, item._id]);
                      else setSelectedIds((prev) => prev.filter((i) => i !== item._id));
                    }}
                    className="absolute bottom-2 left-2 w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </div>

                {/* Info & Action Strip */}
                <div className="p-3 bg-white space-y-2 flex-1 flex flex-col justify-between border-t border-[#E7DDD2]/40">
                  <div>
                    <h3 className="font-serif text-xs text-[#2B2625] font-medium truncate" title={item.title || 'Untitled'}>
                      {item.title || 'Untitled Photo'}
                    </h3>
                    <p className="font-sans text-[10px] text-[#7C706D] truncate mt-0.5">
                      Order: #{item.order ?? 0}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E7DDD2]/30">
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      className={`p-1 rounded hover:bg-[#FAF6F3] transition-colors ${item.featured ? 'text-amber-600' : 'text-[#7C706D]'}`}
                      title={item.featured ? 'Remove from Homepage' : 'Feature on Homepage'}
                    >
                      <HiStar className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 rounded text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]"
                        title="Edit details"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 rounded text-[#7C706D] hover:text-rose-600 hover:bg-rose-50"
                        title="Delete photo"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7DDD2] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-4">
              <h2 className="font-serif text-xl text-[#2B2625]">
                {editingItem ? 'Edit Gallery Photo' : 'Add New Gallery Photo'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#7C706D] hover:text-[#2B2625]">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Image URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://storage.supabase.co/..."
                  value={formData.src}
                  onChange={(e) => setFormData({ ...formData, src: e.target.value, thumbnail: formData.thumbnail || e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Thumbnail URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to main image URL if empty"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Fine Art Maternity Shoot"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  placeholder="Describe image for search engines"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-[#2B2625] rounded"
                />
                <label htmlFor="featured" className="text-[#2B2625] font-medium cursor-pointer">
                  Feature on Homepage Hero Slideshow
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

