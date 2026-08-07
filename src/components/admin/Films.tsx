"use client";

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiVideoCamera, HiXMark, HiPhoto, HiExclamationCircle } from 'react-icons/hi2';
import { uploadImageDirect } from '@/lib/uploadHelper';
import { VIDEO_SPEC } from '@/lib/imageValidation';
import { formatVideoEmbedUrl, getVideoThumbnail } from '@/lib/videoUrlHelper';

interface FilmItem {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  publicId?: string;
  category: string;
  duration?: string;
  featured: boolean;
  order: number;
}

export function FilmsCMS() {
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFilm, setEditingFilm] = useState<FilmItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'Films',
    duration: '2:30',
    featured: false,
    order: 0,
  });

  const fetchFilms = useCallback(async () => {
    try {
      const response = await fetch('/api/films');
      if (!response.ok) throw new Error('Failed to fetch films');
      const data = await response.json();
      setFilms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl) {
      setError('Title and Video URL are required');
      return;
    }

    const formattedEmbed = formatVideoEmbedUrl(formData.videoUrl);
    const autoThumb = getVideoThumbnail(formData.videoUrl, formData.thumbnailUrl);

    const payload = {
      ...formData,
      videoUrl: formattedEmbed,
      thumbnailUrl: autoThumb,
    };

    try {
      const url = editingFilm ? `/api/films?id=${editingFilm._id}` : '/api/films';
      const method = editingFilm ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save film');

      await fetchFilms();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save film');
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImageDirect(file, 'films');
      setFormData((prev) => ({ ...prev, thumbnailUrl: result.url }));
    } catch (err) {
      setError('Thumbnail upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (film: FilmItem) => {
    setEditingFilm(film);
    setFormData({
      title: film.title || '',
      description: film.description || '',
      videoUrl: film.videoUrl || '',
      thumbnailUrl: film.thumbnailUrl || '',
      category: film.category || 'Films',
      duration: film.duration || '2:30',
      featured: film.featured || false,
      order: film.order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this film?')) return;
    try {
      const response = await fetch(`/api/films?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete film');
      await fetchFilms();
    } catch (err) {
      setError('Failed to delete film');
    }
  };

  const resetForm = () => {
    setEditingFilm(null);
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      category: 'Films',
      duration: '2:30',
      featured: false,
      order: 0,
    });
  };

  if (loading) return <div className="p-8 text-center text-warm-gray">Loading films...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl text-rich-black">Films & Cinema CMS</h1>
          <p className="text-warm-gray text-sm mt-1">Manage video highlights, short films, and documentary clips</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2.5 bg-rich-black text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-charcoal transition-all"
        >
          <HiPlus className="w-4 h-4" /> Add New Film
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-cream rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-cream">
            <h2 className="font-serif text-xl text-rich-black">
              {editingFilm ? 'Edit Film' : 'Add New Film'}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-warm-gray hover:text-rich-black">
              <HiXMark className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-ivory/50 border border-cream/60 rounded text-xs text-warm-gray/70 space-y-1">
              <p className="font-medium text-warm-gray/80 uppercase tracking-wider text-[10px] mb-1">Video Specifications</p>
              <p>Format: {VIDEO_SPEC.acceptedFormats}</p>
              <p>Resolution: {VIDEO_SPEC.recommendedResolution} · Aspect Ratio: {VIDEO_SPEC.aspectRatio}</p>
              <p>Frame Rate: {VIDEO_SPEC.frameRate} · Audio: {VIDEO_SPEC.audio}</p>
              <p>Duration: {VIDEO_SPEC.recommendedDuration} (Max: {VIDEO_SPEC.maxDuration})</p>
              <p>File Size: {VIDEO_SPEC.recommendedFileSize} (Max: {VIDEO_SPEC.maxFileSize})</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-warm-gray mb-2">Film Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Whispers of the Dawn"
                  className="w-full px-4 py-3 bg-white border border-cream rounded text-sm focus:outline-none focus:border-magenta"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-warm-gray mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Newborn Story, Maternity, Filmcity Feature"
                  className="w-full px-4 py-3 bg-white border border-cream rounded text-sm focus:outline-none focus:border-magenta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-warm-gray mb-2">Video URL (Google Drive / YouTube / Vimeo / MP4) *</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoThumb = getVideoThumbnail(val);
                    setFormData((prev) => ({
                      ...prev,
                      videoUrl: val,
                      thumbnailUrl: prev.thumbnailUrl || (autoThumb !== 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/films/1785569204452-thumbnail.jpg' ? autoThumb : '')
                    }));
                  }}
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-4 py-3 bg-white border border-cream rounded text-sm focus:outline-none focus:border-magenta"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-warm-gray mb-2">Duration (e.g., 3:45)</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="2:30"
                  className="w-full px-4 py-3 bg-white border border-cream rounded text-sm focus:outline-none focus:border-magenta"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-warm-gray mb-2">Thumbnail Poster Image URL</label>
              <div className="flex gap-4 items-center">
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://abc.supabase.co/storage/v1/object/public/images/..."
                  className="flex-1 px-4 py-3 bg-white border border-cream rounded text-sm focus:outline-none focus:border-magenta"
                />
                <label className="px-4 py-3 bg-cream hover:bg-cream/80 text-rich-black text-xs uppercase tracking-wider rounded cursor-pointer flex items-center gap-2">
                  <HiPhoto className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                </label>
              </div>
              {uploading && <p className="text-xs text-magenta mt-1">Uploading thumbnail...</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-warm-gray mb-2">Description / Story Narrative</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief editorial summary of this short film..."
                className="w-full px-4 py-3 bg-white border border-cream rounded text-sm focus:outline-none focus:border-magenta"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-rich-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded text-magenta focus:ring-magenta"
                />
                Featured Film
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-warm-gray uppercase tracking-wider">Display Order:</span>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-20 px-3 py-1.5 border border-cream rounded text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cream">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-cream text-warm-gray text-xs uppercase tracking-wider hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rich-black text-white text-xs uppercase tracking-wider hover:bg-charcoal"
              >
                {editingFilm ? 'Update Film' : 'Publish Film'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Films Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {films.map((film) => (
          <div key={film._id} className="bg-white border border-cream rounded-lg overflow-hidden shadow-sm group">
            <div className="relative aspect-video bg-charcoal overflow-hidden flex items-center justify-center">
              {film.thumbnailUrl ? (
                <img src={film.thumbnailUrl} alt={film.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="text-white/40 flex flex-col items-center">
                  <HiVideoCamera className="w-12 h-12 mb-2" />
                  <span className="text-xs uppercase tracking-wider">Video Clip</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 text-rich-black flex items-center justify-center font-bold shadow-lg">
                  ▶
                </div>
              </div>
              {film.duration && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {film.duration}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-magenta tracking-wider block">{film.category}</span>
                  <h3 className="font-serif text-lg text-rich-black font-medium">{film.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(film)} className="p-1.5 text-warm-gray hover:text-rich-black">
                    <HiPencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(film._id)} className="p-1.5 text-warm-gray hover:text-rose-600">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {film.description && (
                <p className="text-xs text-warm-gray line-clamp-2 leading-relaxed">{film.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
