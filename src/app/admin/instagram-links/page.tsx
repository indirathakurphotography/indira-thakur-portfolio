'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiPlay,
  HiArrowUp,
  HiArrowDown,
  HiMagnifyingGlass,
  HiCheckCircle,
  HiExclamationCircle,
  HiVideoCamera,
} from 'react-icons/hi2';
import { FaInstagram } from 'react-icons/fa6';
import { isCategoryMatch, formatCategory } from '@/lib/categoryUtils';
import MediaUploader from '@/components/admin/MediaUploader';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'home', label: 'Homepage' },
  { id: 'newborn', label: 'Newborn Gallery' },
  { id: 'maternity', label: 'Maternity Gallery' },
  { id: 'portrait', label: 'Portrait Gallery' },
  { id: 'wedding', label: 'Weddings Gallery' },
  { id: 'events', label: 'Events Gallery' },
  { id: 'brand', label: 'Brand Gallery' },
];

const CATEGORIES = [
  'home',
  'newborn',
  'maternity',
  'portrait',
  'wedding',
  'events',
  'brand',
];

type Item = {
  _id: string;
  title: string;
  category: string;
  mediaType: 'instagram' | 'video';
  url: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  order?: number;
};

function getAdminHeaders(json = true) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function isInstagramUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase() === 'instagram.com';
  } catch {
    return false;
  }
}

