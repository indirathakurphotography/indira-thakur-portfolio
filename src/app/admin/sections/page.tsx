"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSectionsBuilder, Section, SectionType, SectionImage, SectionButton, SectionItem } from '@/hooks/useSectionsBuilder';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ImageManager from '@/components/admin/ImageManager';
import { toast } from '@/lib/toast';
import StickySaveBar from '@/components/admin/StickySaveBar';
import { normalizeUrl } from '@/lib/urlNormalizer';
import {
  HiSquares2X2,
  HiChevronUp,
  HiChevronDown,
  HiPencil,
  HiTrash,
  HiPlus,
  HiEye,
  HiEyeSlash,
  HiClipboardDocument,
  HiCheckCircle,
  HiExclamationCircle,
  HiXMark,
  HiPhoto,
  HiDocumentText,
  HiTv,
  HiRectangleStack,
  HiUserGroup,
  HiMegaphone,
  HiQuestionMarkCircle,
  HiViewColumns,
  HiCalendarDays,
  HiRectangleGroup,
  HiClock,
  HiArrowUp,
  HiArrowDown,
} from 'react-icons/hi2';

const PAGE_OPTIONS = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'services', label: 'Services' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
];

const SECTION_TYPES: { type: SectionType; label: string; icon: React.ReactNode }[] = [
  { type: 'hero', label: 'Hero', icon: <HiTv className="w-4 h-4" /> },
  { type: 'text-image', label: 'Text + Image', icon: <HiDocumentText className="w-4 h-4" /> },
  { type: 'banner', label: 'Full Width Banner', icon: <HiRectangleStack className="w-4 h-4" /> },
  { type: 'gallery', label: 'Gallery', icon: <HiPhoto className="w-4 h-4" /> },
  { type: 'cards', label: 'Cards', icon: <HiSquares2X2 className="w-4 h-4" /> },
  { type: 'testimonials', label: 'Testimonials', icon: <HiUserGroup className="w-4 h-4" /> },
  { type: 'cta', label: 'CTA', icon: <HiMegaphone className="w-4 h-4" /> },
  { type: 'faq', label: 'FAQ', icon: <HiQuestionMarkCircle className="w-4 h-4" /> },
  { type: 'richtext', label: 'Rich Text', icon: <HiDocumentText className="w-4 h-4" /> },
  { type: 'split', label: 'Split Layout', icon: <HiViewColumns className="w-4 h-4" /> },
  { type: 'timeline', label: 'Timeline', icon: <HiCalendarDays className="w-4 h-4" /> },
];

function getSectionTypeInfo(type: SectionType) {
  return SECTION_TYPES.find(st => st.type === type) || SECTION_TYPES[0];
}

