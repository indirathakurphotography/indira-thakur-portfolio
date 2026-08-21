'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';
import {
  HiPencil,
  HiPlus,
  HiQuestionMarkCircle,
  HiTrash,
  HiMagnifyingGlass,
  HiArrowUp,
  HiArrowDown,
  HiCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi2';
import { isCategoryMatch, formatCategory } from '@/lib/categoryUtils';

const CATEGORY_TABS = [
  { id: 'all', label: 'All FAQs' },
  { id: 'home', label: 'Homepage' },
  { id: 'newborn', label: 'Newborn Gallery' },
  { id: 'maternity', label: 'Maternity Gallery' },
  { id: 'portrait', label: 'Portrait Gallery' },
  { id: 'wedding', label: 'Weddings Gallery' },
  { id: 'events', label: 'Events Gallery' },
  { id: 'brand', label: 'Brand Gallery' },
];

const SCOPES = [
  { value: 'home', label: 'Homepage (Main FAQ Section)' },
  { value: 'newborn', label: 'Newborn Gallery' },
  { value: 'maternity', label: 'Maternity Gallery' },
  { value: 'portrait', label: 'Portrait Gallery' },
  { value: 'wedding', label: 'Weddings Gallery' },
  { value: 'events', label: 'Events Gallery' },
  { value: 'brand', label: 'Brand Gallery' },
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
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
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ Section Header & Typography CMS state
  const [faqEyebrow, setFaqEyebrow] = useState('QUESTIONS & ANSWERS');
  const [faqHeading, setFaqHeading] = useState('Frequently Asked Questions');
  const [eyebrowTypography, setEyebrowTypography] = useState<any>({});
  const [headingTypography, setHeadingTypography] = useState<any>({});
  const [questionTypography, setQuestionTypography] = useState<any>({});
  const [answerTypography, setAnswerTypography] = useState<any>({});
  const [savingFaqConfig, setSavingFaqConfig] = useState(false);

  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'General',
    scope: 'home',
    order: 1,
  });

  const loadSiteConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.faq) {
          if (data.faq.eyebrow) setFaqEyebrow(data.faq.eyebrow);
          if (data.faq.heading) setFaqHeading(data.faq.heading);
          if (data.faq.eyebrowTypography) setEyebrowTypography(data.faq.eyebrowTypography);
          if (data.faq.headingTypography) setHeadingTypography(data.faq.headingTypography);
          if (data.faq.questionTypography) setQuestionTypography(data.faq.questionTypography);
          if (data.faq.answerTypography) setAnswerTypography(data.faq.answerTypography);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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

  useEffect(() => {
    void load();
    void loadSiteConfig();
  }, [load, loadSiteConfig]);

  const saveFaqConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingFaqConfig(true);
      setNotice(null);
      setError(null);

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          faq: {
            eyebrow: faqEyebrow,
            heading: faqHeading,
            eyebrowTypography,
            headingTypography,
            questionTypography,
            answerTypography,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update FAQ configuration');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-config-updated'));
        try { localStorage.setItem('site-config-updated', String(Date.now())); } catch {}
      }

      setNotice('FAQ typography & header settings updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Error updating FAQ header settings.');
    } finally {
      setSavingFaqConfig(false);
    }
  };

  const reset = (defaultScope = activeTab !== 'all' ? activeTab : 'home') => {
    setEditingId(null);
    setForm({
      question: '',
      answer: '',
      category: defaultScope !== 'home' ? formatCategory(defaultScope) : 'General',
      scope: defaultScope,
      order: faqs.length + 1,
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (!editingId) {
      const scopeVal = tabId !== 'all' ? tabId : 'home';
      setForm((prev) => ({
        ...prev,
        scope: scopeVal,
        category: scopeVal !== 'home' ? formatCategory(scopeVal) : 'General',
      }));
    }
  };

  const edit = (item: FAQ) => {
    setEditingId(item._id);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category || 'General',
      scope: item.scope || 'home',
      order: item.order || 1,
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

      setNotice(editingId ? 'FAQ updated in MongoDB.' : 'New FAQ saved to MongoDB.');
      reset(activeTab !== 'all' ? activeTab : form.scope);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this FAQ permanently from MongoDB?')) return;
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

      setNotice('FAQ deleted successfully.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not delete FAQ.');
    }
  };

  const moveOrder = async (faq: FAQ, direction: 'up' | 'down') => {
    const list = filteredFaqs;
    const currentIndex = list.findIndex((f) => f._id === faq._id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const swapTarget = list[targetIndex];
    try {
      const currentOrder = faq.order ?? currentIndex + 1;
      const targetOrder = swapTarget.order ?? targetIndex + 1;

      await fetch(`/api/faqs?id=${faq._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: faq._id, order: targetOrder }),
      });

      await fetch(`/api/faqs?id=${swapTarget._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: swapTarget._id, order: currentOrder }),
      });

      await load();
    } catch {
      setError('Could not update display order.');
    }
  };

  const filteredFaqs = faqs.filter((item) => {
    const scopeVal = item.scope || 'home';
    const categoryVal = item.category || 'General';

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'home' && (scopeVal === 'home' || !item.scope)) ||
      isCategoryMatch(scopeVal, activeTab) ||
      isCategoryMatch(categoryVal, activeTab);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const countsByTab = (() => {
    const map: Record<string, number> = { all: faqs.length };
    CATEGORY_TABS.forEach((t) => {
      if (t.id === 'all') return;
      map[t.id] = faqs.filter((f) => {
        const s = f.scope || 'home';
        const c = f.category || 'General';
        return (
          (t.id === 'home' && (s === 'home' || !f.scope)) ||
          isCategoryMatch(s, t.id) ||
          isCategoryMatch(c, t.id)
        );
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
            <HiQuestionMarkCircle className="w-3.5 h-3.5" />
            FAQ Category Architecture
          </div>
          <h1 className="font-serif text-3xl text-[#2B2625] font-normal mt-2">
            Frequently Asked Questions
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans">
            Manage public answers for Homepage and individual Gallery categories (Newborn, Maternity, Portrait, Weddings, etc.).
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

      {/* FAQ Section Header & Typography Settings */}
      <div className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-serif text-xl text-[#2B2625]">
            FAQ Section Header & Typography Styling
          </h2>
          <p className="font-sans text-xs text-[#7C706D] mt-0.5">
            Configure section header titles and customize typography (Font Size, Font Family, Boldness, and Colors) for the public FAQ accordion.
          </p>
        </div>

        <form onSubmit={saveFaqConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Eyebrow Label
              </label>
              <input
                type="text"
                value={faqEyebrow}
                onChange={(e) => setFaqEyebrow(e.target.value)}
                placeholder="QUESTIONS & ANSWERS"
                className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                Main Heading Title
              </label>
              <input
                type="text"
                value={faqHeading}
                onChange={(e) => setFaqHeading(e.target.value)}
                placeholder="Frequently Asked Questions"
                className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          </div>

          {/* Centralized Typography Customization Section */}
          <SectionTypographyManager
            title="FAQ Section Typography"
            description="Select a text element to customize its font size, font style, font weight, and text color independently."
            elements={[
              {
                id: 'eyebrow',
                label: 'Eyebrow Category Badge',
                sublabel: 'Styles the "QUESTIONS & ANSWERS" section badge',
                value: eyebrowTypography,
                onChange: setEyebrowTypography,
                defaultColor: '#C39E96',
              },
              {
                id: 'heading',
                label: 'Main Section Heading',
                sublabel: 'Styles "Frequently Asked Questions" section title',
                value: headingTypography,
                onChange: setHeadingTypography,
                defaultColor: '#2B2625',
              },
              {
                id: 'question',
                label: 'FAQ Question Trigger Title',
                sublabel: 'Styles the clickable question trigger in the accordion',
                value: questionTypography,
                onChange: setQuestionTypography,
                defaultColor: '#2B2625',
              },
              {
                id: 'answer',
                label: 'FAQ Answer Body Explanation',
                sublabel: 'Styles the expanded answer explanation body text',
                value: answerTypography,
                onChange: setAnswerTypography,
                defaultColor: '#7C706D',
              },
            ]}
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingFaqConfig}
              className="px-5 py-2.5 bg-[#2B2625] text-white rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingFaqConfig ? 'Saving...' : 'Save FAQ Header & Typography'}
            </button>
          </div>
        </form>
      </div>

      {/* FAQ Creation & Edit Form */}
      <form onSubmit={save} className="space-y-4 rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E7DDD2]/60 pb-3">
          <h2 className="font-serif text-xl text-[#2B2625]">
            {editingId ? 'Edit FAQ Item' : 'Add New FAQ Item'}
          </h2>
          {editingId && (
            <span className="font-mono text-[10px] uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              Editing Mode
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs font-medium text-[#2B2625]">
            Display Section / Category *
            <select
              value={form.scope}
              onChange={(e) => {
                const newScope = e.target.value;
                setForm({
                  ...form,
                  scope: newScope,
                  category: newScope !== 'home' ? formatCategory(newScope) : form.category,
                });
              }}
              className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            >
              {SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-[#2B2625]">
            Topic Badge / Label
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              placeholder="e.g. Booking, Safety, What to Wear"
            />
          </label>

          <label className="text-xs font-medium text-[#2B2625]">
            Display Order Number
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
              className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </label>
        </div>

        <label className="block text-xs font-medium text-[#2B2625]">
          Question *
          <input
            required
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            placeholder="e.g. What is the best time to schedule a newborn photography session?"
          />
        </label>

        <label className="block text-xs font-medium text-[#2B2625]">
          Answer *
          <textarea
            required
            rows={4}
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-2.5 text-sm text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            placeholder="Write clear, reassuring editorial guidance for clients..."
          />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2B2625] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-xs"
          >
            <HiPlus className="w-4 h-4" /> {saving ? 'Saving to Database…' : editingId ? 'Update FAQ' : 'Save FAQ'}
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

      {/* Category Tabs & FAQ List Container */}
      <section className="rounded-xl border border-[#E7DDD2] bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7DDD2]/60 pb-4">
          <div>
            <h2 className="font-serif text-xl text-[#2B2625]">
              FAQ Directory {loading ? '' : `(${filteredFaqs.length})`}
            </h2>
            <p className="text-xs text-[#7C706D] mt-0.5">
              Filter by gallery section or search questions and answers.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C706D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
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
          <div className="py-12 text-center text-sm text-[#7C706D]">Loading FAQ items from MongoDB…</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-dashed border-[#E7DDD2] bg-[#FAF6F3]/50 p-8 space-y-3">
            <p className="font-serif text-lg text-[#2B2625]">No FAQs in this section yet</p>
            <p className="text-xs text-[#7C706D] max-w-md mx-auto">
              You can add FAQs specifically for {CATEGORY_TABS.find((t) => t.id === activeTab)?.label || activeTab} using the form above.
            </p>
            <button
              type="button"
              onClick={() => reset(activeTab !== 'all' ? activeTab : 'home')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2B2625] text-white text-xs uppercase tracking-wider font-medium"
            >
              <HiPlus className="w-3.5 h-3.5" /> Add FAQ for this section
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E7DDD2]">
            {filteredFaqs.map((item, idx) => (
              <article key={item._id} className="flex flex-col sm:flex-row sm:items-start gap-4 py-4 group">
                <div className="flex items-center gap-2 sm:flex-col sm:items-center text-[#7C706D] text-xs font-mono">
                  <span className="w-6 text-center font-bold text-[#C39E96]">#{item.order ?? idx + 1}</span>
                  <div className="flex sm:flex-col gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveOrder(item, 'up')}
                      className="p-1 rounded hover:bg-[#FAF6F3] disabled:opacity-20 hover:text-[#2B2625]"
                      title="Move up"
                    >
                      <HiArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredFaqs.length - 1}
                      onClick={() => moveOrder(item, 'down')}
                      className="p-1 rounded hover:bg-[#FAF6F3] disabled:opacity-20 hover:text-[#2B2625]"
                      title="Move down"
                    >
                      <HiArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[#E7DDD2] bg-[#FAF6F3] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#2B2625]">
                      {SCOPES.find((scope) => scope.value === (item.scope || 'home'))?.label || item.scope}
                    </span>
                    {item.category && item.category !== 'General' && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#C39E96] bg-[#FAF6F3] px-2 py-0.5 rounded border border-[#E7DDD2]">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base text-[#2B2625] font-medium leading-snug">
                    {item.question}
                  </h3>
                  <p className="whitespace-pre-wrap font-sans text-xs text-[#7C706D] leading-relaxed">
                    {item.answer}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:self-start pt-1">
                  <button
                    onClick={() => edit(item)}
                    className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs text-[#7C706D] hover:bg-[#FAF6F3] hover:text-[#2B2625] border border-transparent hover:border-[#E7DDD2] transition-colors"
                    title="Edit FAQ"
                  >
                    <HiPencil className="w-4 h-4" />
                    <span className="hidden md:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => void remove(item._id)}
                    className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    title="Delete FAQ"
                  >
                    <HiTrash className="w-4 h-4" />
                    <span className="hidden md:inline">Delete</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
