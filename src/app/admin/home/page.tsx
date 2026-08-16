'use client';

import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { useState } from 'react';
import { HiHome, HiPhoto, HiSparkles, HiClock, HiPlay, HiStop } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminHomePage() {
  const { config, loading, saving, error, dirty, lastSavedAt, updateSection, saveConfig, resetConfig, clearMessages, fetchConfig } = useCMS();
  const [newCategory, setNewCategory] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-sm text-warm-gray/50">Loading your Home page...</p>
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

  const home = config.home || {};

  const addCategory = () => {
    if (!newCategory.trim()) return;
    const cats = [...(home.categories || []), newCategory.trim()];
    updateSection('home', { categories: cats });
    setNewCategory('');
  };

  const removeCategory = (index: number) => {
    const cats = (home.categories || []).filter((_: any, i: number) => i !== index);
    updateSection('home', { categories: cats });
  };

  const addHeroImage = () => {
    const imgs = [...(home.heroImages || []), { url: '', alt: '' }];
    updateSection('home', { heroImages: imgs });
  };

  const removeHeroImage = (index: number) => {
    const imgs = (home.heroImages || []).filter((_: any, i: number) => i !== index);
    updateSection('home', { heroImages: imgs });
  };

  const updateHeroImage = (index: number, img: { url: string; alt: string }) => {
    const imgs = [...(home.heroImages || [])];
    imgs[index] = img;
    updateSection('home', { heroImages: imgs });
  };

  const moveHeroImage = (index: number, direction: 'up' | 'down') => {
    const imgs = [...(home.heroImages || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= imgs.length) return;
    [imgs[index], imgs[target]] = [imgs[target], imgs[index]];
    updateSection('home', { heroImages: imgs });
  };

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Home Page"
        description="Customize the first impression visitors see when they land on your website"
        error={error}
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        onClearMessages={clearMessages}
        previewHref="/"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Hero Text Content */}
        <Section title="Hero Text" icon={<HiHome className="w-5 h-5" />} defaultOpen>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            This is the first thing visitors see. Make it count!
          </p>
          <FieldInput
            label="Small Label"
            helperText="Tiny text above the main heading (optional)"
            value={home.tagline || ''}
            onChange={(v) => updateSection('home', { tagline: v })}
            placeholder="e.g., Photography"
          />
          <FieldInput
            label="Main Heading"
            helperText="The large title on your homepage"
            value={home.heading || ''}
            onChange={(v) => updateSection('home', { heading: v })}
            placeholder="e.g., Every Frame"
          />
          <FieldInput
            label="Highlighted Text"
            helperText="The italic text that appears below the main heading"
            value={home.headingItalic || ''}
            onChange={(v) => updateSection('home', { headingItalic: v })}
            placeholder="e.g., Tells a Story"
          />

          <div>
            <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
              Category Tags
            </label>
            <p className="font-sans text-[10px] text-warm-gray/40 mb-2 italic">
              These appear in the hero section below the heading
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {(home.categories || []).map((cat: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream/50 border border-cream/60 rounded-full font-sans text-xs text-rich-black">
                  {cat}
                  <button type="button" onClick={() => removeCategory(i)} className="text-warm-gray/40 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Add a category..." className="flex-1 px-3 py-2 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40" onKeyDown={(e) => e.key === 'Enter' && addCategory()} />
              <button type="button" onClick={addCategory} className="px-4 py-2 bg-rich-black text-white text-xs uppercase tracking-wider rounded hover:bg-charcoal transition-colors">Add</button>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Button Settings" icon={<HiSparkles className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Control the call-to-action buttons on your homepage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput
              label="Primary Button Text"
              helperText="The main button visitors see"
              value={home.ctaText || ''}
              onChange={(v) => updateSection('home', { ctaText: v })}
              placeholder="e.g., Book Now"
            />
            <FieldInput
              label="Primary Button Link"
              helperText="Where the button goes (e.g., /contact)"
              value={home.ctaLink || ''}
              onChange={(v) => updateSection('home', { ctaLink: v })}
              placeholder="e.g., /contact"
            />
            <FieldInput
              label="Secondary Button Text"
              helperText="The text link next to the primary button"
              value={home.secondaryCtaText || ''}
              onChange={(v) => updateSection('home', { secondaryCtaText: v })}
              placeholder="e.g., Portfolio"
            />
            <FieldInput
              label="Secondary Button Link"
              helperText="Where the text link goes"
              value={home.secondaryCtaLink || ''}
              onChange={(v) => updateSection('home', { secondaryCtaLink: v })}
              placeholder="e.g., /gallery"
            />
          </div>
        </Section>

        {/* Hero Slideshow Images */}
        <Section title="Hero Slideshow Images" icon={<HiPhoto className="w-5 h-5" />} defaultOpen>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Upload multiple images for the hero slideshow. Each image can have its own duration and animation style.
          </p>

          {(home.heroImages || []).length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-cream/60 rounded-lg mb-4">
              <HiPhoto className="w-10 h-10 text-warm-gray/20 mx-auto mb-3" />
              <p className="font-sans text-sm text-warm-gray/40 mb-1">No slideshow images yet</p>
              <p className="font-sans text-[10px] text-warm-gray/30 mb-4">Add images to create a cinematic hero experience</p>
              <button
                type="button"
                onClick={addHeroImage}
                className="px-6 py-2.5 bg-magenta text-white text-xs uppercase tracking-wider rounded hover:bg-raspberry transition-colors"
              >
                Add First Image
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {(home.heroImages || []).map((img: any, i: number) => (
                  <div key={i} className="bg-white border border-cream/50 rounded-lg overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-ivory rounded text-warm-gray/40 font-mono text-xs">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <button
                          type="button"
                          onClick={() => moveHeroImage(i, 'up')}
                          disabled={i === 0}
                          className="px-1 py-0.5 text-[10px] text-warm-gray/50 hover:text-rich-black disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHeroImage(i, 'down')}
                          disabled={i === (home.heroImages || []).length - 1}
                          className="px-1 py-0.5 text-[10px] text-warm-gray/50 hover:text-rich-black disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <ImageManager
                          label={`Slide ${i + 1}`}
                          value={img}
                          onChange={(newImg) => updateHeroImage(i, { ...img, ...newImg })}
                          aspect="aspect-[16/9]"
                          folder="home/hero/slideshow"
                          imageType="hero"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeHeroImage(i)}
                        className="flex-shrink-0 px-2 py-1 text-[10px] text-red-400 hover:text-red-600 font-sans"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Per-image settings */}
                    <div className="px-4 pb-4 pt-2 border-t border-cream/30">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-sans text-[10px] font-medium tracking-wider uppercase text-warm-gray/50 mb-1">
                            Alt Text
                          </label>
                          <input
                            type="text"
                            value={img.alt || ''}
                            onChange={(e) => updateHeroImage(i, { ...img, alt: e.target.value })}
                            placeholder="Describe this image"
                            className="w-full px-3 py-1.5 bg-ivory/50 border border-cream/50 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
                          />
                        </div>
                        <div>
                          <label className="block font-sans text-[10px] font-medium tracking-wider uppercase text-warm-gray/50 mb-1">
                            Duration
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={3}
                              max={15}
                              step={1}
                              value={img.duration || 8}
                              onChange={(e) => updateHeroImage(i, { ...img, duration: Number(e.target.value) })}
                              className="flex-1 accent-magenta"
                            />
                            <span className="font-mono text-[10px] text-warm-gray/50 w-6 text-right">{img.duration || 8}s</span>
                          </div>
                        </div>
                        <div>
                          <label className="block font-sans text-[10px] font-medium tracking-wider uppercase text-warm-gray/50 mb-1">
                            Animation
                          </label>
                          <select
                            value={img.animation || 'auto'}
                            onChange={(e) => updateHeroImage(i, { ...img, animation: e.target.value })}
                            className="w-full px-3 py-1.5 bg-ivory/50 border border-cream/50 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
                          >
                            <option value="auto">Auto (cyclic)</option>
                            <option value="zoom-in">Zoom In</option>
                            <option value="zoom-out">Zoom Out</option>
                            <option value="pan-left">Pan Left</option>
                            <option value="pan-right">Pan Right</option>
                            <option value="drift-up">Drift Up</option>
                            <option value="drift-down">Drift Down</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addHeroImage}
                className="w-full py-3 border-2 border-dashed border-cream/60 rounded-lg font-sans text-xs text-warm-gray/40 hover:text-magenta hover:border-magenta/30 transition-colors uppercase tracking-wider"
              >
                + Add Another Image
              </button>
            </>
          )}
        </Section>

        {/* Hero Preview */}
        <Section title="Hero Preview" icon={<HiPhoto className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Preview how your hero looks on desktop and mobile. Only photography images from this section are used — never the brand logo.
          </p>
          <div className="space-y-4">
            {/* Desktop Preview */}
            <div>
              <p className="font-sans text-[10px] text-warm-gray/50 uppercase tracking-wider mb-2">Desktop</p>
              <div className="relative w-full aspect-[16/9] bg-rich-black rounded-lg overflow-hidden border border-cream/50">
                {(home.heroImages?.[0]?.url || home.images?.heroMain?.url) ? (
                  <img
                    src={home.heroImages?.[0]?.url || home.images?.heroMain?.url}
                    alt="Hero desktop preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: home.backgroundGradient || 'linear-gradient(135deg, #1A1110 0%, #2C1810 40%, #111111 100%)' }}>
                    <p className="font-sans text-xs text-white/30">No image set — gradient fallback</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-rich-black/70 via-rich-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="font-serif text-xl text-white">{home.heading || 'Every Frame'}</p>
                  <p className="font-serif text-sm text-white/40 italic">{home.headingItalic || 'Tells a Story'}</p>
                </div>
              </div>
            </div>
            {/* Mobile Preview */}
            <div>
              <p className="font-sans text-[10px] text-warm-gray/50 uppercase tracking-wider mb-2">Mobile</p>
              <div className="relative w-48 aspect-[9/16] bg-rich-black rounded-lg overflow-hidden border border-cream/50 mx-auto">
                {(home.heroImages?.[0]?.url || home.images?.heroMain?.url) ? (
                  <img
                    src={home.heroImages?.[0]?.url || home.images?.heroMain?.url}
                    alt="Hero mobile preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: home.backgroundGradient || 'linear-gradient(135deg, #1A1110 0%, #2C1810 40%, #111111 100%)' }}>
                    <p className="font-sans text-[9px] text-white/30 text-center px-2">No image set</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-rich-black/70 via-rich-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-serif text-[11px] text-white leading-tight">{home.heading || 'Every Frame'}</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Slideshow Settings */}
        <Section title="Slideshow Settings" icon={<HiClock className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Fine-tune how the hero slideshow behaves.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
                Slide Duration (seconds)
              </label>
              <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">How long each image is shown</p>
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={home.slideshowDuration || 8}
                onChange={(e) => updateSection('home', { slideshowDuration: Number(e.target.value) })}
                className="w-full accent-magenta"
              />
              <p className="font-mono text-[10px] text-warm-gray/40 mt-1">{home.slideshowDuration || 8}s</p>
            </div>
            <div>
              <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
                Transition Speed (seconds)
              </label>
              <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">How fast images crossfade</p>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={home.transitionDuration || 2}
                onChange={(e) => updateSection('home', { transitionDuration: Number(e.target.value) })}
                className="w-full accent-magenta"
              />
              <p className="font-mono text-[10px] text-warm-gray/40 mt-1">{home.transitionDuration || 2}s</p>
            </div>
            <div>
              <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
                Overlay Darkness
              </label>
              <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">How dark the overlay is over images</p>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={home.overlayIntensity ?? 0.7}
                onChange={(e) => updateSection('home', { overlayIntensity: Number(e.target.value) })}
                className="w-full accent-magenta"
              />
              <p className="font-mono text-[10px] text-warm-gray/40 mt-1">{Math.round((home.overlayIntensity ?? 0.7) * 100)}%</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateSection('home', { kenBurnsEnabled: !home.kenBurnsEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  home.kenBurnsEnabled !== false ? 'bg-magenta' : 'bg-cream'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    home.kenBurnsEnabled !== false ? 'translate-x-6' : ''
                  }`}
                />
              </button>
              <div>
                <p className="font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70">Ken Burns Effect</p>
                <p className="font-sans text-[10px] text-warm-gray/40 italic">Slow zoom/pan animation on each image</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Legacy Images */}
        <Section title="Legacy Background Images" icon={<HiPhoto className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            These are older settings. If you have slideshow images above, they take priority. These serve as fallback only.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageManager
              label="Hero Background (Main)"
              description="Main fallback background image"
              sectionIndicator="Homepage Hero"
              value={home.images?.heroMain || { url: '', alt: '' }}
              onChange={(img) => updateSection('home', { images: { ...home.images, heroMain: img } })}
              aspect="aspect-[16/9]"
              folder="home/hero"
              imageType="hero"
            />
            <ImageManager
              label="Hero Accent Image"
              description="Secondary accent image"
              sectionIndicator="Homepage Hero"
              value={home.images?.heroSecondary || { url: '', alt: '' }}
              onChange={(img) => updateSection('home', { images: { ...home.images, heroSecondary: img } })}
              aspect="aspect-[16/9]"
              folder="home/hero"
              imageType="hero"
            />
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
