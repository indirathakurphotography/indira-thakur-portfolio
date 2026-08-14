'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  HiCommandLine, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiArrowPath, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiStar,
  HiPlay,
  HiXMark
} from 'react-icons/hi2';

interface FilmItem {
  _id: string;
  title: string;
  category: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  featured?: boolean;
  order?: number;
}

export default function AdminFilmsPage() {
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FilmItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

const [formData, setFormData] = useState({
    title: '',
    category: 'Wedding Cinema',
    videoUrl: '',
    googleDriveLink: '',
    thumbnailUrl: '',
    description: '',
    featured: false,
    order: films.length + 1,
  });

  const fetchFilms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/films', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load films from database');
      const data = await res.json();
      setFilms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch films.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Wedding Cinema',
      videoUrl: '',
      googleDriveLink: '',
      thumbnailUrl: '',
      description: '',
      featured: false,
      order: films.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (film: FilmItem) => {
    setEditingItem(film);
    setFormData({
      title: film.title || '',
      category: film.category || 'Wedding Cinema',
      videoUrl: film.videoUrl || '',
      googleDriveLink: film.googleDriveLink || '',
      thumbnailUrl: film.thumbnailUrl || '',
      description: film.description || '',
      featured: !!film.featured,
      order: film.order ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      alert('Title and Video URL are required.');
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
        res = await fetch(`/api/films?id=${editingItem._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ _id: editingItem._id, title: formData.title, category: formData.category, videoUrl: formData.googleDriveLink || formData.videoUrl, thumbnailUrl: formData.thumbnailUrl, description: formData.description, featured: formData.featured, order: formData.order }),
        });
      } else {
        res = await fetch('/api/films', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: formData.title, category: formData.category, videoUrl: formData.googleDriveLink || formData.videoUrl, thumbnailUrl: formData.thumbnailUrl, description: formData.description, featured: formData.featured, order: formData.order }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save film');
      }

      setFeedback({ type: 'success', msg: editingItem ? 'Film updated!' : 'New film created!' });
      setModalOpen(false);
      fetchFilms();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error saving film.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this film from MongoDB?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/films?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed');

      setFeedback({ type: 'success', msg: 'Film deleted successfully.' });
      fetchFilms();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete film.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiCommandLine className="w-3.5 h-3.5" />
            MongoDB Cinema Database
          </div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal mt-1">
            Films & Cinema Reel ({films.length})
          </h1>
          <p className="font-sans text-xs text-[#7C706D]">
            Manage wedding teaser films, maternity stories, and YouTube / Google Drive cinema embeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFilms}
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
            <span>Add Cinema Film</span>
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
          <p className="font-mono text-xs text-[#7C706D]">Loading Films Database...</p>
        </div>
      ) : films.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E7DDD2]/70 space-y-3">
          <HiCommandLine className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
          <p className="font-serif text-base text-[#2B2625]">No cinema films stored in database.</p>
          <button onClick={openCreateModal} className="text-xs text-[#C39E96] hover:underline font-medium">Add your first film reel</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {films.map((film) => {
            const thumb = film.thumbnailUrl || 'https://picsum.photos/seed/cinema/800/450';
            return (
              <div key={film._id} className="bg-white rounded-xl border border-[#E7DDD2]/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#2B2625] transition-all">
                <div>
                  <div className="relative aspect-[16/9] bg-stone-900 group">
                    <Image
                      src={thumb}
                      alt={film.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                    <a
                      href={film.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 text-[#2B2625] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HiPlay className="w-6 h-6 ml-1 text-[#2B2625]" />
                      </div>
                    </a>

                    {film.featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <HiStar className="w-3.5 h-3.5 fill-current" />
                        Featured
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono uppercase">
                      {film.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-serif text-lg text-[#2B2625] font-medium">{film.title}</h3>
                    {film.description && (
                      <p className="font-sans text-xs text-[#7C706D] line-clamp-2 leading-relaxed">
                        {film.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF6F3]/50 border-t border-[#E7DDD2]/50 flex items-center justify-between">
                  <a href={film.videoUrl} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-[#C39E96] truncate max-w-[180px] hover:underline">
                    {film.videoUrl}
                  </a>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(film)}
                      className="p-1.5 rounded bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] text-xs font-medium flex items-center gap-1"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(film._id)}
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
          <div className="bg-white rounded-xl border border-[#E7DDD2] shadow-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-4">
              <h2 className="font-serif text-xl text-[#2B2625]">
                {editingItem ? 'Edit Cinema Film' : 'Add New Cinema Film'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#7C706D] hover:text-[#2B2625]">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Film Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Udaipur Wedding Teaser"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Video URL (YouTube / Google Drive / Direct MP4) *</label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
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
                  <label className="block text-[#2B2625] font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  >
                    <option value="Wedding Cinema">Wedding Cinema</option>
                    <option value="Maternity Film">Maternity Film</option>
                    <option value="Newborn Story">Newborn Story</option>
                    <option value="Brand Story">Brand Story</option>
                    <option value="Event Documentary">Event Documentary</option>
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
                <label className="block text-[#2B2625] font-medium mb-1">Cover Thumbnail Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://storage.supabase.co/..."
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-[#2B2625] font-medium mb-1">Story Synopsis</label>
                <textarea
                  rows={3}
                  placeholder="A romantic cinema teaser captured in..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-film"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-[#2B2625] rounded"
                />
                <label htmlFor="featured-film" className="text-[#2B2625] font-medium cursor-pointer">
                  Feature on Homepage Films Carousel
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
