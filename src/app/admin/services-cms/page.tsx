'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiPlus, HiTrash, HiCommandLine, HiPhoto, HiExclamationTriangle, HiCheckCircle, HiClipboardDocument, HiArrowPath } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

interface ServiceItem {
  _id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  gradient?: string;
  heroImage?: string;
  image?: string | { url?: string; alt?: string };
}

export default function AdminServicesPage() {
  const { config, loading, saving, error, dirty, lastSavedAt, updateSection, saveConfig, resetConfig, fetchConfig } = useCMS();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
  const servicesList: ServiceItem[] = services.services || [];

  const handleServiceChange = (index: number, field: keyof ServiceItem, value: string) => {
    const svcs = [...servicesList];
    svcs[index] = { ...svcs[index], [field]: value };
    updateSection('services', { services: svcs });
  };

  const handleServiceImageChange = (index: number, image: { url: string; alt?: string }) => {
    const svcs = [...servicesList];
    svcs[index] = { ...svcs[index], image };
    setImageErrors(prev => ({ ...prev, [index]: false }));
    updateSection('services', { services: svcs });
  };

  const addService = () => {
    const svcs: ServiceItem[] = [
      ...servicesList,
      {
        title: 'New Photography Service',
        subtitle: '0' + (servicesList.length + 1),
        description: 'Service description here...',
        gradient: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]',
        image: { url: '', alt: '' }
      }
    ];
    updateSection('services', { services: svcs });
  };

  const removeService = (index: number) => {
    const svcs = servicesList.filter((_: ServiceItem, i: number) => i !== index);
    updateSection('services', { services: svcs });
  };


  const copyImageUrl = (url: string, index: number) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIndex(index);
      toast.success('Image URL copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const gradients = [
    { value: 'from-[#1A1110] via-[#2C1810] to-[#1A1A1A]', label: 'Dark Warm' },
    { value: 'from-[#2C1810] via-[#3D2C25] to-[#1A1110]', label: 'Amber' },
    { value: 'from-[#1A1A1A] via-[#2C1810] to-[#3D2C25]', label: 'Charcoal' },
    { value: 'from-[#3D2C25] via-[#2C1810] to-[#2C2C2C]', label: 'Deep Brown' },
    { value: 'from-[#2C2C2C] via-[#1A1A1A] to-rich-black', label: 'Midnight' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-20">
      <AdminPageHeader
        title="Services & Packages"
        description="Manage your service portfolio, thumbnails, and descriptions"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/#services"
      />

      <div className="space-y-6">
        {/* Section Header Configuration */}
        <CollapsibleSection title="Section Header & Banner" icon={<HiCommandLine className="w-5 h-5" />} defaultOpen={false}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            The heading and banner image displayed above the services grid on the public website.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Small Eyebrow Heading" helperText="Tiny eyebrow text above main heading" value={services.eyebrow || ''} onChange={(v) => updateSection('services', { eyebrow: v })} placeholder="e.g., BESPOKE COLLECTIONS" />
            <FieldInput label="Main Heading" helperText="Large title for the services section" value={services.heading || ''} onChange={(v) => updateSection('services', { heading: v })} placeholder="e.g., Bespoke Photography Services" />
          </div>
          <ImageManager
            label="Services Section Banner"
            description="Optional wide banner image for the services section"
            sectionIndicator="Banner"
            value={services.bannerImage || { url: '', alt: '' }}
            onChange={(img) => updateSection('services', { bannerImage: img })}
            aspect="aspect-[21/9]"
            folder="services/banner"
          />
        </CollapsibleSection>

        {/* Services Grid Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-cream/50 shadow-xs">
          <div>
            <h2 className="font-serif text-xl text-rich-black">
              Managed Services ({servicesList.length})
            </h2>
            <p className="font-sans text-xs text-warm-gray/60 mt-0.5">
              Horizontal card grid. Changes made here persist to database & update the live website thumbnail.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-sans text-xs rounded border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-spin" />
                Saving...
              </span>
            ) : dirty ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-sans text-xs rounded border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-sans text-xs rounded border border-emerald-200">
                <HiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Saved ✓
              </span>
            )}

            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rich-black text-white font-sans text-xs uppercase tracking-wider rounded hover:bg-charcoal transition-colors min-h-[40px]"
            >
              <HiPlus className="w-4 h-4" /> Add Service
            </button>
          </div>
        </div>

        {/* Horizontal / Grid Cards (2-3 per row on desktop, 2 on tablet, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((svc: ServiceItem, i: number) => {
            const currentImgUrl = typeof svc.image === 'string' ? svc.image : (svc.image?.url || svc.heroImage || '');
            const hasImg = Boolean(currentImgUrl && currentImgUrl.trim() !== '');
            const isFailed = imageErrors[i];

            return (
              <div
                key={i}
                className="bg-white border border-cream/80 rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-5 py-3.5 bg-ivory/60 border-b border-cream/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-magenta bg-magenta/10 px-2 py-0.5 rounded">
                      0{i + 1}
                    </span>
                    <h3 className="font-serif text-base text-rich-black truncate max-w-[180px]">
                      {svc.title || 'Untitled Service'}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    title="Remove Service"
                    className="p-1.5 text-warm-gray/40 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Image Status & Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans font-medium uppercase tracking-wider text-warm-gray/70 text-[11px]">
                        Service Thumbnail
                      </span>

                      {/* Image Status Indicator */}
                      {isFailed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 font-sans text-[10px] font-semibold rounded">
                          <HiExclamationTriangle className="w-3 h-3 text-red-600" />
                          FAILED TO LOAD
                        </span>
                      ) : hasImg ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-sans text-[10px] font-medium rounded">
                          <HiCheckCircle className="w-3 h-3 text-emerald-600" />
                          Image Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 font-sans text-[10px] font-medium rounded">
                          No Image
                        </span>
                      )}
                    </div>

                    {/* Image Preview Box */}
                    <div className="relative aspect-[16/10] bg-ivory rounded-lg border border-cream/80 overflow-hidden group flex items-center justify-center">
                      {hasImg && !isFailed ? (
                        <>
                          <img
                            src={currentImgUrl}
                            alt={svc.title || 'Service Image'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => setImageErrors(prev => ({ ...prev, [i]: true }))}
                          />
                          <div className="absolute inset-0 bg-rich-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => copyImageUrl(currentImgUrl, i)}
                              className="p-2 bg-white/90 hover:bg-white text-rich-black text-xs rounded font-sans font-medium flex items-center gap-1 shadow-xs"
                            >
                              <HiClipboardDocument className="w-3.5 h-3.5" />
                              {copiedIndex === i ? 'Copied!' : 'Copy URL'}
                            </button>
                          </div>
                        </>
                      ) : isFailed ? (
                        <div className="text-center p-4 bg-red-50/80 w-full h-full flex flex-col items-center justify-center">
                          <HiExclamationTriangle className="w-8 h-8 text-red-500 mb-1" />
                          <p className="font-sans font-bold text-xs text-red-700 uppercase tracking-wider">
                            IMAGE FAILED TO LOAD
                          </p>
                          <p className="font-sans text-[10px] text-red-600/80 mt-1 max-w-[200px] truncate">
                            {currentImgUrl}
                          </p>
                          <button
                            type="button"
                            onClick={() => setImageErrors(prev => ({ ...prev, [i]: false }))}
                            className="mt-2 px-2.5 py-1 bg-red-600 text-white font-sans text-[10px] uppercase tracking-wider rounded hover:bg-red-700 transition-colors inline-flex items-center gap-1"
                          >
                            <HiArrowPath className="w-3 h-3" /> Retry Load
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-4 text-warm-gray/40">
                          <HiPhoto className="w-10 h-10 mx-auto mb-1 text-warm-gray/30" />
                          <p className="font-sans text-xs">No image uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Integrated Image Control Manager */}
                    <ImageManager
                      label=""
                      sectionIndicator={`Service 0${i + 1}`}
                      value={{
                        url: currentImgUrl,
                        alt: typeof svc.image === 'object' ? svc.image.alt || svc.title || '' : svc.title || '',
                      }}
                      onChange={(img) => handleServiceImageChange(i, img)}
                      aspect="aspect-[16/10]"
                      folder={`services/${(svc.title || 'service').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    />
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3 pt-2 border-t border-cream/50">
                    <FieldInput
                      label="Service Title"
                      value={svc.title || ''}
                      onChange={(v) => handleServiceChange(i, 'title', v)}
                      placeholder="e.g., Newborn Photography"
                    />

                    <FieldInput
                      label="Number / Subtitle Label"
                      value={svc.subtitle || ''}
                      onChange={(v) => handleServiceChange(i, 'subtitle', v)}
                      placeholder="e.g., 01 or Gentle First Slumbers"
                    />

                    <FieldTextarea
                      label="Service Description"
                      value={svc.description || ''}
                      onChange={(v) => handleServiceChange(i, 'description', v)}
                      rows={2}
                      placeholder="Brief overview of this service..."
                    />

                    {/* Gradient selection */}
                    <div>
                      <label className="block font-sans text-[10px] font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
                        Fallback Gradient
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {gradients.map((g) => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => handleServiceChange(i, 'gradient', g.value)}
                            title={g.label}
                            className={`p-1 rounded border transition-colors ${svc.gradient === g.value ? 'border-magenta bg-magenta/10 ring-1 ring-magenta' : 'border-cream/80 hover:border-cream'}`}
                          >
                            <div className={`w-4 h-4 rounded-xs bg-gradient-to-br ${g.value}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-ivory/40 border-t border-cream/50 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-warm-gray/50">
                    Slug: /gallery?category={(svc.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                  </span>

                  <button
                    type="button"
                    onClick={() => saveConfig()}
                    disabled={saving}
                    className="px-3 py-1 bg-rich-black text-white font-sans text-[11px] uppercase tracking-wider rounded hover:bg-charcoal transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Service'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {servicesList.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-cream/60 p-8">
            <HiCommandLine className="w-12 h-12 text-warm-gray/30 mx-auto mb-3" />
            <p className="font-serif text-lg text-rich-black">No Services Found</p>
            <p className="font-sans text-xs text-warm-gray/60 mt-1 max-w-sm mx-auto">
              Click the button below to add your first photography service.
            </p>
            <button
              type="button"
              onClick={addService}
              className="mt-4 px-4 py-2 bg-rich-black text-white font-sans text-xs uppercase tracking-wider rounded hover:bg-charcoal transition-colors"
            >
              Add First Service
            </button>
          </div>
        )}
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
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-2 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40 transition-colors" />
    </div>
  );
}

function FieldTextarea({ label, helperText, value, onChange, rows = 3, placeholder }: { label: string; helperText?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">{label}</label>
      {helperText && <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">{helperText}</p>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-3.5 py-2 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none" />
    </div>
  );
}

