"use client";

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiStar, HiLink, HiXMark, HiGlobeAlt } from 'react-icons/hi2';

interface Review {
  _id: string;
  name: string;
  rating: number;
  content: string;
  source: 'google' | 'facebook' | 'website';
  date: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    content: '',
    source: 'website' as 'google' | 'facebook' | 'website',
    date: new Date().toISOString().slice(0, 10),
    featured: false,
    id: '',
  });

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content) {
      setError('Name and content are required');
      return;
    }

    try {
      const url = editingReview
        ? `/api/reviews?id=${editingReview._id}`
        : '/api/reviews';
      const method = editingReview ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        rating: parseInt(String(formData.rating)) || 5,
        featured: Boolean(formData.featured),
      };

      if (editingReview) {
        submitData.id = editingReview._id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to save review');

      await fetchReviews();
      setShowForm(false);
      setEditingReview(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      id: review._id,
      name: review.name || '',
      rating: review.rating || 5,
      content: review.content || '',
      source: review.source || 'website',
      date: review.date || new Date().toISOString().slice(0, 10),
      featured: review.featured || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete review');
      await fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      rating: 5,
      content: '',
      source: 'website',
      date: new Date().toISOString().slice(0, 10),
      featured: false,
    });
    setEditingReview(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google': return <HiGlobeAlt className="w-4 h-4" />;
      case 'facebook': return <HiGlobeAlt className="w-4 h-4" />;
      default: return <HiStar className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'google': return 'bg-blue-100 text-blue-700';
      case 'facebook': return 'bg-blue-200 text-blue-800';
      default: return 'bg-cream text-warm-gray';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading reviews...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-rich-black">Review Management</h2>
          <p className="font-sans text-sm text-warm-gray/60 mt-1">Manage Google, Facebook, and website reviews</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
        >
          <HiPlus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-cream/50 rounded-lg p-6 mb-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="review-form-title">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-cream z-10">
            <h3 id="review-form-title" className="font-serif text-xl text-rich-black">
              {editingReview ? 'Edit Review' : 'Add New Review'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Close form"
            >
              <HiXMark className="w-5 h-5 text-warm-gray" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                  required
                />
              </div>
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as 'google' | 'facebook' | 'website' })}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 appearance-none bg-white"
                >
                  <option value="google">Google Reviews</option>
                  <option value="facebook">Facebook Reviews</option>
                  <option value="website">Website Direct</option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Rating (1-5)
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 appearance-none bg-white"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 text-magenta focus:ring-magenta/50 border-cream/60 rounded"
                />
                <label htmlFor="featured" className="ml-2 font-sans text-sm text-warm-gray/70">
                  Featured Review
                </label>
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                Review Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cream sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 border border-cream/60 text-warm-gray/70 font-sans text-xs tracking-wider uppercase hover:bg-cream transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
              >
                {editingReview ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="flex-1 overflow-y-auto">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <HiStar className="w-16 h-16 text-warm-gray/30 mb-4" />
            <p className="font-serif text-xl text-warm-gray/60">No reviews yet</p>
            <p className="font-sans text-sm text-warm-gray/40 mt-1">Click "Add Review" to create your first review</p>
          </div>
        ) : (
          <div className="bg-white border border-cream/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream/50 bg-ivory/50">
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Client</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Rating</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Source</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Content</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Date</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Featured</th>
                    <th className="text-right p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review._id} className="border-b border-cream/30 hover:bg-ivory/50 transition-colors">
                      <td className="p-4 font-serif text-sm text-rich-black">{review.name}</td>
                      <td className="p-4">
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <span key={i} className="text-magenta/60 text-sm">★</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-sans text-xs px-2 py-1 rounded ${getSourceColor(review.source)} flex items-center gap-1`}>
                          {getSourceIcon(review.source)}
                          {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70 max-w-xs truncate">{review.content}</td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70">{new Date(review.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        {review.featured ? (
                          <span className="text-magenta/60 text-lg">★</span>
                        ) : (
                          <span className="text-cream text-lg">★</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(review)}
                            className="p-2 hover:bg-cream rounded-lg text-warm-gray/60 hover:text-rich-black transition-all"
                            aria-label="Edit"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(review._id)}
                            className="p-2 hover:bg-magenta/5 rounded-lg text-warm-gray/60 hover:text-magenta transition-all"
                            aria-label="Delete"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}