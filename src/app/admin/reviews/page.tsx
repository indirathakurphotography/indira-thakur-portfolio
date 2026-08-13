'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiStar, HiUserGroup } from 'react-icons/hi2';

interface Review {
  _id?: string;
  id?: string;
  name: string;
  rating: number;
  content: string;
  source?: string;
  featured?: boolean;
  date?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [source, setSource] = useState('Google');
  const [featured, setFeatured] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/reviews', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleEdit = (rev: Review) => {
    setEditingId(rev._id || rev.id || null);
    setName(rev.name || '');
    setRating(rev.rating || 5);
    setContent(rev.content || '');
    setSource(rev.source || 'Google');
    setFeatured(rev.featured || false);
    setDate(rev.date || new Date().toISOString().slice(0, 10));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRating(5);
    setContent('');
    setSource('Google');
    setFeatured(false);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError('Client name and review content are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = { name, rating, content, source, featured, date };

      let res: Response;
      if (editingId) {
        res = await fetch('/api/reviews', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save review');
      }

      setSuccess(editingId ? 'Review updated successfully' : 'Review added successfully');
      resetForm();
      await fetchReviews();
    } catch (err: any) {
      setError(err?.message || 'Error saving review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete review');
      setSuccess('Review deleted successfully');
      await fetchReviews();
    } catch (err: any) {
      setError(err?.message || 'Error deleting review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] flex items-center gap-2">
          <HiUserGroup className="w-7 h-7 text-[#C39E96]" />
          Client Reviews & Testimonials
        </h1>
        <p className="font-sans text-sm text-[#7C706D] mt-1">
          Manage written reviews, ratings, and featured client quotes for the website.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs">
        <h2 className="font-serif text-lg font-medium text-[#2B2625] mb-4">
          {editingId ? 'Edit Review' : 'Add New Review'}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah & Michael"
                className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Rating (1-5)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              >
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
                <option value={2}>2 Stars ⭐⭐</option>
                <option value={1}>1 Star ⭐</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Source
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Google, Knot, WeddingWire"
                className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Review Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Client's testimonial text..."
              className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              required
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#C39E96] border-[#E7DDD2] focus:ring-[#C39E96]"
              />
              <span className="text-sm font-medium text-[#2B2625]">Feature on Homepage</span>
            </label>

            <div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2B2625] text-white rounded-lg text-sm font-medium hover:bg-[#3D3735] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Review' : 'Add Review'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] rounded-lg text-sm font-medium hover:bg-white"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
        <h2 className="font-serif text-lg font-medium text-[#2B2625]">
          All Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-sm text-[#7C706D]">No reviews found. Add your first review above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              const id = rev._id || rev.id;
              return (
                <div key={id || Math.random()} className="p-4 border border-[#E7DDD2] rounded-xl flex flex-col justify-between gap-3 bg-[#FAF6F3]/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-[#2B2625] text-sm">{rev.name}</h3>
                      <div className="flex items-center text-amber-500 gap-0.5">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <HiStar key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#7C706D] italic">"{rev.content}"</p>

                    <div className="flex items-center gap-2 text-[10px] text-[#7C706D]">
                      <span>Source: {rev.source || 'Website'}</span>
                      {rev.featured && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">Featured</span>
                      )}
                      {rev.date && <span>• {rev.date}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end pt-2 border-t border-[#E7DDD2]/60">
                    <button
                      onClick={() => handleEdit(rev)}
                      className="p-1.5 text-[#7C706D] hover:text-[#2B2625] hover:bg-white rounded"
                      title="Edit Review"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete Review"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

}
