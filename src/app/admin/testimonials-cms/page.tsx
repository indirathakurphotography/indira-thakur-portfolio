'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiPlus, HiTrash, HiUserGroup } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminTestimonialsPage() {
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

  const t = config.testimonials || {};

  const handleTestimonialChange = (index: number, field: string, value: string) => {
    const items = [...(t.testimonials || [])];
    items[index] = { ...items[index], [field]: field === 'rating' ? Number(value) : value };
    updateSection('testimonials', { testimonials: items });
  };

  const handleAvatarChange = (index: number, image: any) => {
    const items = [...(t.testimonials || [])];
    items[index] = { ...items[index], avatar: image };
    updateSection('testimonials', { testimonials: items });
  };

  const addTestimonial = () => {
    const items = [...(t.testimonials || []), { quote: '', author: '', role: '', rating: 5, avatar: { url: '', alt: '' } }];
    updateSection('testimonials', { testimonials: items });
  };

  const removeTestimonial = (index: number) => {
    const items = (t.testimonials || []).filter((_: any, i: number) => i !== index);
    updateSection('testimonials', { testimonials: items });
  };

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Testimonials"
        description="Manage client testimonials and quotes"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/#testimonials"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        <Section title="Section Header" defaultOpen icon={<HiUserGroup className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Eyebrow" value={t.eyebrow || ''} onChange={(v) => updateSection('testimonials', { eyebrow: v })} placeholder="e.g., Kind Words" helperText="Tiny text above the heading" />
            <FieldInput label="Heading" value={t.heading || ''} onChange={(v) => updateSection('testimonials', { heading: v })} placeholder="e.g., What Families Say" helperText="The main title of this section" />
          </div>
          <ImageManager
            label="Background Image"
            description="Optional section background"
            value={t.backgroundImage || { url: '', alt: '' }}
            onChange={(img) => updateSection('testimonials', { backgroundImage: img })}
            aspect="aspect-[16/9]"
            folder="testimonials/background"
            sectionIndicator="Testimonials"
            helperText="Optional background for this section"
          />
        </Section>

        <Section title={`Testimonials (${(t.testimonials || []).length})`} defaultOpen icon={<HiUserGroup className="w-5 h-5" />}>
          <div className="space-y-6">
            {(t.testimonials || []).map((item: any, i: number) => (
              <div key={i} className="p-5 bg-ivory/50 border border-cream/40 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Testimonial #{i + 1}</span>
                  <button type="button" onClick={() => removeTestimonial(i)} className="text-red-400 hover:text-red-600 transition-colors">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Quote</label>
                  <p className="font-sans text-[10px] text-warm-gray/50 mb-1.5">The exact words your client shared about their experience</p>
                  <textarea
                    value={item.quote || ''}
                    onChange={(e) => handleTestimonialChange(i, 'quote', e.target.value)}
                    rows={3}
                    placeholder="Client testimonial quote..."
                    className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldInput label="Author Name" value={item.author || ''} onChange={(v) => handleTestimonialChange(i, 'author', v)} placeholder="e.g., Ananya Sharma" helperText="The person who gave this testimonial" />
                  <FieldInput label="Role (optional)" value={item.role || ''} onChange={(v) => handleTestimonialChange(i, 'role', v)} placeholder="e.g., New Mom" helperText="Their relationship to you (e.g., New Mom)" />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-medium tracking-wider uppercase text-warm-gray/50 mb-1.5">Rating</label>
                  <p className="font-sans text-[10px] text-warm-gray/50 mb-1.5">Star rating for Google reviews display</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleTestimonialChange(i, 'rating', String(star))}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <svg className={`w-6 h-6 ${(item.rating || 5) >= star ? 'text-magenta fill-current' : 'text-warm-gray/40'}`} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </button>
                    ))}
                    <span className="font-mono text-[10px] text-warm-gray/50 ml-2">{item.rating || 5}/5</span>
                  </div>
                </div>
                <ImageManager
                  label="Client Photo (optional)"
                  value={item.avatar || { url: '', alt: '' }}
                  onChange={(img) => handleAvatarChange(i, img)}
                  aspect="aspect-square"
                  folder="testimonials/avatars"
                  sectionIndicator="Testimonials"
                />
              </div>
            ))}
            <button type="button" onClick={addTestimonial} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
              <HiPlus className="w-4 h-4" /> Add Testimonial
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
      {helperText && <p className="font-sans text-[10px] text-warm-gray/50 mb-1.5">{helperText}</p>}
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors" />
    </div>
  );
}
