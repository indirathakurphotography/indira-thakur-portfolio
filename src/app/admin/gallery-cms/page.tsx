'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiPlus, HiTrash, HiPhoto } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminGalleryPreviewPage() {
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

  const gp = config.galleryPreview || {};

  const handleImageChange = (index: number, image: any) => {
    const imgs = [...(gp.featuredImages || [])];
    imgs[index] = image;
    updateSection('galleryPreview', { featuredImages: imgs });
  };

  const addImage = () => {
    const imgs = [...(gp.featuredImages || []), { url: '', alt: '', caption: '' }];
    updateSection('galleryPreview', { featuredImages: imgs });
  };

  const removeImage = (index: number) => {
    const imgs = (gp.featuredImages || []).filter((_: any, i: number) => i !== index);
    updateSection('galleryPreview', { featuredImages: imgs });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const imgs = [...(gp.featuredImages || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= imgs.length) return;
    [imgs[index], imgs[newIndex]] = [imgs[newIndex], imgs[index]];
    updateSection('galleryPreview', { featuredImages: imgs });
  };

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Gallery Preview"
        description="Manage the featured gallery preview section on the homepage"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/gallery"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        <Section title="Section Header" defaultOpen icon={<HiPhoto className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Eyebrow" value={gp.eyebrow || ''} onChange={(v) => updateSection('galleryPreview', { eyebrow: v })} placeholder="e.g., Portfolio" helperText="Tiny text above the heading" />
            <FieldInput label="Heading" value={gp.heading || ''} onChange={(v) => updateSection('galleryPreview', { heading: v })} placeholder="e.g., Featured Work" helperText="The main title of this section" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="CTA Text" value={gp.ctaText || ''} onChange={(v) => updateSection('galleryPreview', { ctaText: v })} placeholder="e.g., View Full Gallery" helperText="The text on the button" />
            <FieldInput label="CTA Link" value={gp.ctaLink || ''} onChange={(v) => updateSection('galleryPreview', { ctaLink: v })} placeholder="e.g., /gallery" helperText="Where the button goes (e.g., /gallery)" />
          </div>
        </Section>

        <Section title={`Featured Images (${(gp.featuredImages || []).length})`} defaultOpen icon={<HiPhoto className="w-5 h-5" />}>
          <div className="space-y-6">
            {(gp.featuredImages || []).map((img: any, i: number) => (
              <div key={i} className="p-5 bg-ivory/50 border border-cream/40 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Image #{i + 1}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="text-warm-gray/40 hover:text-rich-black disabled:opacity-20 transition-colors font-sans text-xs">↑</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === (gp.featuredImages || []).length - 1} className="text-warm-gray/40 hover:text-rich-black disabled:opacity-20 transition-colors font-sans text-xs">↓</button>
                    <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-600 transition-colors">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ImageManager
                  label={`Featured Image ${i + 1}`}
                  value={img || { url: '', alt: '' }}
                  onChange={(newImg) => handleImageChange(i, newImg)}
                  aspect="aspect-[16/9]"
                  folder="home/gallery"
                  helperText="Choose images that represent your best work"
                  sectionIndicator="Homepage Gallery"
                />
              </div>
            ))}
            <button type="button" onClick={addImage} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
              <HiPlus className="w-4 h-4" /> Add Featured Image
            </button>
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

function Section({ title, defaultOpen = false, icon, children }: { title: string; defaultOpen?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
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
