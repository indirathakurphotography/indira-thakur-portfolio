'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiPlus, HiTrash, HiCommandLine, HiPhoto } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminServicesPage() {
  const { config, loading, saving, error, dirty, lastSavedAt, updateSection, saveConfig, resetConfig, fetchConfig } = useCMS();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-sm text-warm-gray/50">Loading your Services...</p>
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

  const services = config.services || {};

  const handleServiceChange = (index: number, field: string, value: string) => {
    const svcs = [...(services.services || [])];
    svcs[index] = { ...svcs[index], [field]: value };
    updateSection('services', { services: svcs });
  };

  const handleServiceImageChange = (index: number, image: any) => {
    const svcs = [...(services.services || [])];
    svcs[index] = { ...svcs[index], image };
    updateSection('services', { services: svcs });
  };

  const addService = () => {
    const svcs = [...(services.services || []), { title: '', subtitle: '', description: '', gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]', image: { url: '', alt: '' } }];
    updateSection('services', { services: svcs });
  };

  const removeService = (index: number) => {
    const svcs = (services.services || []).filter((_: any, i: number) => i !== index);
    updateSection('services', { services: svcs });
  };

  const gradients = [
    { value: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]', label: 'Dark Warm' },
    { value: 'from-[#2C1810] via-[#3D2C25] to-[#1A1110]', label: 'Amber' },
    { value: 'from-[#1A1A1A] via-[#2C1810] to-[#3D2C25]', label: 'Charcoal' },
    { value: 'from-[#3D2C25] via-[#2C1810] to-[#2C2C2C]', label: 'Deep Brown' },
    { value: 'from-[#2C2C2C] via-[#1A1A1A] to-rich-black', label: 'Midnight' },
  ];

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Services"
        description="Showcase the types of photography you offer"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/#services"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Section Header */}
        <CollapsibleSection title="Section Header" icon={<HiCommandLine className="w-5 h-5" />} defaultOpen>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            The heading that appears above your services list.
          </p>
          <FieldInput label="Small Heading" helperText="Tiny text above the main heading" value={services.eyebrow || ''} onChange={(v) => updateSection('services', { eyebrow: v })} placeholder="e.g., What I Offer" />
          <FieldInput label="Main Heading" helperText="The large title of this section" value={services.heading || ''} onChange={(v) => updateSection('services', { heading: v })} placeholder="e.g., Services" />
          <ImageManager
            label="Banner Image"
            description="Optional banner image for the services section"
            helperText="A wide image that spans the top of the services area"
            sectionIndicator="Services Banner"
            value={services.bannerImage || { url: '', alt: '' }}
            onChange={(img) => updateSection('services', { bannerImage: img })}
            aspect="aspect-[16/9]"
            folder="services/banner"
          />
        </CollapsibleSection>

        {/* Service Items */}
        <CollapsibleSection title={`Your Services (${(services.services || []).length})`} icon={<HiCommandLine className="w-5 h-5" />} defaultOpen>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Each service appears as a full-width section with an image and description.
          </p>
          <div className="space-y-6">
            {(services.services || []).map((svc: any, i: number) => (
              <div key={i} className="p-5 bg-ivory/50 border border-cream/40 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Service #{i + 1}</span>
                  <button type="button" onClick={() => removeService(i)} className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldInput label="Service Name" helperText="The name of this service" value={svc.title || ''} onChange={(v) => handleServiceChange(i, 'title', v)} placeholder="e.g., Newborn Photography" />
                  <FieldInput label="Number Label" helperText="The number shown (e.g., 01, 02, 03)" value={svc.subtitle || ''} onChange={(v) => handleServiceChange(i, 'subtitle', v)} placeholder="e.g., 01" />
                </div>
                <FieldTextarea label="Service Description" helperText="A brief description of this service" value={svc.description || ''} onChange={(v) => handleServiceChange(i, 'description', v)} rows={3} placeholder="Describe this service..." />
                <div>
                  <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Background Style</label>
                  <p className="font-sans text-[10px] text-warm-gray/40 mb-2 italic">Choose a color style if no image is uploaded</p>
                  <div className="flex flex-wrap gap-2">
                    {gradients.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => handleServiceChange(i, 'gradient', g.value)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${svc.gradient === g.value ? 'border-magenta bg-magenta/5' : 'border-cream/60 hover:border-cream'}`}
                      >
                        <div className={`w-4 h-4 rounded bg-gradient-to-br ${g.value}`} />
                        <span className="font-sans text-[10px] text-warm-gray/60">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <ImageManager
                  label="Service Image"
                  description={`Photo for ${svc.title || 'this service'}`}
                  helperText="Upload a stunning image that represents this service"
                  sectionIndicator={`Services - ${svc.title || 'Item'}`}
                  value={svc.image || { url: '', alt: '' }}
                  onChange={(img) => handleServiceImageChange(i, img)}
                  aspect="aspect-[16/9]"
                  folder={`services/${svc.title?.toLowerCase().replace(/\s+/g, '-') || 'item'}`}
                />
              </div>
            ))}
            <button type="button" onClick={addService} className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-magenta font-sans text-xs hover:bg-magenta/5 rounded transition-colors">
              <HiPlus className="w-4 h-4" /> Add Another Service
            </button>
          </div>
        </CollapsibleSection>

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

function CollapsibleSection({ title, icon, defaultOpen = false, children }: { title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-cream/50 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-cream/20 transition-colors">
        {icon && <span className="text-magenta/50">{icon}</span>}
        <h2 className="font-serif text-lg text-rich-black flex-1 text-left">{title}</h2>
        <span className={`w-4 h-4 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <span className="w-3 h-px bg-warm-gray/40 absolute" />
          <span className="w-px h-3 bg-warm-gray/40 absolute" />
        </span>
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function FieldInput({ label, helperText, value, onChange, placeholder }: { label: string; helperText?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">{label}</label>
      {helperText && <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">{helperText}</p>}
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors" />
    </div>
  );
}

function FieldTextarea({ label, helperText, value, onChange, rows = 4, placeholder }: { label: string; helperText?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">{label}</label>
      {helperText && <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">{helperText}</p>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none" />
    </div>
  );
}