export default function InstagramLinksAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'home',
    mediaType: 'instagram' as 'instagram' | 'video',
    url: '',
    thumbnailUrl: '',
    order: 1,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/instagram-links?admin=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load Instagram items.');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Could not load Instagram items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = (defaultCat = activeTab !== 'all' ? activeTab : 'home') => {
    setEditingId(null);
    setForm({
      title: '',
      category: defaultCat,
      mediaType: 'instagram',
      url: '',
      thumbnailUrl: '',
      order: items.length + 1,
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (!editingId) {
      setForm((prev) => ({
        ...prev,
        category: tabId !== 'all' ? tabId : 'home',
      }));
    }
  };

  const edit = (item: Item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      category: item.category || 'home',
      mediaType: item.mediaType || 'instagram',
      url: item.url || '',
      thumbnailUrl: item.thumbnailUrl || '',
      order: item.order ?? 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (form.mediaType === 'instagram' && !isInstagramUrl(form.url)) {
      setError('Please enter a valid Instagram post or Reel URL from instagram.com.');
      return;
    }
    if (!form.url.trim()) {
      setError('URL or media source is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order) || 1,
      };

      const response = await fetch(editingId ? `/api/instagram-links?id=${editingId}` : '/api/instagram-links', {
        method: editingId ? 'PUT' : 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(editingId ? { _id: editingId, ...payload } : payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save item.');

      setNotice(editingId ? 'Instagram item updated.' : 'Instagram item added successfully.');
      reset(activeTab !== 'all' ? activeTab : form.category);
      await load();
    } catch (saveError: any) {
      setError(saveError?.message || 'Could not save this item.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('Delete this item permanently from MongoDB?')) return;
    try {
      const res = await fetch(`/api/instagram-links?id=${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(false),
      });
      if (!res.ok) throw new Error('Could not delete item.');
      setNotice('Item removed successfully.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not delete item.');
    }
  };

  const moveOrder = async (item: Item, direction: 'up' | 'down') => {
    const list = filteredItems;
    const currentIndex = list.findIndex((f) => f._id === item._id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const swapTarget = list[targetIndex];
    try {
      const currentOrder = item.order ?? currentIndex + 1;
      const targetOrder = swapTarget.order ?? targetIndex + 1;

      await fetch(`/api/instagram-links?id=${item._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ _id: item._id, order: targetOrder }),
      });

      await fetch(`/api/instagram-links?id=${swapTarget._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ _id: swapTarget._id, order: currentOrder }),
      });

      await load();
    } catch {
      setError('Could not update order.');
    }
  };

  const filteredItems = items.filter((item) => {
    const cat = item.category || 'home';
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'home' && (cat === 'home' || !item.category)) ||
      isCategoryMatch(cat, activeTab);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.url && item.url.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const countsByTab = (() => {
    const map: Record<string, number> = { all: items.length };
    CATEGORY_TABS.forEach((t) => {
      if (t.id === 'all') return;
      map[t.id] = items.filter((item) => {
        const c = item.category || 'home';
        return (t.id === 'home' && (c === 'home' || !item.category)) || isCategoryMatch(c, t.id);
      }).length;
    });
    return map;
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <FaInstagram className="w-3.5 h-3.5" />
            Social Video & Reels Architecture
          </div>
          <h1 className="font-serif text-3xl text-[#2B2625] font-normal mt-2">
            Instagram Reels & Video Highlights
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans">
            Add public Instagram post or Reel URLs, or upload direct video files for the Homepage and Gallery category sections.
          </p>
        </div>
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

      {/* Creation & Edit Form */}
      <form onSubmit={save} className="space-y-4 rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E7DDD2]/60 pb-3">
          <h2 className="font-serif text-xl text-[#2B2625]">
            {editingId ? 'Edit Reel / Video Link' : 'Add New Reel / Video Link'}
          </h2>
          {editingId && (
            <span className="font-mono text-[10px] uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              Editing Mode
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Title / Caption
            </label>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Fine Art Newborn Storytelling"
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Target Section / Gallery Category *
            </label>
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Media Type *
            </label>
            <select
              value={form.mediaType}
              onChange={(event) =>
                setForm({ ...form, mediaType: event.target.value as 'instagram' | 'video' })
              }
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            >
              <option value="instagram">Instagram Reel / Post URL</option>
              <option value="video">Direct Uploaded Video File</option>
            </select>
          </div>
        </div>

        {form.mediaType === 'instagram' ? (
          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Instagram URL *
            </label>
            <input
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://www.instagram.com/reel/Cxxxxxx/ or https://www.instagram.com/p/Cxxxxxx/"
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <MediaUploader
              label="Upload Video File (MP4, WebM, MOV) *"
              description="Upload video clips directly to storage."
              value={form.url}
              onChange={(url) => setForm((prev) => ({ ...prev, url }))}
              folder="instagram"
              aspectRatio="aspect-[9/16]"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <MediaUploader
              label="Thumbnail Cover Image (Optional)"
              description="Visual preview poster shown before user plays the reel."
              value={form.thumbnailUrl}
              onChange={(thumbnailUrl) => setForm((prev) => ({ ...prev, thumbnailUrl }))}
              folder="instagram"
              aspectRatio="aspect-[9/16]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B2625] mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={form.order}
              onChange={(event) =>
                setForm({ ...form, order: parseInt(event.target.value, 10) || 0 })
              }
              className="w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
            <p className="text-[10px] text-[#7C706D] mt-1">
              Controls sequence (1, 2, 3...) when displayed in reels carousel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2B2625] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-xs"
          >
            <HiPlus className="w-4 h-4" />{' '}
            {saving ? 'Saving to Database…' : editingId ? 'Update Item' : 'Add Instagram Item'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => reset(activeTab !== 'all' ? activeTab : 'home')}
              className="rounded-lg border border-[#E7DDD2] px-4 py-2.5 text-xs text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Category Tabs & Instagram Items List */}
      <section className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7DDD2]/60 pb-4">
          <div>
            <h2 className="font-serif text-xl text-[#2B2625]">
              Instagram Links Directory {loading ? '' : `(${filteredItems.length})`}
            </h2>
            <p className="text-xs text-[#7C706D] mt-0.5">
              Filter reels by category or search titles.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C706D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reels..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = countsByTab[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#2B2625] text-white shadow-xs'
                    : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] hover:bg-[#E7DDD2]/50 hover:text-[#2B2625]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#7C706D]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#7C706D]">Loading items from MongoDB…</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-dashed border-[#E7DDD2] bg-[#FAF6F3]/50 p-8 space-y-3">
            <p className="font-serif text-lg text-[#2B2625]">No reels in this category yet</p>
            <p className="text-xs text-[#7C706D] max-w-md mx-auto">
              Add Instagram Reels or videos for {CATEGORY_TABS.find((t) => t.id === activeTab)?.label || activeTab} using the form above.
            </p>
            <button
              type="button"
              onClick={() => reset(activeTab !== 'all' ? activeTab : 'home')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2B2625] text-white text-xs uppercase tracking-wider font-medium"
            >
              <HiPlus className="w-3.5 h-3.5" /> Add reel for this section
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, idx) => (
              <div
                key={item._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#E7DDD2] bg-white shadow-xs hover:border-[#2B2625] transition-all"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-[9/14] bg-[#151211] overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title || 'Reel cover'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : item.mediaType === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-white/50">
                      <FaInstagram className="w-10 h-10 mb-2 text-[#E1306C]" />
                      <span className="font-mono text-[9px] uppercase tracking-wider">Instagram Reel</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Category Badge Top-Left */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-wider">
                    {formatCategory(item.category)}
                  </span>

                  {/* Order Badge Top-Right */}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white text-[9px] font-mono">
                    #{item.order ?? idx + 1}
                  </span>

                  {/* Media Type Indicator */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white/80 font-mono text-[9px] uppercase">
                    {item.mediaType === 'video' ? (
                      <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                        <HiVideoCamera className="w-3 h-3" /> Direct Video
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#E1306C]/80 px-2 py-0.5 rounded text-white">
                        <FaInstagram className="w-3 h-3" /> Reel
                      </span>
                    )}
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-sm text-[#2B2625] font-medium line-clamp-1">
                      {item.title || 'Untitled Reel'}
                    </h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#7C706D] hover:text-[#C39E96] truncate block mt-0.5 font-mono"
                    >
                      {item.url}
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E7DDD2]/50">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveOrder(item, 'up')}
                        className="p-1 rounded text-[#7C706D] hover:bg-[#FAF6F3] disabled:opacity-20 hover:text-[#2B2625]"
                        title="Move Up"
                      >
                        <HiArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === filteredItems.length - 1}
                        onClick={() => moveOrder(item, 'down')}
                        className="p-1 rounded text-[#7C706D] hover:bg-[#FAF6F3] disabled:opacity-20 hover:text-[#2B2625]"
                        title="Move Down"
                      >
                        <HiArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => edit(item)}
                        className="p-1 rounded text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]"
                        title="Edit Item"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item._id)}
                        className="p-1 rounded text-[#7C706D] hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Item"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
