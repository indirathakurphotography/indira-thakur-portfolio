'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiQuestionMarkCircle } from 'react-icons/hi2';

interface FAQ {
  _id?: string;
  id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/faqs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      const data = await res.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq._id || faq.id || null);
    setQuestion(faq.question || '');
    setAnswer(faq.answer || '');
    setCategory(faq.category || 'General');
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError('Both Question and Answer are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = { question, answer, category };

      let res: Response;
      if (editingId) {
        res = await fetch(`/api/faqs?id=${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save FAQ');
      }

      setSuccess(editingId ? 'FAQ updated successfully' : 'FAQ created successfully');
      resetForm();
      await fetchFaqs();
    } catch (err: any) {
      setError(err?.message || 'Error saving FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete FAQ');
      setSuccess('FAQ deleted successfully');
      await fetchFaqs();
    } catch (err: any) {
      setError(err?.message || 'Error deleting FAQ');
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
          <HiQuestionMarkCircle className="w-7 h-7 text-[#C39E96]" />
          Frequently Asked Questions
        </h1>
        <p className="font-sans text-sm text-[#7C706D] mt-1">
          Manage questions and answers displayed on the website help & FAQ sections.
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
          {editingId ? 'Edit FAQ' : 'Add New FAQ'}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. General, Wedding, Pricing"
              className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is your turnaround time for wedding albums?"
              className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
              Answer *
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="Detailed answer..."
              className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2B2625] text-white rounded-lg text-sm font-medium hover:bg-[#3D3735] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update FAQ' : 'Add FAQ'}
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
          All FAQs ({faqs.length})
        </h2>

        {faqs.length === 0 ? (
          <p className="text-sm text-[#7C706D]">No FAQs found. Add your first question above.</p>
        ) : (
          <div className="divide-y divide-[#E7DDD2]">
            {faqs.map((faq) => {
              const id = faq._id || faq.id;
              return (
                <div key={id || Math.random()} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] rounded text-[10px] uppercase font-semibold">
                      {faq.category || 'General'}
                    </span>
                    <h3 className="font-medium text-[#2B2625] text-sm">{faq.question}</h3>
                    <p className="text-xs text-[#7C706D] whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-1.5 text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3] rounded"
                      title="Edit FAQ"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete FAQ"
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
