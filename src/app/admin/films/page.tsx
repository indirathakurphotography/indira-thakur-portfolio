'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import MediaUploader from '@/components/admin/MediaUploader';
import AdminCardSection from '@/components/admin/AdminCardSection';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';
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
  HiXMark,
  HiArrowUpTray,
  HiSparkles,
  HiPaintBrush
} from 'react-icons/hi2';

interface FilmItem {
  _id: string;
  title: string;
  category: string;
  videoUrl: string;
  googleDriveLink?: string;
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
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Films Section Header CMS state
  const [sectionEyebrow, setSectionEyebrow] = useState('CINEMATOGRAPHY & MOTION');
  const [sectionHeading, setSectionHeading] = useState('Films & Short Stories');
  const [sectionDescription, setSectionDescription] = useState('Preserving living emotion, gentle soundscapes, and timeless movement. From cultural documentaries to intimate family highlights.');
  const [eyebrowTypography, setEyebrowTypography] = useState<any>({});
  const [headingTypography, setHeadingTypography] = useState<any>({});
  const [descriptionTypography, setDescriptionTypography] = useState<any>({});
  const [cardTitleTypography, setCardTitleTypography] = useState<any>({});
  const [cardDescriptionTypography, setCardDescriptionTypography] = useState<any>({});
  const [savingHeader, setSavingHeader] = useState(false);

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

