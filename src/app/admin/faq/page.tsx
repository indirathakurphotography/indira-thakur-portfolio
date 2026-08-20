'use client';

import { useCallback, useEffect, useState } from 'react';
import { HiPencil, HiPlus, HiQuestionMarkCircle, HiTrash } from 'react-icons/hi2';

const SCOPES = [
  { value: 'home', label: 'Homepage (existing FAQ section)' },
  { value: 'newborn', label: 'Newborn gallery' },
  { value: 'maternity', label: 'Maternity gallery' },
  { value: 'portrait', label: 'Portrait gallery' },
  { value: 'wedding', label: 'Wedding gallery' },
  { value: 'events', label: 'Events gallery' },
  { value: 'brand', label: 'Brand gallery' },
];

type FAQ = {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  scope?: string;
  order?: number;
};

function getAdminHeaders() {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'General', scope: 'home', order: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/faqs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load FAQs.');
      const data = await res.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Could not load FAQs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reset = () => {
    setEditingId(null);
    setForm({ question: '', answer: '', category: 'General', scope: 'home', order: faqs.length + 1 });
  };

  const edit = (item: FAQ) => {
    setEditingId(item._id);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category || 'General',
      scope: item.scope || 'home',
      order: item.order || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setError('Question and answer are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const res = await fetch(editingId ? `/api/faqs?id=${editingId}` : '/api/faqs', {
        method: editingId ? 'PUT' : 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save FAQ.');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('faqs-updated'));
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('faqs-updated', String(Date.now()));
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setNotice(editingId ? 'FAQ updated.' : 'FAQ added.');
      reset();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/faqs?id=${id}`, { method: 'DELETE', headers: getAdminHeaders() });
      if (!res.ok) throw new Error('Could not delete FAQ.');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('faqs-updated'));
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try {
          localStorage.setItem('faqs-updated', String(Date.now()));
          localStorage.setItem('site-config-updated', String(Date.now()));
        } catch {}
      }

      setNotice('FAQ deleted.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not delete FAQ.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-[#2B2625] flex items-center gap-2">
          <HiQuestionMarkCircle className="w-7 h-7 text-[#C39E96]" /> FAQ manager
        </h1>
        <p className="mt-2 text-sm text-[#7C706D]">
          Select where each FAQ appears. Homepage keeps the current FAQ section; gallery FAQs appear only beneath their matching gallery.
        </p>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-[#E7DDD2] bg-white p-6">
        <h2 className="font-serif text-xl">{editingId ? 'Edit FAQ' : 'Add an FAQ'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-medium text-[#2B2625]">
            Display section
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-3 text-sm">
              {SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-[#2B2625]">
            Topic label (admin only)
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-3 text-sm" placeholder="e.g. Booking or Pricing" />
          </label>
        </div>
        <label className="block text-xs font-medium text-[#2B2625]">
          Question
          <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-3 text-sm" />
        </label>
        <label className="block text-xs font-medium text-[#2B2625]">
          Answer
          <textarea required rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-3 text-sm" />
        </label>
        <div className="flex gap-3">
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2B2625] px-4 py-2 text-sm text-white disabled:opacity-50">
            <HiPlus className="w-4 h-4" /> {saving ? 'Saving…' : editingId ? 'Update FAQ' : 'Add FAQ'}
          </button>
          {editingId && <button type="button" onClick={reset} className="rounded-lg border border-[#E7DDD2] px-4 py-2 text-sm">Cancel</button>}
        </div>
      </form>

      <section className="rounded-xl border border-[#E7DDD2] bg-white p-6">
        <h2 className="font-serif text-xl">All FAQs {loading ? '' : `(${faqs.length})`}</h2>
        {loading ? <p className="py-8 text-sm text-[#7C706D]">Loading FAQs…</p> : (
          <div className="mt-4 divide-y divide-[#E7DDD2]">
            {faqs.map((item) => (
              <article key={item._id} className="flex gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded border border-[#E7DDD2] bg-[#FAF6F3] px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      {SCOPES.find((scope) => scope.value === (item.scope || 'home'))?.label || item.scope}
                    </span>
                    <span className="text-[10px] text-[#7C706D]">{item.category || 'General'}</span>
                  </div>
                  <h3 className="font-medium text-[#2B2625]">{item.question}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#7C706D]">{item.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => edit(item)} className="rounded p-2 text-[#7C706D] hover:bg-[#FAF6F3]" title="Edit FAQ"><HiPencil className="w-4 h-4" /></button>
                  <button onClick={() => void remove(item._id)} className="rounded p-2 text-rose-700 hover:bg-rose-50" title="Delete FAQ"><HiTrash className="w-4 h-4" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