export default function AdminSectionsPage() {
  const {
    sections,
    loading,
    saving,
    error,
    pageKey,
    setPageKey,
    fetchSections,
    addSection,
    removeSection,
    duplicateSection,
    moveSectionUp,
    moveSectionDown,
    updateSection,
    toggleVisibility,
    saveSections,
    clearMessages,
  } = useSectionsBuilder('home');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [originalSections, setOriginalSections] = useState<string>('[]');
  const wasLoadingRef = useRef(true);

  const previewMap: Record<string, string> = {
    home: '/',
    about: '/#about',
    gallery: '/gallery',
    services: '/#services',
    testimonials: '/#testimonials',
    faq: '/#faq',
    contact: '/#contact',
  };

  useEffect(() => {
    fetchSections();
  }, [pageKey]);

  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      setOriginalSections(JSON.stringify(sections));
    }
    wasLoadingRef.current = loading;
  }, [loading, sections]);

  const handlePageChange = useCallback((newPageKey: string) => {
    setPageKey(newPageKey);
    setExpandedId(null);
    setDeleteConfirmId(null);
  }, [setPageKey]);

  const handleAddSection = useCallback((type: SectionType) => {
    addSection(type);
    setShowAddMenu(false);
  }, [addSection]);

  const handleDeleteConfirm = useCallback((id: string) => {
    removeSection(id);
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  }, [removeSection, expandedId]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleSave = useCallback(async () => {
    await saveSections();
    setOriginalSections(JSON.stringify(sections));
  }, [saveSections, sections]);

  const dirty = JSON.stringify(sections) !== originalSections;

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Page Builder"
        description="Create, edit, reorder, and manage sections on any page of your website"
        dirty={dirty}
        previewHref={previewMap[pageKey] || '/'}
      />

      <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Page Selector */}
        <div className="bg-white border border-cream/50 rounded-lg p-6">
          <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-2">
            Select Page to Edit
          </label>
          <div className="flex flex-wrap gap-2">
            {PAGE_OPTIONS.map(page => (
              <button
                key={page.key}
                onClick={() => handlePageChange(page.key)}
                className={`px-4 py-2 rounded-lg font-sans text-sm transition-all ${
                  pageKey === page.key
                    ? 'bg-rich-black text-white'
                    : 'bg-ivory/50 border border-cream/60 text-warm-gray/70 hover:bg-cream/50 hover:text-rich-black'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
              <p className="font-sans text-sm text-warm-gray/50">Loading sections...</p>
            </div>
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white border border-cream/50 rounded-lg p-12 text-center">
            <HiSquares2X2 className="w-12 h-12 text-warm-gray/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-rich-black mb-2">No Sections Yet</h3>
            <p className="font-sans text-sm text-warm-gray/50 mb-6">
              Add your first section to start building this page.
            </p>
            <AddSectionDropdown onAdd={handleAddSection} show={showAddMenu} onToggle={() => setShowAddMenu(!showAddMenu)} />
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                total={sections.length}
                isExpanded={expandedId === section.id}
                deleteConfirmId={deleteConfirmId}
                onToggleExpand={() => toggleExpand(section.id)}
                onToggleVisibility={() => toggleVisibility(section.id)}
                onMoveUp={() => moveSectionUp(section.id)}
                onMoveDown={() => moveSectionDown(section.id)}
                onDuplicate={() => duplicateSection(section.id)}
                onDelete={() => setDeleteConfirmId(section.id)}
                onDeleteConfirm={() => handleDeleteConfirm(section.id)}
                onDeleteCancel={() => setDeleteConfirmId(null)}
                onUpdate={(data) => updateSection(section.id, data)}
              />
            ))}

            {/* Add Section Button */}
            <div className="flex justify-center py-4">
              <AddSectionDropdown onAdd={handleAddSection} show={showAddMenu} onToggle={() => setShowAddMenu(!showAddMenu)} />
            </div>
          </div>
        )}

      </div>
      {sections.length > 0 && (
        <StickySaveBar
          dirty={dirty}
          saving={saving}
          onDiscard={() => { fetchSections(); toast.info('Changes discarded'); }}
          onSave={() => handleSave()}
        />
      )}
    </div>
  );
}

function AddSectionDropdown({ onAdd, show, onToggle }: { onAdd: (type: SectionType) => void; show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 px-6 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all rounded"
      >
        <HiPlus className="w-4 h-4" />
        Add New Section
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-cream/50 rounded-lg shadow-lg z-20 py-2 max-h-80 overflow-y-auto">
            {SECTION_TYPES.map(st => (
              <button
                key={st.type}
                onClick={() => onAdd(st.type)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left font-sans text-sm text-warm-gray/70 hover:bg-cream/30 hover:text-rich-black transition-colors"
              >
                <span className="text-magenta/50">{st.icon}</span>
                {st.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SectionCard({
  section,
  index,
  total,
  isExpanded,
  deleteConfirmId,
  onToggleExpand,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
  onUpdate,
}: {
  section: Section;
  index: number;
  total: number;
  isExpanded: boolean;
  deleteConfirmId: string | null;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onUpdate: (data: Partial<Section>) => void;
}) {
  const typeInfo = getSectionTypeInfo(section.type);
  const isDeleting = deleteConfirmId === section.id;

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-all ${isExpanded ? 'border-magenta/30 shadow-sm' : 'border-cream/50'}`}>
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag Handle / Order Controls */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 text-warm-gray/30 hover:text-rich-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <HiChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 text-warm-gray/30 hover:text-rich-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <HiChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Section Type Icon */}
        <span className="text-magenta/50">{typeInfo.icon}</span>

        {/* Title + Type */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full font-serif text-sm text-rich-black bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-warm-gray/30"
            placeholder={typeInfo.label}
          />
          <p className="font-mono text-[9px] text-warm-gray/30 uppercase tracking-wider">{typeInfo.label}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`p-1.5 rounded transition-colors ${section.visible ? 'text-warm-gray/40 hover:text-rich-black' : 'text-red-400 hover:text-red-600'}`}
            title={section.visible ? 'Hide section' : 'Show section'}
          >
            {section.visible ? <HiEye className="w-4 h-4" /> : <HiEyeSlash className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-warm-gray/40 hover:text-rich-black transition-colors"
            title="Duplicate section"
          >
            <HiClipboardDocument className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className={`p-1.5 transition-colors ${isExpanded ? 'text-magenta' : 'text-warm-gray/40 hover:text-rich-black'}`}
            title="Edit section"
          >
            <HiPencil className="w-4 h-4" />
          </button>
          {isDeleting ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={onDeleteConfirm}
                className="px-2 py-1 bg-red-500 text-white font-sans text-[10px] uppercase tracking-wider rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="px-2 py-1 bg-cream text-warm-gray/60 font-sans text-[10px] uppercase tracking-wider rounded hover:bg-cream/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-warm-gray/40 hover:text-red-500 transition-colors"
              title="Delete section"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visibility Badge */}
      {!section.visible && (
        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded font-mono text-[9px] text-red-600 uppercase tracking-wider">
            <HiEyeSlash className="w-3 h-3" />
            Hidden
          </span>
        </div>
      )}

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-cream/50 pt-4 space-y-5">
          <SectionEditor section={section} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  return (
    <div className="space-y-5">
      {/* Common Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput label="Section Title" value={section.title} onChange={(v) => onUpdate({ title: v })} placeholder="Internal name for this section" />
        <div>
          <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">Spacing</label>
          <select
            value={section.spacing}
            onChange={(e) => onUpdate({ spacing: e.target.value as Section['spacing'] })}
            className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
          >
            <option value="none">None</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">Background</label>
          <select
            value={section.background}
            onChange={(e) => onUpdate({ background: e.target.value as Section['background'] })}
            className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
          >
            <option value="white">White</option>
            <option value="ivory">Ivory</option>
            <option value="cream">Cream</option>
            <option value="rich-black">Rich Black</option>
            <option value="charcoal">Charcoal</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        <div>
          <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">Layout</label>
          <select
            value={section.layout}
            onChange={(e) => onUpdate({ layout: e.target.value as Section['layout'] })}
            className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
          >
            <option value="full">Full Width</option>
            <option value="contained">Contained</option>
            <option value="split-left">Split Left</option>
            <option value="split-right">Split Right</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">Animation</label>
          <select
            value={section.animation}
            onChange={(e) => onUpdate({ animation: e.target.value as Section['animation'] })}
            className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="slide-up">Slide Up</option>
            <option value="slide-in">Slide In</option>
          </select>
        </div>
        {section.background === 'gradient' && (
          <FieldInput label="Background Gradient" value={section.backgroundGradient || ''} onChange={(v) => onUpdate({ backgroundGradient: v })} placeholder="e.g., linear-gradient(135deg, #111 0%, #222 100%)" />
        )}
      </div>

      {/* Type-Specific Fields */}
      <div className="border-t border-cream/50 pt-4">
        <SectionTypeFields section={section} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function SectionTypeFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  switch (section.type) {
    case 'hero':
      return <HeroFields section={section} onUpdate={onUpdate} />;
    case 'text-image':
      return <TextImageFields section={section} onUpdate={onUpdate} />;
    case 'banner':
      return <BannerFields section={section} onUpdate={onUpdate} />;
    case 'gallery':
      return <GalleryFields section={section} onUpdate={onUpdate} />;
    case 'cards':
      return <CardsFields section={section} onUpdate={onUpdate} />;
    case 'testimonials':
      return <TestimonialsFields section={section} onUpdate={onUpdate} />;
    case 'cta':
      return <CTAFields section={section} onUpdate={onUpdate} />;
    case 'faq':
      return <FAQFields section={section} onUpdate={onUpdate} />;
    case 'richtext':
      return <RichTextFields section={section} onUpdate={onUpdate} />;
    case 'split':
      return <SplitFields section={section} onUpdate={onUpdate} />;
    case 'timeline':
      return <TimelineFields section={section} onUpdate={onUpdate} />;
    default:
      return null;
  }
}

function HeroFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Main hero heading" />
      <FieldInput label="Subheading" value={section.subheading || ''} onChange={(v) => onUpdate({ subheading: v })} placeholder="Secondary text below heading" />
      <ImageManager
        label="Primary Image"
        value={section.primaryImage || { url: '', alt: '' }}
        onChange={(img) => onUpdate({ primaryImage: img })}
        aspect="aspect-[16/9]"
        folder="sections/hero"
      />
      <ButtonsEditor buttons={section.buttons} onChange={(buttons) => onUpdate({ buttons })} />
    </div>
  );
}

function TextImageFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Section heading" />
      <FieldTextarea label="Body Text" value={section.body || ''} onChange={(v) => onUpdate({ body: v })} placeholder="Content text..." />
      <div>
        <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">Image Position</label>
        <select
          value={section.layout}
          onChange={(e) => onUpdate({ layout: e.target.value as Section['layout'] })}
          className="w-full px-4 py-2.5 bg-white border border-cream/60 text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40"
        >
          <option value="split-left">Image Left</option>
          <option value="split-right">Image Right</option>
        </select>
      </div>
      <ImageManager
        label="Section Image"
        value={section.primaryImage || { url: '', alt: '' }}
        onChange={(img) => onUpdate({ primaryImage: img })}
        aspect="aspect-[4/3]"
        folder="sections/text-image"
      />
    </div>
  );
}

function BannerFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Banner heading" />
      <FieldInput label="Subheading" value={section.subheading || ''} onChange={(v) => onUpdate({ subheading: v })} placeholder="Banner subheading" />
      <ImageManager
        label="Background Image"
        value={section.primaryImage || { url: '', alt: '' }}
        onChange={(img) => onUpdate({ primaryImage: img })}
        aspect="aspect-[21/9]"
        folder="sections/banner"
      />
      <ButtonsEditor buttons={section.buttons} onChange={(buttons) => onUpdate({ buttons })} />
    </div>
  );
}

function GalleryFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  const addImage = () => {
    const images = [...section.images, { url: '', alt: '' }];
    onUpdate({ images });
  };

  const removeImage = (index: number) => {
    const images = section.images.filter((_, i) => i !== index);
    onUpdate({ images });
  };

  const updateImage = (index: number, img: SectionImage) => {
    const images = [...section.images];
    images[index] = img;
    onUpdate({ images });
  };

  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Gallery heading (optional)" />
      <div className="space-y-4">
        {section.images.map((img, i) => (
          <div key={i} className="relative">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Image #{i + 1}</span>
              <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                <HiXMark className="w-3 h-3" />
              </button>
            </div>
            <ImageManager
              label=""
              value={img}
              onChange={(newImg) => updateImage(i, newImg)}
              aspect="aspect-[4/3]"
              folder="sections/gallery"
            />
          </div>
        ))}
        <button type="button" onClick={addImage} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
          <HiPlus className="w-4 h-4" /> Add Image
        </button>
      </div>
    </div>
  );
}

function CardsFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  const addItem = () => {
    const items = [...section.items, { heading: '', body: '' }];
    onUpdate({ items });
  };

  const removeItem = (index: number) => {
    const items = section.items.filter((_, i) => i !== index);
    onUpdate({ items });
  };

  const updateItem = (index: number, data: Partial<SectionItem>) => {
    const items = [...section.items];
    items[index] = { ...items[index], ...data };
    onUpdate({ items });
  };

  const updateItemImage = (index: number, img: SectionImage) => {
    const items = [...section.items];
    items[index] = { ...items[index], image: img };
    onUpdate({ items });
  };

  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Cards section heading (optional)" />
      <div className="space-y-4">
        {section.items.map((item, i) => (
          <div key={i} className="p-4 bg-ivory/50 border border-cream/40 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Card #{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 transition-colors">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
            <FieldInput label="Heading" value={item.heading || ''} onChange={(v) => updateItem(i, { heading: v })} placeholder="Card heading" />
            <FieldTextarea label="Body" value={item.body || ''} onChange={(v) => updateItem(i, { body: v })} placeholder="Card content..." rows={3} />
            <ImageManager
              label="Card Image"
              value={item.image || { url: '', alt: '' }}
              onChange={(img) => updateItemImage(i, img)}
              aspect="aspect-[4/3]"
              folder="sections/cards"
            />
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
          <HiPlus className="w-4 h-4" /> Add Card
        </button>
      </div>
    </div>
  );
}

function TestimonialsFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  const addItem = () => {
    const items = [...section.items, { heading: '', body: '' }];
    onUpdate({ items });
  };

  const removeItem = (index: number) => {
    const items = section.items.filter((_, i) => i !== index);
    onUpdate({ items });
  };

  const updateItem = (index: number, data: Partial<SectionItem>) => {
    const items = [...section.items];
    items[index] = { ...items[index], ...data };
    onUpdate({ items });
  };

  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Testimonials heading (optional)" />
      <div className="space-y-4">
        {section.items.map((item, i) => (
          <div key={i} className="p-4 bg-ivory/50 border border-cream/40 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Testimonial #{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 transition-colors">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
            <FieldInput label="Author" value={item.heading || ''} onChange={(v) => updateItem(i, { heading: v })} placeholder="Author name" />
            <FieldTextarea label="Quote" value={item.body || ''} onChange={(v) => updateItem(i, { body: v })} placeholder="Their testimonial..." rows={3} />
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
          <HiPlus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>
    </div>
  );
}

function CTAFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="CTA heading" />
      <FieldTextarea label="Body Text" value={section.body || ''} onChange={(v) => onUpdate({ body: v })} placeholder="Supporting text..." />
      <ButtonsEditor buttons={section.buttons} onChange={(buttons) => onUpdate({ buttons })} />
    </div>
  );
}

function FAQFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  const addItem = () => {
    const items = [...section.items, { heading: '', body: '' }];
    onUpdate({ items });
  };

  const removeItem = (index: number) => {
    const items = section.items.filter((_, i) => i !== index);
    onUpdate({ items });
  };

  const updateItem = (index: number, data: Partial<SectionItem>) => {
    const items = [...section.items];
    items[index] = { ...items[index], ...data };
    onUpdate({ items });
  };

  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="FAQ heading (optional)" />
      <div className="space-y-4">
        {section.items.map((item, i) => (
          <div key={i} className="p-4 bg-ivory/50 border border-cream/40 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">FAQ #{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 transition-colors">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
            <FieldInput label="Question" value={item.heading || ''} onChange={(v) => updateItem(i, { heading: v })} placeholder="The question" />
            <FieldTextarea label="Answer" value={item.body || ''} onChange={(v) => updateItem(i, { body: v })} placeholder="The answer..." rows={3} />
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
          <HiPlus className="w-4 h-4" /> Add FAQ Item
        </button>
      </div>
    </div>
  );
}

function RichTextFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      <FieldTextarea label="Rich Text Content" value={section.richText || ''} onChange={(v) => onUpdate({ richText: v })} placeholder="Write your content here..." rows={10} />
    </div>
  );
}

function SplitFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  const updateImage = (index: number, img: SectionImage) => {
    const images = [...section.images];
    images[index] = img;
    onUpdate({ images });
  };

  const ensureImages = () => {
    if (section.images.length < 2) {
      const images = [...section.images];
      while (images.length < 2) {
        images.push({ url: '', alt: '' });
      }
      onUpdate({ images });
    }
  };

  useEffect(() => {
    ensureImages();
  }, []);

  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Split section heading (optional)" />
      <div className="grid grid-cols-2 gap-4">
        <ImageManager
          label="Left Image"
          value={section.images[0] || { url: '', alt: '' }}
          onChange={(img) => updateImage(0, img)}
          aspect="aspect-[3/4]"
          folder="sections/split"
        />
        <ImageManager
          label="Right Image"
          value={section.images[1] || { url: '', alt: '' }}
          onChange={(img) => updateImage(1, img)}
          aspect="aspect-[3/4]"
          folder="sections/split"
        />
      </div>
    </div>
  );
}

function TimelineFields({ section, onUpdate }: { section: Section; onUpdate: (data: Partial<Section>) => void }) {
  const addItem = () => {
    const items = [...section.items, { heading: '', body: '', label: '' }];
    onUpdate({ items });
  };

  const removeItem = (index: number) => {
    const items = section.items.filter((_, i) => i !== index);
    onUpdate({ items });
  };

  const updateItem = (index: number, data: Partial<SectionItem>) => {
    const items = [...section.items];
    items[index] = { ...items[index], ...data };
    onUpdate({ items });
  };

  return (
    <div className="space-y-4">
      <FieldInput label="Heading" value={section.heading || ''} onChange={(v) => onUpdate({ heading: v })} placeholder="Timeline heading (optional)" />
      <div className="space-y-4">
        {section.items.map((item, i) => (
          <div key={i} className="p-4 bg-ivory/50 border border-cream/40 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-warm-gray/40 uppercase tracking-wider">Event #{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 transition-colors">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Label" value={item.label || ''} onChange={(v) => updateItem(i, { label: v })} placeholder="e.g., 2023" />
              <FieldInput label="Heading" value={item.heading || ''} onChange={(v) => updateItem(i, { heading: v })} placeholder="Event title" />
            </div>
            <FieldTextarea label="Description" value={item.body || ''} onChange={(v) => updateItem(i, { body: v })} placeholder="Describe this event..." rows={2} />
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
          <HiPlus className="w-4 h-4" /> Add Timeline Event
        </button>
      </div>
    </div>
  );
}

function ButtonsEditor({ buttons, onChange }: { buttons: SectionButton[]; onChange: (buttons: SectionButton[]) => void }) {
  const addButton = () => {
    onChange([...buttons, { text: '', link: '', style: 'primary' }]);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, data: Partial<SectionButton>) => {
    const updated = [...buttons];
    // Normalize link if it's being updated
    const normalizedData = data.link !== undefined 
      ? { ...data, link: normalizeUrl(data.link) }
      : data;
    updated[index] = { ...updated[index], ...normalizedData };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70">Buttons</label>
      {buttons.map((btn, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              type="text"
              value={btn.text}
              onChange={(e) => updateButton(i, { text: e.target.value })}
              placeholder="Button text"
              className="w-full px-3 py-2 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={btn.link}
              onChange={(e) => updateButton(i, { link: e.target.value })}
              placeholder="Link URL"
              className="w-full px-3 py-2 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
            />
          </div>
          <select
            value={btn.style}
            onChange={(e) => updateButton(i, { style: e.target.value as SectionButton['style'] })}
            className="px-3 py-2 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </select>
          <button type="button" onClick={() => removeButton(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <HiXMark className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addButton} className="flex items-center gap-2 text-magenta font-sans text-xs hover:text-raspberry transition-colors">
        <HiPlus className="w-3 h-3" /> Add Button
      </button>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">{label}</label>
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

function FieldTextarea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">{label}</label>
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
