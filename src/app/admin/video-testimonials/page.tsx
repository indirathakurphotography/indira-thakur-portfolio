'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import MediaUploader from '@/components/admin/MediaUploader';
import { 
  HiStar, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiArrowPath, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiPlay,
  HiXMark
} from 'react-icons/hi2';

interface VideoTestimonialItem {
  _id: string;
  clientName: string;
  title?: string;
  role?: string;
  quote?: string;
  videoUrl: string;
  googleDriveLink?: string;
  thumbnailUrl?: string;
  rating?: number;
  featured?: boolean;
  order?: number;
}

export default function AdminVideoTestimonialsPage() {
  const [items, setItems] = useState<VideoTestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoTestimonialItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

const [formData, setFormData] = useState({
    clientName: '',
    title: 'Newborn & Family Experience',
    role: 'Newborn Session',
    quote: '',
    videoUrl: '',
    googleDriveLink: '',
    thumbnailUrl: '',
    rating: 5,
    featured: true,
    order: items.length + 1,
  });

  const fetchVideoTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/video-testimonials', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load video testimonials from database');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch video testimonials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoTestimonials();
  }, [fetchVideoTestimonials]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      clientName: '',
      title: 'Newborn & Family Experience',
      role: 'Newborn Session',
      quote: '',
      videoUrl: '',
      googleDriveLink: '',
      thumbnailUrl: '',
      rating: 5,
      featured: true,
      order: items.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: VideoTestimonialItem) => {
    setEditingItem(item);
    setFormData({
      clientName: item.clientName || '',
      title: item.title || '',
      role: item.role || '',
      quote: item.quote || '',
      videoUrl: item.videoUrl || '',
      googleDriveLink: item.googleDriveLink || '',
      thumbnailUrl: item.thumbnailUrl || '',
      rating: item.rating || 5,
      featured: !!item.featured,
      order: item.order ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.videoUrl.trim()) {
      alert('Client Name and Video URL are required.');
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
        res = await fetch(`/api/video-testimonials?id=${editingItem._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ _id: editingItem._id, clientName: formData.clientName, title: formData.title, role: formData.role, quote: formData.quote, videoUrl: formData.googleDriveLink || formData.videoUrl, thumbnailUrl: formData.thumbnailUrl, rating: formData.rating, featured: formData.featured, order: formData.order }),
        });
      } else {
        res = await fetch('/api/video-testimonials', {
          method: 'POST',
          headers,
          body: JSON.stringify({ clientName: formData.clientName, title: formData.title, role: formData.role, quote: formData.quote, videoUrl: formData.googleDriveLink || formData.videoUrl, thumbnailUrl: formData.thumbnailUrl, rating: formData.rating, featured: formData.featured, order: formData.order }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save video testimonial');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: editingItem ? 'Video review updated!' : 'New video review created!' });
      setModalOpen(false);
      fetchVideoTestimonials();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving video review.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video review from MongoDB?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/video-testimonials?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: 'Video review deleted successfully.' });
      fetchVideoTestimonials();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete video review.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiStar className="w-3.5 h-3.5" />
            MongoDB Client Stories
          </div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal mt-1">
            Video Testimonials & Reviews ({items.length})
          </h1>
          <p className="font-sans text-xs text-[#7C706D]">
            Manage client video feedback, quotes, star ratings, and MP4 / YouTube embeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVideoTestimonials}
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
            <span>Add Video Review</span>
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

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70">
          <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-[#7C706D]">Loading Video Testimonials...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70 space-y-3">
          <HiStar className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
          <p className="font-serif text-base text-[#2B2625]">No video testimonials stored in database.</p>
          <button onClick={openCreateModal} className="text-xs text-[#C39E96] hover:underline font-medium">Add your first video testimonial</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const thumb = item.thumbnailUrl || 'https://picsum.photos/seed/testimonial/800/450';
            return (
              <div key={item._id} className="bg-white rounded-xl border border-[#E7DDD2]/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#2B2625] transition-all">
                <div>
                  <div className="relative aspect-[16/9] bg-stone-900 group">
                    <Image
                      src={thumb}
                      alt={item.clientName}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 text-[#2B2625] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HiPlay className="w-6 h-6 ml-1 text-[#2B2625]" />
                      </div>
                    </a>

                    {item.featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <HiStar className="w-3.5 h-3.5 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg text-[#2B2625] font-medium">{item.clientName}</h3>
                      <div className="flex text-amber-500 text-xs">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <HiStar key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="font-sans text-xs text-[#C39E96] font-medium">{item.role || item.title}</p>
                    {item.quote && (
                      <p className="font-serif italic text-xs text-[#7C706D] line-clamp-3 leading-relaxed">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF6F3]/50 border-t border-[#E7DDD2]/50 flex items-center justify-between">
                  <a href={item.videoUrl} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-[#C39E96] truncate max-w-[180px] hover:underline">
                    {item.videoUrl}
                  </a>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] text-xs font-medium flex items-center gap-1"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-xl border border-[#E7DDD2] shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between border-b border-[#E7DDD2]/50 px-6 py-4 bg-[#FAF6F3]/50">
              <h2 className="font-serif text-xl text-[#2B2625]">
                {editingItem ? 'Edit Video Review' : 'Add Video Review'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#7C706D] hover:text-[#2B2625] p-1 rounded-md">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neha Kanabar"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Video MP4 / YouTube URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://storage.supabase.co/... or https://drive.google.com/file/d/FILE_ID/view"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
                <div className="mt-2">
                  <label className="block text-xs font-medium text-[#7C706D] mb-1">Google Drive Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/FILE_ID/view"
                    value={formData.googleDriveLink}
                    onChange={(e) => setFormData({ ...formData, googleDriveLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Shoot Category / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Newborn Session"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>

                <div>
                  <label className="block text-[#2B2625] font-medium mb-1">Star Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>
              </div>

              <MediaUploader
                label="Thumbnail Cover Image (Optional)"
                description="Upload an image from your computer, drag and drop, paste a Google Drive link, or provide a direct image URL."
                value={formData.thumbnailUrl || ''}
                onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
                aspectRatio="aspect-video"
                folder="testimonials"
              />

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Client Quote Statement</label>
                <textarea
                  rows={3}
                  placeholder="Indira captured the purest moments of our baby's first week..."
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-vtest"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-[#2B2625] rounded"
                />
                <label htmlFor="featured-vtest" className="text-[#2B2625] font-medium cursor-pointer">
                  Feature on Homepage Review Section
                </label>
              </div>
            </form>

            <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7DDD2]/50 bg-[#FAF6F3]/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E7DDD2] text-[#7C706D] hover:text-[#2B2625] bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave as any}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#2B2625] text-white hover:bg-[#3D3534] uppercase font-medium tracking-wider disabled:opacity-50 transition-colors shadow-xs"
              >
                {saving ? 'Saving...' : 'Save to MongoDB'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
