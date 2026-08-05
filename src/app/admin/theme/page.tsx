'use client';

import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';
import { invalidateThemeSettingsCache } from '@/hooks/useThemeSettings';

const DEFAULTS = {
  primaryColor: '#C39E96',
  secondaryColor: '#A88179',
  accentColor: '#E2C3BC',
  backgroundColor: '#FAF6F3',
  surfaceColor: '#FFFFFF',
  textColor: '#2B2625',
  mutedTextColor: '#7C706D',
  cardBackground: '#FFFFFF',
  cardBorder: '#F4ECE8',
  cardRadius: '0px',
  buttonRadius: '0px',
  buttonStyle: 'filled' as const,
  navBackground: '#FAF6F3',
  navTextColor: '#2B2625',
  footerBackground: '#2B2625',
  footerTextColor: '#FAF6F3',
  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
  shadowIntensity: 'light' as 'none' | 'light' | 'medium' | 'heavy',
  glassEffect: false,
};

const GOOGLE_FONTS = ['Playfair Display', 'Inter', 'DM Mono', 'Cormorant', 'Libre Baskerville'];

export default function AdminThemePage() {
  const [theme, setTheme] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const { _id, __v, createdAt, updatedAt, ...rest } = data;
          setTheme(prev => ({ ...prev, ...rest }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchTheme = async () => {
    try {
      const res = await fetch('/api/theme');
      if (res.ok) {
        const data = await res.json();
        const { _id, __v, createdAt, updatedAt, ...rest } = data;
        setTheme(prev => ({ ...prev, ...rest }));
      }
    } catch {}
  };

  const update = (key: string, value: any) => {
    setTheme(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });
      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      const { _id, __v, createdAt, updatedAt, ...rest } = saved;
      setTheme(prev => ({ ...prev, ...rest }));
      setDirty(false);
      
      // Invalidate client-side theme caches
      invalidateThemeSettingsCache();
      // Notify other tabs and iframes (e.g. preview)
      localStorage.setItem('theme-updated', Date.now().toString());
      
      toast.success('Changes Saved Successfully');
    } catch {
      toast.error('Failed to Save Changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme(DEFAULTS);
    setDirty(true);
  };

  const handleDiscard = async () => {
    await fetchTheme();
    setDirty(false);
    toast.info('Changes discarded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-sm text-warm-gray/50">Loading theme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Theme Settings"
        description="Customize colors, typography, and visual effects"
        dirty={dirty}
        lastSavedAt={null}
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Colors */}
            <Section title="Colors" defaultOpen>
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Primary" value={theme.primaryColor} onChange={v => update('primaryColor', v)} />
                <ColorField label="Secondary" value={theme.secondaryColor} onChange={v => update('secondaryColor', v)} />
                <ColorField label="Accent" value={theme.accentColor} onChange={v => update('accentColor', v)} />
                <ColorField label="Background" value={theme.backgroundColor} onChange={v => update('backgroundColor', v)} />
                <ColorField label="Surface" value={theme.surfaceColor} onChange={v => update('surfaceColor', v)} />
                <ColorField label="Text" value={theme.textColor} onChange={v => update('textColor', v)} />
                <ColorField label="Muted Text" value={theme.mutedTextColor} onChange={v => update('mutedTextColor', v)} />
              </div>
            </Section>

            {/* Card */}
            <Section title="Card">
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Background" value={theme.cardBackground} onChange={v => update('cardBackground', v)} />
                <ColorField label="Border" value={theme.cardBorder} onChange={v => update('cardBorder', v)} />
              </div>
              <div className="mt-4">
                <TextInput label="Border Radius" value={theme.cardRadius} onChange={v => update('cardRadius', v)} placeholder="0px" />
              </div>
            </Section>

            {/* Buttons */}
            <Section title="Buttons">
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Border Radius" value={theme.buttonRadius} onChange={v => update('buttonRadius', v)} placeholder="0px" />
                <div>
                  <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Button Style</label>
                  <select
                    value={theme.buttonStyle}
                    onChange={e => update('buttonStyle', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors"
                  >
                    <option value="filled">Filled</option>
                    <option value="outlined">Outlined</option>
                    <option value="soft">Soft</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Navigation */}
            <Section title="Navigation">
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Background" value={theme.navBackground} onChange={v => update('navBackground', v)} />
                <ColorField label="Text Color" value={theme.navTextColor} onChange={v => update('navTextColor', v)} />
              </div>
            </Section>

            {/* Footer */}
            <Section title="Footer">
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Background" value={theme.footerBackground} onChange={v => update('footerBackground', v)} />
                <ColorField label="Text Color" value={theme.footerTextColor} onChange={v => update('footerTextColor', v)} />
              </div>
            </Section>

            {/* Typography */}
            <Section title="Typography">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Heading Font</label>
                  <select
                    value={theme.headingFont}
                    onChange={e => update('headingFont', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors"
                  >
                    {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Body Font</label>
                  <select
                    value={theme.bodyFont}
                    onChange={e => update('bodyFont', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors"
                  >
                    {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            {/* Effects */}
            <Section title="Effects">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">Shadow Intensity</label>
                  <select
                    value={theme.shadowIntensity}
                    onChange={e => update('shadowIntensity', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors"
                  >
                    <option value="none">None</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme.glassEffect}
                      onChange={e => update('glassEffect', e.target.checked)}
                      className="w-4 h-4 text-magenta bg-white border-cream/60 rounded focus:ring-magenta/40"
                    />
                    <span className="font-sans text-sm text-warm-gray/70">Glass effect</span>
                  </label>
                </div>
              </div>
            </Section>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-0">
              <p className="font-mono text-[9px] text-warm-gray/30 uppercase tracking-[0.2em] mb-3">Live Preview</p>
              <div
                className="rounded-lg overflow-hidden border border-cream/50"
                style={{ background: theme.backgroundColor }}
              >
                {/* Mini Nav */}
                <div
                  className="px-4 py-3 flex items-center justify-between border-b"
                  style={{ background: theme.navBackground, borderColor: theme.cardBorder, color: theme.navTextColor }}
                >
                  <span style={{ fontFamily: theme.headingFont }} className="font-serif text-sm font-semibold">Logo</span>
                  <div className="flex gap-3 text-xs" style={{ fontFamily: theme.bodyFont }}>
                    <span>Home</span>
                    <span>About</span>
                    <span>Gallery</span>
                  </div>
                </div>

                {/* Mini Hero Card */}
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: theme.mutedTextColor, fontFamily: theme.bodyFont }}>
                    Photography
                  </p>
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: theme.textColor, fontFamily: theme.headingFont }}
                  >
                    Every Frame Tells a Story
                  </h3>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: theme.mutedTextColor, fontFamily: theme.bodyFont }}>
                    Capturing life's most precious moments with warmth and artistry.
                  </p>

                  {/* Preview Card */}
                  <div
                    className="p-4 mb-4 border"
                    style={{
                      background: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.cardRadius,
                      boxShadow: theme.shadowIntensity === 'none' ? 'none'
                        : theme.shadowIntensity === 'light' ? '0 1px 3px rgba(0,0,0,0.08)'
                        : theme.shadowIntensity === 'medium' ? '0 4px 12px rgba(0,0,0,0.12)'
                        : '0 8px 24px rgba(0,0,0,0.18)',
                    }}
                  >
                    <div className="w-full h-16 rounded mb-2" style={{ background: theme.accentColor + '20' }} />
                    <p className="text-[10px] font-medium" style={{ color: theme.textColor, fontFamily: theme.bodyFont }}>Session Title</p>
                    <p className="text-[9px]" style={{ color: theme.mutedTextColor, fontFamily: theme.bodyFont }}>Description text here</p>
                  </div>

                  {/* Preview Button */}
                  <button
                    className="px-4 py-2 text-[10px] uppercase tracking-widest font-medium w-full"
                    style={{
                      borderRadius: theme.buttonRadius,
                      fontFamily: theme.bodyFont,
                      ...(theme.buttonStyle === 'filled' ? {
                        background: theme.primaryColor,
                        color: '#FFFFFF',
                      } : theme.buttonStyle === 'outlined' ? {
                        background: 'transparent',
                        border: `1px solid ${theme.primaryColor}`,
                        color: theme.primaryColor,
                      } : {
                        background: theme.primaryColor + '15',
                        color: theme.primaryColor,
                      }),
                    }}
                  >
                    Book Now
                  </button>
                </div>

                {/* Mini Footer */}
                <div
                  className="px-4 py-3 text-center text-[10px]"
                  style={{ background: theme.footerBackground, color: theme.footerTextColor, fontFamily: theme.bodyFont }}
                >
                  Footer Content
                </div>
              </div>
            </div>
          </div>
        </div>

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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-cream/60 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-cream/60 text-rich-black font-mono text-xs rounded focus:outline-none focus:border-magenta/40 transition-colors"
        />
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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