  const fetchSiteConfigHeader = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.films) {
          if (data.films.heading) setSectionHeading(data.films.heading);
          if (data.films.eyebrow) setSectionEyebrow(data.films.eyebrow);
          if (data.films.description) setSectionDescription(data.films.description);
          if (data.films.eyebrowTypography) setEyebrowTypography(data.films.eyebrowTypography);
          if (data.films.headingTypography) setHeadingTypography(data.films.headingTypography);
          if (data.films.descriptionTypography) setDescriptionTypography(data.films.descriptionTypography);
          if (data.films.cardTitleTypography) setCardTitleTypography(data.films.cardTitleTypography);
          if (data.films.cardDescriptionTypography) setCardDescriptionTypography(data.films.cardDescriptionTypography);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
    fetchSiteConfigHeader();
  }, [fetchFilms, fetchSiteConfigHeader]);

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingHeader(true);
      setFeedback(null);

      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          films: {
            eyebrow: sectionEyebrow,
            heading: sectionHeading,
            description: sectionDescription,
            eyebrowTypography,
            headingTypography,
            descriptionTypography,
            cardTitleTypography,
            cardDescriptionTypography,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save films section header settings');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: 'Films section header & typography settings updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error updating films header.' });
    } finally {
      setSavingHeader(false);
    }
  };

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
    if (!formData.title.trim() || (!formData.videoUrl.trim() && !formData.googleDriveLink.trim())) {
      alert('Add a title and either a video URL or a Google Drive link.');
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
          body: JSON.stringify({ _id: editingItem._id, title: formData.title, category: formData.category, videoUrl: formData.videoUrl, googleDriveLink: formData.googleDriveLink, thumbnailUrl: formData.thumbnailUrl, description: formData.description, featured: formData.featured, order: formData.order }),
        });
      } else {
        res = await fetch('/api/films', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: formData.title, category: formData.category, videoUrl: formData.videoUrl, googleDriveLink: formData.googleDriveLink, thumbnailUrl: formData.thumbnailUrl, description: formData.description, featured: formData.featured, order: formData.order }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save film');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
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

  const uploadMedia = async (file: File) => {
    try {
      setUploadingMedia(true);
      const token = localStorage.getItem('admin_token');
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'films');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/upload', { method: 'POST', headers, body: data });
      const result = await res.json();
      const uploadedUrl = result.url || result.src;
      if (!res.ok || !uploadedUrl) throw new Error(result.error || 'Upload failed');
      if (file.type.startsWith('video/')) {
        setFormData((current) => ({ ...current, videoUrl: uploadedUrl }));
      } else {
        setFormData((current) => ({ ...current, thumbnailUrl: uploadedUrl }));
      }
      setFeedback({ type: 'success', msg: file.type.startsWith('video/') ? 'Video uploaded and added to Video URL.' : 'Cover image uploaded and added to thumbnail.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Could not upload media.' });
    } finally {
      setUploadingMedia(false);
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

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setFeedback({ type: 'success', msg: 'Film deleted successfully.' });
      fetchFilms();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete film.' });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DDD2] shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiCommandLine className="w-3.5 h-3.5" />
            Cinema & Motion Portfolio
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B2625] font-normal mt-2">
            Films & Cinema Reel ({films.length})
          </h1>
          <p className="font-sans text-xs text-[#7C706D] max-w-2xl mt-1">
            Manage wedding teaser films, maternity motion stories, and YouTube / Google Drive cinema embeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFilms}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] hover:bg-white transition-colors"
            title="Refresh database records"
          >
            <HiArrowPath className={`w-4 h-4 text-[#C39E96] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-all shadow-sm cursor-pointer"
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
          <button onClick={() => setFeedback(null)} className="text-[#7C706D] hover:text-[#2B2625] font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-800 font-bold">✕</button>
        </div>
      )}

      {/* SECTION 1: Film Showcase Grid */}
      <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xs p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7DDD2]/70 pb-4">
          <div>
            <h2 className="font-serif text-xl text-[#2B2625] font-medium">Active Motion Reels & Cinema</h2>
            <p className="text-xs text-[#7C706D]">Click [Edit Film] to modify video URLs, covers, or cinema categories.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors"
          >
            <HiPlus className="w-4 h-4 text-[#C39E96]" />
            <span>New Film</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto mb-3" />
            <p className="font-mono text-xs text-[#7C706D]">Loading Films Database...</p>
          </div>
        ) : films.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[#E7DDD2] bg-[#FAF6F3]/50 space-y-3 p-8">
            <HiCommandLine className="w-10 h-10 text-[#C39E96] mx-auto opacity-60" />
            <p className="font-serif text-lg text-[#2B2625]">No cinema films stored in database.</p>
            <button onClick={openCreateModal} className="text-xs text-[#C39E96] hover:underline font-semibold">
              Add your first film reel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {films.map((film) => {
              const thumb = film.thumbnailUrl || 'https://picsum.photos/seed/cinema/800/450';
              return (
                <div key={film._id} className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#2B2625] transition-all group">
                  <div>
                    <div className="relative aspect-[16/9] bg-stone-900">
                      <Image
                        src={thumb}
                        alt={film.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <a
                        href={film.videoUrl || film.googleDriveLink}
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
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#2B2625]/80 backdrop-blur-xs text-white text-[10px] font-mono">
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

                  <div className="p-3.5 bg-[#FAF6F3]/50 border-t border-[#E7DDD2]/60 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#7C706D]">Order #{film.order ?? 0}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(film)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] text-xs flex items-center gap-1.5 font-medium cursor-pointer"
                      >
                        <HiPencil className="w-3.5 h-3.5 text-[#C39E96]" />
                        <span>Edit Film</span>
                      </button>
                      <button
                        onClick={() => handleDelete(film._id)}
                        className="p-1.5 rounded-lg bg-white border border-[#E7DDD2] text-rose-700 hover:bg-rose-50 text-xs cursor-pointer"
                        title="Delete Film"
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
      </div>

      {/* SECTION 2: Films Section Header & Typography Settings (Collapsible) */}
      <AdminCardSection
        title="Films Section Header & Typography Styling"
        description="Customize the public eyebrow tag, main heading title, description, and independent typography settings."
        icon={<HiPaintBrush className="w-5 h-5" />}
        badge="Header & Typography"
        defaultOpen={false}
      >
        <form onSubmit={handleSaveHeader} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#2B2625] font-semibold uppercase tracking-wide mb-1.5">Eyebrow Label</label>
              <input
                type="text"
                value={sectionEyebrow}
                onChange={(e) => setSectionEyebrow(e.target.value)}
                placeholder="CINEMATOGRAPHY & MOTION"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
            <div>
              <label className="block text-[#2B2625] font-semibold uppercase tracking-wide mb-1.5">Main Heading Title</label>
              <input
                type="text"
                value={sectionHeading}
                onChange={(e) => setSectionHeading(e.target.value)}
                placeholder="Films & Short Stories"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2B2625] font-semibold uppercase tracking-wide mb-1.5">Section Description / Subtitle</label>
            <textarea
              rows={2}
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
              placeholder="Preserving living emotion, gentle soundscapes, and timeless movement..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
            />
          </div>

          {/* Centralized Typography Customization Section */}
          <SectionTypographyManager
            title="Films Section Typography Elements"
            description="Select a text element to customize its font size, font style, font weight, and text color independently."
            elements={[
              {
                id: 'eyebrow',
                label: 'Eyebrow Category Badge',
                sublabel: 'Styles the "CINEMATOGRAPHY & MOTION" badge label',
                value: eyebrowTypography,
                onChange: setEyebrowTypography,
                defaultColor: '#C39E96',
              },
              {
                id: 'heading',
                label: 'Main Section Heading',
                sublabel: 'Styles "Films & Short Stories" section heading',
                value: headingTypography,
                onChange: setHeadingTypography,
                defaultColor: '#2B2625',
              },
              {
                id: 'description',
                label: 'Section Description / Subtitle',
                sublabel: 'Styles the descriptive subtitle under the films heading',
                value: descriptionTypography,
                onChange: setDescriptionTypography,
                defaultColor: '#7C706D',
              },
              {
                id: 'cardTitle',
                label: 'Film Card Title',
                sublabel: 'Styles the title on each individual cinema film card',
                value: cardTitleTypography,
                onChange: setCardTitleTypography,
                defaultColor: '#FFFFFF',
              },
              {
                id: 'cardDescription',
                label: 'Film Card Description',
                sublabel: 'Styles the brief summary narrative on film cards',
                value: cardDescriptionTypography,
                onChange: setCardDescriptionTypography,
                defaultColor: '#E7DDD2',
              },
            ]}
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingHeader}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2B2625] text-white text-xs rounded-xl hover:bg-[#3D3534] transition-colors font-medium cursor-pointer shadow-sm disabled:opacity-50"
            >
              <HiSparkles className="w-4 h-4 text-[#C39E96]" />
              <span>{savingHeader ? 'Saving Settings...' : 'Save Films Content & Typography'}</span>
            </button>
          </div>
        </form>
      </AdminCardSection>

      {/* Modal for Film Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/70 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#2B2625]">
                  {editingItem ? 'Edit Cinema Film' : 'Add Cinema Film'}
                </h2>
                <p className="text-xs text-[#7C706D] font-sans mt-0.5">
                  Configure streaming link, video file or Google Drive cinema stream.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">Film Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya & Kabir | Royal Udaipur Wedding"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  >
                    <option value="Wedding Cinema">Wedding Cinema</option>
                    <option value="Maternity Journey">Maternity Journey</option>
                    <option value="Newborn Story">Newborn Story</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Editorial & Brand">Editorial & Brand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">Video URL (Direct MP4, Vimeo, YouTube)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">Google Drive Link (Alternative / Backup)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  value={formData.googleDriveLink}
                  onChange={(e) => setFormData({ ...formData, googleDriveLink: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                />
              </div>

              <MediaUploader
                label="Poster / Cover Image Thumbnail"
                description="Upload an image file or enter URL for the cinema card cover."
                value={formData.thumbnailUrl}
                onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
                folder="films"
              />

              <div className="p-3 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#2B2625]">Direct Media Uploader</p>
                  <p className="text-[11px] text-[#7C706D]">Upload an MP4 video file directly or a custom poster image.</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMedia(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="px-3 py-1.5 bg-white border border-[#E7DDD2] rounded-lg text-xs font-medium text-[#2B2625] hover:bg-[#FAF6F3] flex items-center gap-1.5"
                >
                  <HiArrowUpTray className="w-3.5 h-3.5 text-[#C39E96]" />
                  <span>{uploadingMedia ? 'Uploading...' : 'Browse File'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">Film Narrative / Description</label>
                <textarea
                  rows={3}
                  placeholder="Emotional highlights or synopsis..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-film"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-[#2B2625] rounded"
                />
                <label htmlFor="featured-film" className="text-xs text-[#2B2625] font-medium cursor-pointer">
                  Feature prominently on Homepage & Reels Header
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7DDD2]/70">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E7DDD2] text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
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
