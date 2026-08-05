"use client";

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiQuestionMarkCircle, HiXMark } from 'react-icons/hi2';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ['General', 'Pricing', 'Services', 'Photography', 'Booking', 'Process', 'Products', 'Other'];

export function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    order: 0,
    id: '',
  });

  const fetchFAQs = useCallback(async () => {
    try {
      const response = await fetch('/api/faqs');
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question || !formData.answer) {
      setError('Question and answer are required');
      return;
    }

    try {
      const url = editingFaq
        ? `/api/faqs?id=${editingFaq._id}`
        : '/api/faqs';
      const method = editingFaq ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        order: parseInt(String(formData.order)) || 0,
      };

      if (editingFaq) {
        submitData.id = editingFaq._id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to save FAQ');

      await fetchFAQs();
      setShowForm(false);
      setEditingFaq(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      order: faq.order || 0,
      id: faq._id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete FAQ');
      await fetchFAQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      order: 0,
      id: '',
    });
    setEditingFaq(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const filteredFaqs = faqs.filter(faq => 
    filterCategory === 'all' || faq.category === filterCategory
  );

  if (loading) return <div className="flex items-center justify-center h-64">Loading FAQs...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-rich-black">FAQ Management</h2>
          <p className="font-sans text-sm text-warm-gray/60 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
        >
          <HiPlus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-sans transition-all ${
            filterCategory === 'all'
              ? 'bg-rich-black text-white'
              : 'bg-cream text-warm-gray hover:bg-beige'
          }`}
        >
          All <span className="ml-1 text-xs opacity-75">({faqs.length})</span>
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-sans transition-all ${
              filterCategory === cat
                ? 'bg-magenta/10 text-magenta border border-magenta/20'
                : 'bg-cream text-warm-gray hover:bg-beige'
            }`}
          >
            {cat} <span className="ml-1 text-xs opacity-75">({faqs.filter(f => f.category === cat).length})</span>
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-cream/50 rounded-lg p-6 mb-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="faq-form-title">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-cream z-10">
            <h3 id="faq-form-title" className="font-serif text-xl text-rich-black">
              {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
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
            <div>
              <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                Question
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                required
              />
            </div>

            <div>
              <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                Answer
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 appearance-none bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                  min="0"
                />
              </div>
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
                {editingFaq ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQs List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFaqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <HiQuestionMarkCircle className="w-16 h-16 text-warm-gray/30 mb-4" />
            <p className="font-serif text-xl text-warm-gray/60">No FAQs found</p>
            <p className="font-sans text-sm text-warm-gray/40 mt-1">
              {filterCategory !== 'all' 
                ? 'No FAQs in this category. Try another filter or add a new FAQ.'
                : 'Click "Add FAQ" to create your first question'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {filteredFaqs.map((faq) => (
              <div
                key={faq._id}
                className="bg-white border border-cream/50 rounded-lg p-6 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-sans text-xs px-2 py-1 bg-cream text-warm-gray rounded">
                        {faq.category}
                      </span>
                      <span className="font-sans text-xs text-warm-gray/50">Order: {faq.order}</span>
                    </div>
                    <h3 className="font-serif text-lg text-rich-black mb-2">{faq.question}</h3>
                    <p className="font-sans text-sm text-warm-gray/70 line-clamp-3">{faq.answer}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-2 rounded-lg hover:bg-cream text-warm-gray/60 hover:text-rich-black transition-all"
                      aria-label="Edit"
                    >
                      <HiPencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="p-2 rounded-lg hover:bg-magenta/5 text-warm-gray/60 hover:text-magenta transition-all"
                      aria-label="Delete"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}