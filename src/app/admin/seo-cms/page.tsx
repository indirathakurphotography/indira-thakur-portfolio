'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiPlus, HiTrash, HiGlobeAlt } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminSEOPage() {
  const { config, loading, saving, error, dirty, lastSavedAt, updateSection, saveConfig, resetConfig, fetchConfig } = useCMS();
  const [newKeyword, setNewKeyword] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-sm text-warm-gray/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-red-500 font-sans text-sm">{error}</p>
      <button onClick={() => fetchConfig()} className="px-4 py-2 bg-rich-black text-white text-xs uppercase tracking-wider rounded">
        Retry
      </button>
    </div>
  );

  if (!config) return null;

  const seo = config.seo || {};

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    const keywords = [...(seo.keywords || []), newKeyword.trim()];
    updateSection('seo', { keywords });
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    const keywords = (seo.keywords || []).filter((_: any, i: number) => i !== index);
    updateSection('seo', { keywords });
  };

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="SEO Settings"
        description="Manage meta tags, descriptions, and social sharing"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        <Section title="Meta Tags" defaultOpen icon={<HiGlobeAlt className="w-5 h-5" />}>
          <FieldInput label="Page Title" value={seo.title || ''} onChange={(v) => updateSection('seo', { title: v })} placeholder="Indira Thakur Photography" helperText="The title that appears in browser tabs and Google search results" />
          <div>
            <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Meta Description</label>
            <textarea value={seo.description || ''} onChange={(e) => updateSection('seo', { description: e.target.value })} rows={3} placeholder="SEO description..." className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none" />
            <p className={`font-sans text-[10px] mt-1 ${seo.description.length > 160 ? 'text-red-500' : 'text-warm-gray/40'}`}>
              {seo.description.length}/160 characters {seo.description.length > 160 ? '(too long for search results)' : ''}
            </p>
          </div>
        </Section>

        <Section title="Keywords" icon={<HiGlobeAlt className="w-5 h-5" />}>
          <p className="font-sans text-[10px] text-warm-gray/40 mb-2">Words people might search to find your photography business</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(seo.keywords || []).map((kw: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream/50 border border-cream/60 rounded-full font-sans text-xs text-rich-black">
                {kw}
                <button type="button" onClick={() => removeKeyword(i)} className="text-warm-gray/40 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Add keyword..." className="flex-1 px-3 py-2 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40" onKeyDown={(e) => e.key === 'Enter' && addKeyword()} />
            <button type="button" onClick={addKeyword} className="px-4 py-2 bg-rich-black text-white text-xs uppercase tracking-wider rounded hover:bg-charcoal transition-colors">Add</button>
          </div>
        </Section>

        <Section title="Open Graph Image" icon={<HiGlobeAlt className="w-5 h-5" />}>
          <ImageManager
            label="OG Image"
            description="Image shown when shared on social media"
            value={seo.ogImage || { url: '', alt: '' }}
            onChange={(img) => updateSection('seo', { ogImage: img })}
            aspect="aspect-[1200/630]"
            folder="seo"
            sectionIndicator="SEO"
            helperText="The image shown when your website is shared on social media (1200x630 pixels recommended)"
          />
        </Section>

      </div>
      <StickySaveBar
        dirty={dirty}
        saving={saving}
        onDiscard={() => { resetConfig(); toast.info('Changes discarded'); }}
        onSave={() => saveConfig()}
      />
    </div>
  );
}

function Section({ title, defaultOpen = false, icon, children }: { title: string; defaultOpen?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-cream/50 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream/20 transition-colors">
        <h2 className="font-serif text-lg text-rich-black flex items-center gap-2">{icon}{title}</h2>
        <span className={`w-4 h-4 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <span className="w-3 h-px bg-warm-gray/40 absolute" />
          <span className="w-px h-3 bg-warm-gray/40 absolute" />
        </span>
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, helperText }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; helperText?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors" />
      {helperText && <p className="font-sans text-[10px] text-warm-gray/40 mt-1">{helperText}</p>}
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 4, placeholder, helperText }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; helperText?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none" />
      {helperText && <p className="font-sans text-[10px] text-warm-gray/40 mt-1">{helperText}</p>}
    </div>
  );
}
