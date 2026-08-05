'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { HiDocumentText } from 'react-icons/hi2';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminFooterPage() {
  const { config, loading, saving, error, dirty, lastSavedAt, updateSection, saveConfig, resetConfig, fetchConfig } = useCMS();

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

  const f = config.footer || {};

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Footer"
        description="Manage footer content, logo, and social links"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        <Section title="Footer Content" icon={<HiDocumentText className="w-5 h-5" />} defaultOpen>
          <FieldInput label="Tagline" value={f.tagline || ''} onChange={(v) => updateSection('footer', { tagline: v })} placeholder="e.g., Photography" helperText="Short text under your name (e.g., Photography)" />
          <FieldTextarea label="Description" value={f.description || ''} onChange={(v) => updateSection('footer', { description: v })} rows={3} placeholder="Footer description..." helperText="A brief description shown in the footer" />
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Email" value={f.email || ''} onChange={(v) => updateSection('footer', { email: v })} placeholder="hello@indirathakur.com" helperText="Contact email shown in footer" />
            <FieldInput label="Phone" value={f.phone || ''} onChange={(v) => updateSection('footer', { phone: v })} placeholder="+91 99999 99999" helperText="Contact phone shown in footer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Instagram URL" value={f.instagramUrl || ''} onChange={(v) => updateSection('footer', { instagramUrl: v })} placeholder="https://instagram.com" helperText="Your Instagram profile link" />
            <FieldInput label="Facebook URL" value={f.facebookUrl || ''} onChange={(v) => updateSection('footer', { facebookUrl: v })} placeholder="https://facebook.com" helperText="Your Facebook page link" />
          </div>
        </Section>

        <Section title="Footer Images" icon={<HiDocumentText className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageManager label="Logo" value={f.logo || { url: '', alt: '' }} onChange={(img) => updateSection('footer', { logo: img })} aspect="aspect-[3/1]" folder="footer/logo" sectionIndicator="Footer" helperText="Logo: Your brand logo for the footer" />
            <ImageManager label="Background Image" value={f.backgroundFooter || { url: '', alt: '' }} onChange={(img) => updateSection('footer', { backgroundFooter: img })} aspect="aspect-[16/9]" folder="footer/background" sectionIndicator="Footer" helperText="Background: Optional footer background image" />
          </div>
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

function Section({ title, icon, defaultOpen = false, children }: { title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-cream/50 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream/20 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-serif text-lg text-rich-black">{title}</h2>
        </div>
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
      {helperText && <p className="mt-1 font-sans text-[10px] text-warm-gray/50">{helperText}</p>}
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 4, placeholder, helperText }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; helperText?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none" />
      {helperText && <p className="mt-1 font-sans text-[10px] text-warm-gray/50">{helperText}</p>}
    </div>
  );
}
