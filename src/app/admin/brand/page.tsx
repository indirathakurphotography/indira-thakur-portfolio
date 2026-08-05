'use client';

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';
import { invalidateSiteConfigCache } from '@/hooks/useSiteConfig';

interface BrandData {
  siteName: string;
  tagline: string;
  logo: { url: string; alt: string };
  preloaderLogo: { url: string; alt: string };
  favicon: { url: string; alt: string };
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  instagramUrl: string;
  facebookUrl: string;
  copyright: string;
  defaultOgImage: { url: string; alt: string };
}

const DEFAULTS: BrandData = {
  siteName: 'Indira Thakur Photography',
  tagline: "Capturing Life's Precious Moments",
  logo: { url: '', alt: '' },
  preloaderLogo: { url: '', alt: '' },
  favicon: { url: '', alt: '' },
  contactEmail: 'hello@indirathakur.com',
  contactPhone: '+91 99999 99999',
  contactLocation: 'Bangalore, India',
  instagramUrl: '',
  facebookUrl: '',
  copyright: '© 2025 Indira Thakur Photography. All rights reserved.',
  defaultOgImage: { url: '', alt: '' },
};

export default function AdminBrandPage() {
  const [brand, setBrand] = useState<BrandData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch('/api/brand')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const { _id, __v, createdAt, updatedAt, ...rest } = data;
          setBrand(prev => ({ ...prev, ...rest }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) => {
    setBrand(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/brand', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      const { _id, __v, createdAt, updatedAt, ...rest } = saved;
      invalidateSiteConfigCache();
      localStorage.setItem('brand-updated', Date.now().toString());
      setBrand(prev => ({ ...prev, ...rest }));
      setDirty(false);
      toast.success('Changes Saved Successfully');
    } catch {
      toast.error('Failed to Save Changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    try {
      const res = await fetch('/api/brand');
      if (res.ok) {
        const data = await res.json();
        const { _id, __v, createdAt, updatedAt, ...rest } = data;
        setBrand(prev => ({ ...prev, ...rest }));
      } else {
        setBrand(DEFAULTS);
      }
    } catch {
      setBrand(DEFAULTS);
    }
    setDirty(false);
    toast.info('Changes discarded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-sm text-warm-gray/50">Loading brand settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Brand Settings"
        description="Manage site identity, contact info, and social links"
        dirty={dirty}
        lastSavedAt={null}
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        <Section title="Site Identity" defaultOpen>
          <FieldInput label="Site Name" value={brand.siteName} onChange={v => update('siteName', v)} placeholder="Indira Thakur Photography" />
          <FieldInput label="Tagline" value={brand.tagline} onChange={v => update('tagline', v)} placeholder="Capturing Life's Precious Moments" />
          <FieldInput label="Copyright" value={brand.copyright} onChange={v => update('copyright', v)} placeholder="© 2025 ..." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <ImageManager
              label="Brand Logo"
              description="Primary official logo displayed in Navbar, Footer, Favicon, and social previews"
              value={brand.logo}
              onChange={img => update('logo', img)}
              aspect="aspect-[3/1]"
              folder="brand"
              sectionIndicator="Brand"
            />
            <ImageManager
              label="Loading Screen Logo"
              description="Dedicated logo displayed on the intro loading screen (falls back to Brand Logo if empty)"
              value={brand.preloaderLogo || { url: '', alt: '' }}
              onChange={img => update('preloaderLogo', img)}
              aspect="aspect-square"
              folder="brand"
              sectionIndicator="Brand"
            />
            <ImageManager
              label="Favicon Icon"
              description="Small icon shown in browser tabs and bookmarks"
              value={brand.favicon}
              onChange={img => update('favicon', img)}
              aspect="aspect-square"
              folder="brand"
              sectionIndicator="Brand"
            />
          </div>
        </Section>

        <Section title="Contact Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput label="Email" value={brand.contactEmail} onChange={v => update('contactEmail', v)} placeholder="hello@example.com" />
            <FieldInput label="Phone" value={brand.contactPhone} onChange={v => update('contactPhone', v)} placeholder="+91 ..." />
          </div>
          <FieldInput label="Location" value={brand.contactLocation} onChange={v => update('contactLocation', v)} placeholder="Bangalore, India" />
        </Section>

        <Section title="Social Links">
          <FieldInput label="Instagram URL" value={brand.instagramUrl} onChange={v => update('instagramUrl', v)} placeholder="https://instagram.com/..." />
          <FieldInput label="Facebook URL" value={brand.facebookUrl} onChange={v => update('facebookUrl', v)} placeholder="https://facebook.com/..." />
        </Section>

        <Section title="Default OG Image">
          <ImageManager
            label="Default OG Image"
            description="Fallback image for social media shares"
            value={brand.defaultOgImage}
            onChange={img => update('defaultOgImage', img)}
            aspect="aspect-[1200/630]"
            folder="brand"
            sectionIndicator="Brand"
            helperText="1200x630 pixels recommended for social sharing"
          />
        </Section>

      </div>
      <StickySaveBar
        dirty={dirty}
        saving={saving}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-cream/50 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream/20 transition-colors">
        <h2 className="font-serif text-lg text-rich-black">{title}</h2>
        <span className={`w-4 h-4 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <span className="w-3 h-px bg-warm-gray/40 absolute" />
          <span className="w-px h-3 bg-warm-gray/40 absolute" />
        </span>
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors"
      />
    </div>
  );
}
