'use client';

import { useState } from 'react';
import { useCMS } from '@/hooks/useCMS';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { HiPlus, HiTrash, HiPhoto, HiDocumentText, HiTrophy, HiHeart, HiStar } from 'react-icons/hi2';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';

export default function AdminAboutPage() {
  const { config, loading, saving, error, dirty, lastSavedAt, updateSection, saveConfig, resetConfig, fetchConfig } = useCMS();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-sm text-warm-gray/50">Loading your About section...</p>
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

  const about = config.about || {};

  const handleAchievementChange = (index: number, field: string, value: string) => {
    const achievements = [...(about.achievements || [])];
    achievements[index] = { ...achievements[index], [field]: value };
    updateSection('about', { achievements });
  };

  const addAchievement = () => {
    const achievements = [...(about.achievements || []), { title: '', description: '', year: '' }];
    updateSection('about', { achievements });
  };

  const removeAchievement = (index: number) => {
    const achievements = (about.achievements || []).filter((_: any, i: number) => i !== index);
    updateSection('about', { achievements });
  };

  const handleStatChange = (index: number, field: string, value: string) => {
    const stats = [...(about.stats || [])];
    stats[index] = { ...stats[index], [field]: value };
    updateSection('about', { stats });
  };

  const addStat = () => {
    const stats = [...(about.stats || []), { label: '', value: '' }];
    updateSection('about', { stats });
  };

  const removeStat = (index: number) => {
    const stats = (about.stats || []).filter((_: any, i: number) => i !== index);
    updateSection('about', { stats });
  };

  const handleValueChange = (index: number, field: string, value: string) => {
    const values = [...(about.values || [])];
    values[index] = { ...values[index], [field]: value };
    updateSection('about', { values });
  };

  const addValue = () => {
    const values = [...(about.values || []), { title: '', description: '' }];
    updateSection('about', { values });
  };

  const removeValue = (index: number) => {
    const values = (about.values || []).filter((_: any, i: number) => i !== index);
    updateSection('about', { values });
  };

  const handleSpecChange = (index: number, value: string) => {
    const specs = [...(about.specializations || [])];
    specs[index] = value;
    updateSection('about', { specializations: specs });
  };

  const addSpec = () => {
    const specs = [...(about.specializations || []), ''];
    updateSection('about', { specializations: specs });
  };

  const removeSpec = (index: number) => {
    const specs = (about.specializations || []).filter((_: any, i: number) => i !== index);
    updateSection('about', { specializations: specs });
  };

  const handleImageChange = (field: string, image: any) => {
    const images = { ...(about.images || {}), [field]: image };
    updateSection('about', { images });
  };

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="About Section"
        description="Tell your story, showcase your journey, and welcome visitors to your world"
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        previewHref="/#about"
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">

        {/* Section 1: Your Story */}
        <CollapsibleSection title="Your Story" icon={<HiDocumentText className="w-5 h-5" />} defaultOpen>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            This is the main text content of your About section. It appears on the homepage and the standalone About page.
          </p>

          <FieldInput
            label="Small Heading"
            helperText="The tiny text above the main heading (e.g., &quot;The Story&quot;)"
            value={about.eyebrow || ''}
            onChange={(v) => updateSection('about', { eyebrow: v })}
            placeholder="e.g., The Story"
          />
          <FieldInput
            label="Main Heading"
            helperText="The large title visitors see first"
            value={about.heading || ''}
            onChange={(v) => updateSection('about', { heading: v })}
            placeholder="e.g., A Once-in-a-Lifetime Experience"
          />
          <FieldInput
            label="Subheading (Optional)"
            helperText="Additional text below the main heading"
            value={about.subheading || ''}
            onChange={(v) => updateSection('about', { subheading: v })}
            placeholder="Optional subheading"
          />
          <FieldTextarea
            label="Your Story - Part 1"
            helperText="The first paragraph of your personal story"
            value={about.story || ''}
            onChange={(v) => updateSection('about', { story: v })}
            placeholder="Share your personal story and background..."
            rows={5}
          />
          <FieldTextarea
            label="Your Story - Part 2"
            helperText="Continuation of your story (optional)"
            value={about.storyContinued || ''}
            onChange={(v) => updateSection('about', { storyContinued: v })}
            placeholder="Continue your story..."
            rows={4}
          />
          <FieldTextarea
            label="Your Philosophy - Part 1"
            helperText="What you believe about photography"
            value={about.philosophy || ''}
            onChange={(v) => updateSection('about', { philosophy: v })}
            placeholder="Your photography philosophy..."
            rows={4}
          />
          <FieldTextarea
            label="Your Philosophy - Part 2"
            helperText="Additional philosophy thoughts (optional)"
            value={about.philosophyContinued || ''}
            onChange={(v) => updateSection('about', { philosophyContinued: v })}
            placeholder="More about your philosophy..."
            rows={3}
          />
          <FieldTextarea
            label="Your Journey - Part 1"
            helperText="Your professional milestones and achievements"
            value={about.journey || ''}
            onChange={(v) => updateSection('about', { journey: v })}
            placeholder="Your creative journey..."
            rows={4}
          />
          <FieldTextarea
            label="Your Journey - Part 2"
            helperText="Additional journey details (optional)"
            value={about.journeyContinued || ''}
            onChange={(v) => updateSection('about', { journeyContinued: v })}
            placeholder="More about your journey..."
            rows={3}
          />
          <FieldTextarea
            label="Welcome Message"
            helperText="A warm message inviting visitors to become part of your photography family"
            value={about.welcomeMessage || ''}
            onChange={(v) => updateSection('about', { welcomeMessage: v })}
            placeholder="Welcome visitors to your photography family..."
            rows={3}
          />
          <FieldInput
            label="Your Signature"
            helperText="Your name as it appears at the bottom of the About section"
            value={about.signature || ''}
            onChange={(v) => updateSection('about', { signature: v })}
            placeholder="e.g., Indira Thakur"
          />
        </CollapsibleSection>

        {/* Section 2: Images */}
        <CollapsibleSection title="Images" icon={<HiPhoto className="w-5 h-5" />} defaultOpen>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            These images appear throughout your About section. Upload high-quality photos for the best results.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageManager
              label="Founder Portrait"
              description="Your main portrait - appears in the hero area"
              helperText="Use a professional, well-lit portrait. Vertical orientation works best."
              sectionIndicator="About Hero"
              value={about.images?.founderPortrait || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('founderPortrait', img)}
              aspect="aspect-[3/4]"
              folder="about/founder"
            />
            <ImageManager
              label="Story Image"
              description="Appears next to your story text"
              helperText="An image that represents your photography journey"
              sectionIndicator="About Story"
              value={about.images?.storyImage || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('storyImage', img)}
              aspect="aspect-[4/5]"
              folder="about/story"
            />
            <ImageManager
              label="Journey Image"
              description="Appears in the dark journey section"
              helperText="An image that shows your creative process or workspace"
              sectionIndicator="About Journey"
              value={about.images?.journeyImage || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('journeyImage', img)}
              aspect="aspect-[4/3]"
              folder="about/journey"
            />
            <ImageManager
              label="Achievement Image"
              description="Shown in the achievements section"
              helperText="A photo of your proudest moment or work"
              sectionIndicator="About Achievements"
              value={about.images?.achievementImage || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('achievementImage', img)}
              aspect="aspect-[4/3]"
              folder="about/achievement"
            />
            <ImageManager
              label="Behind The Scenes"
              description="A candid behind-the-scenes photo"
              helperText="Shows you in action during a photoshoot"
              sectionIndicator="About Editorial"
              value={about.images?.behindTheScenes || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('behindTheScenes', img)}
              aspect="aspect-[16/9]"
              folder="about/bts"
            />
            <ImageManager
              label="Welcome Image"
              description="Shown in the welcome section at the bottom"
              helperText="A warm, inviting image that makes visitors feel welcome"
              sectionIndicator="About Welcome"
              value={about.images?.welcomeImage || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('welcomeImage', img)}
              aspect="aspect-[4/3]"
              folder="about/welcome"
            />
            <ImageManager
              label="Editorial Photo 1"
              description="Additional editorial image"
              helperText="Used in the visual gallery of the About section"
              sectionIndicator="About Editorial"
              value={about.images?.editorial1 || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('editorial1', img)}
              aspect="aspect-[3/4]"
              folder="about/editorial"
            />
            <ImageManager
              label="Editorial Photo 2"
              description="Additional editorial image"
              helperText="Used in the visual gallery of the About section"
              sectionIndicator="About Editorial"
              value={about.images?.editorial2 || { url: '', alt: '' }}
              onChange={(img) => handleImageChange('editorial2', img)}
              aspect="aspect-[4/3]"
              folder="about/editorial"
            />
          </div>
        </CollapsibleSection>

        {/* Section 3: Your Specializations */}
        <CollapsibleSection title="Your Specializations" icon={<HiStar className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            List the types of photography you specialize in. These appear as elegant tags in the About section.
          </p>
          <div className="space-y-2">
            {(about.specializations || []).map((spec: string, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => handleSpecChange(i, e.target.value)}
                  placeholder="e.g., Maternity Photography"
                  className="flex-1 px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="px-3 text-red-400 hover:text-red-600 transition-colors"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSpec}
              className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors"
            >
              <HiPlus className="w-4 h-4" /> Add Another Specialization
            </button>
          </div>
        </CollapsibleSection>

        {/* Section 4: Statistics */}
        <CollapsibleSection title="Statistics" icon={<HiTrophy className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Display impressive numbers that showcase your experience (e.g., &quot;500+&quot; Families Photographed).
          </p>
          <div className="space-y-3">
            {(about.stats || []).map((stat: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={stat.label || ''}
                  onChange={(e) => handleStatChange(i, 'label', e.target.value)}
                  placeholder="Label (e.g., Families Photographed)"
                  className="flex-1 px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
                />
                <input
                  type="text"
                  value={stat.value || ''}
                  onChange={(e) => handleStatChange(i, 'value', e.target.value)}
                  placeholder="Value (e.g., 500+)"
                  className="flex-1 px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
                />
                <button
                  type="button"
                  onClick={() => removeStat(i)}
                  className="px-3 text-red-400 hover:text-red-600 transition-colors"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addStat}
              className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors"
            >
              <HiPlus className="w-4 h-4" /> Add Another Statistic
            </button>
          </div>
        </CollapsibleSection>

        {/* Section 5: Achievements */}
        <CollapsibleSection title="Achievements & Milestones" icon={<HiStar className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Share your proudest moments and professional milestones.
          </p>
          <div className="space-y-4">
            {(about.achievements || []).map((ach: any, i: number) => (
              <div key={i} className="p-4 bg-ivory/50 border border-cream/40 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-warm-gray/40">Achievement #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeAchievement(i)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={ach.title || ''}
                  onChange={(e) => handleAchievementChange(i, 'title', e.target.value)}
                  placeholder="Achievement title (e.g., Film City Project)"
                  className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
                />
                <textarea
                  value={ach.description || ''}
                  onChange={(e) => handleAchievementChange(i, 'description', e.target.value)}
                  placeholder="Describe this achievement..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 resize-none"
                />
                <input
                  type="text"
                  value={ach.year || ''}
                  onChange={(e) => handleAchievementChange(i, 'year', e.target.value)}
                  placeholder="Year (e.g., 2023)"
                  className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addAchievement}
              className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors"
            >
              <HiPlus className="w-4 h-4" /> Add Another Achievement
            </button>
          </div>
        </CollapsibleSection>

        {/* Section 6: Core Values */}
        <CollapsibleSection title="Core Values" icon={<HiHeart className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            What drives your work? Share the values that guide your photography.
          </p>
          <div className="space-y-4">
            {(about.values || []).map((val: any, i: number) => (
              <div key={i} className="p-4 bg-ivory/50 border border-cream/40 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-warm-gray/40">Value #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeValue(i)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={val.title || ''}
                  onChange={(e) => handleValueChange(i, 'title', e.target.value)}
                  placeholder="Value title (e.g., Patience & Care)"
                  className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
                />
                <textarea
                  value={val.description || ''}
                  onChange={(e) => handleValueChange(i, 'description', e.target.value)}
                  placeholder="Describe this value..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 resize-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addValue}
              className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors"
            >
              <HiPlus className="w-4 h-4" /> Add Another Value
            </button>
          </div>
        </CollapsibleSection>

        {/* Section 7: Buttons */}
        <CollapsibleSection title="Button Settings" icon={<HiHeart className="w-5 h-5" />}>
          <p className="font-sans text-[11px] text-warm-gray/40 mb-4">
            Control the call-to-action button at the bottom of the About section.
          </p>
          <FieldInput
            label="Button Text"
            helperText="The text visitors see on the button"
            value={about.ctaText || ''}
            onChange={(v) => updateSection('about', { ctaText: v })}
            placeholder="e.g., View Portfolio"
          />
          <FieldInput
            label="Button Destination"
            helperText="Where the button takes visitors when clicked (e.g., /gallery, /#contact)"
            value={about.ctaLink || ''}
            onChange={(v) => updateSection('about', { ctaLink: v })}
            placeholder="e.g., /gallery"
          />
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

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-cream/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-cream/20 transition-colors"
      >
        {icon && <span className="text-magenta/50">{icon}</span>}
        <h2 className="font-serif text-lg text-rich-black flex-1 text-left">{title}</h2>
        <span
          className={`w-4 h-4 flex items-center justify-center transition-transform duration-300 ${
            open ? 'rotate-45' : ''
          }`}
        >
          <span className="w-3 h-px bg-warm-gray/40 absolute" />
          <span className="w-px h-3 bg-warm-gray/40 absolute" />
        </span>
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function FieldInput({
  label,
  helperText,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  helperText?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
        {label}
      </label>
      {helperText && (
        <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">{helperText}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors"
      />
    </div>
  );
}

function FieldTextarea({
  label,
  helperText,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  helperText?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
        {label}
      </label>
      {helperText && (
        <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">{helperText}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors resize-none"
      />
    </div>
  );
}
