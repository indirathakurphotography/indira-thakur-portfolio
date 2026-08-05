'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiPlus, HiTrash, HiEnvelope, HiArrowTopRightOnSquare, HiClipboardDocumentCheck } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminContactCMSPage() {
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

  const c = config.contact || {};

  const handleSocialChange = (index: number, field: string, value: string) => {
    const links = [...(c.socialLinks || [])];
    links[index] = { ...links[index], [field]: value };
    updateSection('contact', { socialLinks: links });
  };

  const addSocial = () => {
    const links = [...(c.socialLinks || []), { platform: '', url: '' }];
    updateSection('contact', { socialLinks: links });
  };

  const removeSocial = (index: number) => {
    const links = (c.socialLinks || []).filter((_: any, i: number) => i !== index);
    updateSection('contact', { socialLinks: links });
  };

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Contact Section"
        description="Manage contact information, social links, and images"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/#contact"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Google Form Section */}
        {(() => {
          const formUrl = c.googleFormUrl || 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform';
          return (
            <div className="bg-gradient-to-br from-white to-[#FAF6F3] border border-[#E7DDD2] rounded-xl p-5 md:p-6 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#2B2625] text-[#C39E96] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <HiClipboardDocumentCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#2B2625]">Google Form</h3>
                    <p className="font-sans text-xs text-[#7C706D] mt-1 leading-relaxed">
                      Website enquiries are also submitted to this Google Form.
                    </p>
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-[#C39E96] hover:underline break-all mt-1 inline-block"
                    >
                      {formUrl}
                    </a>
                  </div>
                </div>
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2B2625] text-white font-sans text-xs font-semibold tracking-wide rounded-lg hover:bg-[#C39E96] transition-all shadow-sm group whitespace-nowrap self-start sm:self-auto"
                >
                  <span>Open Google Form</span>
                  <HiArrowTopRightOnSquare className="w-4 h-4 text-[#C39E96] group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          );
        })()}

        <Section title="Content" defaultOpen icon={<HiEnvelope className="w-5 h-5" />}>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Eyebrow" value={c.eyebrow || ''} onChange={(v) => updateSection('contact', { eyebrow: v })} placeholder="e.g., Let's Create" helperText="Tiny text above the heading" />
            <FieldInput label="Heading" value={c.heading || ''} onChange={(v) => updateSection('contact', { heading: v })} placeholder="e.g., Begin Your Story" helperText="The main title of this section" />
          </div>
          <FieldTextarea label="Description" value={c.description || ''} onChange={(v) => updateSection('contact', { description: v })} rows={2} placeholder="Contact section description..." helperText="A warm invitation to get in touch" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldInput label="Email" value={c.email || ''} onChange={(v) => updateSection('contact', { email: v })} placeholder="hello@indirathakur.com" helperText="Your business email address" />
            <FieldInput label="Phone" value={c.phone || ''} onChange={(v) => updateSection('contact', { phone: v })} placeholder="+91 9819620484" helperText="Your business phone number" />
            <FieldInput label="Location" value={c.location || ''} onChange={(v) => updateSection('contact', { location: v })} placeholder="Mumbai, India" helperText="Your studio or city" />
          </div>
          <FieldInput label="Google Form URL" value={c.googleFormUrl || 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform'} onChange={(v) => updateSection('contact', { googleFormUrl: v })} placeholder="https://docs.google.com/forms/..." helperText="URL for direct Google Form enquiries" />
        </Section>

        <Section title="Social Links" icon={<HiEnvelope className="w-5 h-5" />}>
          <div className="space-y-3">
            {(c.socialLinks || []).map((link: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={link.platform || ''} onChange={(e) => handleSocialChange(i, 'platform', e.target.value)} placeholder="Platform (e.g., Instagram)" className="flex-1 px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40" />
                <input type="url" value={link.url || ''} onChange={(e) => handleSocialChange(i, 'url', e.target.value)} placeholder="URL" className="flex-1 px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40" />
                <button type="button" onClick={() => removeSocial(i)} className="px-3 text-red-400 hover:text-red-600 transition-colors"><HiTrash className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addSocial} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
              <HiPlus className="w-4 h-4" /> Add Social Link
            </button>
          </div>
        </Section>

        <Section title="Images" icon={<HiEnvelope className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageManager label="Banner Image" value={c.bannerImage || { url: '', alt: '' }} onChange={(img) => updateSection('contact', { bannerImage: img })} aspect="aspect-[16/9]" folder="contact/banner" sectionIndicator="Contact" helperText="Banner: A wide image for the top of the section" />
            <ImageManager label="Studio Image" value={c.studioImage || { url: '', alt: '' }} onChange={(img) => updateSection('contact', { studioImage: img })} aspect="aspect-[4/3]" folder="contact/studio" sectionIndicator="Contact" helperText="Studio: A photo of your workspace" />
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

function Section({ title, defaultOpen = false, children, icon }: { title: string; defaultOpen?: boolean; children: React.ReactNode; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-cream/50 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream/20 transition-colors">
        <div className="flex items-center gap-2">{icon}<h2 className="font-serif text-lg text-rich-black">{title}</h2></div>
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
      {helperText && <p className="text-[10px] text-warm-gray/40 mt-1">{helperText}</p>}
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 4, placeholder, helperText }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; helperText?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none" />
      {helperText && <p className="text-[10px] text-warm-gray/40 mt-1">{helperText}</p>}
    </div>
  );
}
