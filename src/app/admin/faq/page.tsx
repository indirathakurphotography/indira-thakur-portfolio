'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionTypographyManager } from '@/components/admin/TypographyControl';
import AdminCardSection from '@/components/admin/AdminCardSection';
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
  HiSparkles,
  HiPaintBrush,
  HiXMark,
} from 'react-icons/hi2';
import { isCategoryMatch, formatCategory } from '@/lib/categoryUtils';

const CATEGORY_TABS = [
  { id: 'all', label: 'All FAQs' },
  { id: 'home', label: 'Homepage / General' },
  { id: 'newborn', label: 'Newborn' },
  { id: 'maternity', label: 'Maternity' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'events', label: 'Events' },
  { id: 'brand', label: 'Brand & Editorial' },
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
  const [modalOpen, setModalOpen] = useState(false);
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

  const openCreateModal = () => {
    setEditingId(null);
    const scopeVal = activeTab !== 'all' ? activeTab : 'home';
    setForm({
      question: '',
      answer: '',
      category: scopeVal !== 'home' ? formatCategory(scopeVal) : 'General',
      scope: scopeVal,
      order: faqs.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: FAQ) => {
    setEditingId(item._id);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category || 'General',
      scope: item.scope || 'home',
      order: item.order || 1,
    });
    setModalOpen(true);
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
      setModalOpen(false);
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E7DDD2] shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiQuestionMarkCircle className="w-3.5 h-3.5" />
            FAQ Category Architecture
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B2625] font-normal mt-2">
            Frequently Asked Questions ({faqs.length})
          </h1>
          <p className="mt-1 text-xs text-[#7C706D] font-sans max-w-2xl">
            Manage public answers for Homepage and individual Gallery categories (Newborn, Maternity, Portrait, Weddings, etc.).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#3D3534] transition-colors shadow-sm cursor-pointer"
          >
            <HiPlus className="w-4 h-4 text-[#C39E96]" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <HiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* SECTION 1: FAQ Directory Browser & Filter */}
      <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xs p-6 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E7DDD2]/70 pb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-semibold text-[#2B2625] uppercase tracking-wide">
              Filter by Category:
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-xs font-medium text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            >
              {CATEGORY_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({countsByTab[tab.id] || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full lg:w-72">
            <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C706D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
            />
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = countsByTab[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#2B2625] text-white shadow-xs font-medium'
                    : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2] hover:bg-[#E7DDD2]/40 hover:text-[#2B2625]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#7C706D]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQ Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-[#7C706D]">
            <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading FAQ items from database…
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#E7DDD2] bg-[#FAF6F3]/50 p-8 space-y-3">
            <p className="font-serif text-lg text-[#2B2625]">No FAQs in this section yet</p>
            <p className="text-xs text-[#7C706D] max-w-md mx-auto">
              Add specialized questions and reassuring guidance for {CATEGORY_TABS.find((t) => t.id === activeTab)?.label || activeTab}.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2B2625] text-white text-xs uppercase tracking-wider font-medium cursor-pointer"
            >
              <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
              <span>Add FAQ</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((item, idx) => (
              <div
                key={item._id}
                className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E7DDD2] hover:border-[#2B2625]/40 transition-all shadow-2xs flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 text-[#7C706D] text-xs font-mono shrink-0 pt-0.5">
                    <span className="w-7 h-7 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center font-bold text-[#C39E96]">
                      #{item.order ?? idx + 1}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-1">
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

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#E7DDD2] bg-[#FAF6F3] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#2B2625]">
                        {SCOPES.find((scope) => scope.value === (item.scope || 'home'))?.label || item.scope}
                      </span>
                      {item.category && item.category !== 'General' && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#C39E96] bg-[#FAF6F3] px-2.5 py-1 rounded-full border border-[#E7DDD2]">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base sm:text-lg text-[#2B2625] font-medium leading-snug">
                      {item.question}
                    </h3>
                    <p className="whitespace-pre-wrap font-sans text-xs text-[#7C706D] leading-relaxed line-clamp-3">
                      {item.answer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#2B2625] bg-[#FAF6F3] border border-[#E7DDD2] hover:bg-white transition-colors cursor-pointer"
                  >
                    <HiPencil className="w-3.5 h-3.5 text-[#C39E96]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => void remove(item._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50/70 border border-rose-200 hover:bg-rose-100/80 transition-colors cursor-pointer"
                  >
                    <HiTrash className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: FAQ Section Header & Typography Settings (Collapsible) */}
      <AdminCardSection
        title="FAQ Section Header & Typography Styling"
        description="Configure public section header titles and customize typography (Font Size, Family, Weight, Color) for FAQ questions and answers."
        icon={<HiPaintBrush className="w-5 h-5" />}
        badge="Header & Typography"
        defaultOpen={false}
      >
        <form onSubmit={saveFaqConfig} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Eyebrow Section Badge
              </label>
              <input
                type="text"
                value={faqEyebrow}
                onChange={(e) => setFaqEyebrow(e.target.value)}
                placeholder="QUESTIONS & ANSWERS"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                Main Heading Title
              </label>
              <input
                type="text"
                value={faqHeading}
                onChange={(e) => setFaqHeading(e.target.value)}
                placeholder="Frequently Asked Questions"
                className="w-full px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3]/50 rounded-xl text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
              />
            </div>
          </div>

          {/* Centralized Typography Customization Section */}
          <SectionTypographyManager
            title="FAQ Section Typography Elements"
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2B2625] text-white rounded-xl text-xs font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <HiSparkles className="w-4 h-4 text-[#C39E96]" />
              <span>{savingFaqConfig ? 'Saving...' : 'Save FAQ Header & Typography'}</span>
            </button>
          </div>
        </form>
      </AdminCardSection>

      {/* Focused Add / Edit FAQ Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/70 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#2B2625]">
                  {editingId ? 'Edit FAQ Item' : 'Add New FAQ Item'}
                </h2>
                <p className="text-xs text-[#7C706D] font-sans mt-0.5">
                  {editingId ? 'Update question and response details.' : 'Create a helpful response for prospective clients.'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-5 text-xs font-sans">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                    Display Scope / Category *
                  </label>
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
                    className="w-full rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 p-2.5 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  >
                    {SCOPES.map((scope) => (
                      <option key={scope.value} value={scope.value}>
                        {scope.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                    Topic Badge / Subcategory
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 p-2.5 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                    placeholder="e.g. Booking, Safety, What to Wear"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                  Question *
                </label>
                <input
                  required
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 p-3 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625]"
                  placeholder="e.g. What is the best time to schedule a newborn photography session?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2625] uppercase tracking-wide mb-1.5">
                  Answer *
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="w-full rounded-xl border border-[#E7DDD2] bg-[#FAF6F3]/50 p-3 text-xs text-[#2B2625] focus:bg-white focus:outline-none focus:border-[#2B2625] leading-relaxed"
                  placeholder="Write clear, reassuring editorial guidance for clients..."
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E7DDD2]/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7C706D] font-mono">Order:</span>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-16 rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] p-1.5 text-xs text-[#2B2625] text-center"
                  />
                </div>

                <div className="flex items-center gap-3">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2B2625] px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#3D3534] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    {saving ? 'Saving…' : editingId ? 'Update FAQ' : 'Save FAQ'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
