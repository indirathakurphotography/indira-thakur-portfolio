'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { normalizeAllSectionLinks, normalizeUrl } from '@/lib/urlNormalizer';

export type SectionType = 'hero' | 'text-image' | 'banner' | 'gallery' | 'cards' | 'testimonials' | 'cta' | 'faq' | 'richtext' | 'split' | 'timeline';

export interface SectionItem {
  heading?: string;
  body?: string;
  image?: { url: string; alt: string };
  icon?: string;
  label?: string;
}

export interface SectionButton {
  text: string;
  link: string;
  style: 'primary' | 'secondary' | 'outline';
}

export interface SectionImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;
  heading?: string;
  subheading?: string;
  body?: string;
  richText?: string;
  images: SectionImage[];
  primaryImage?: SectionImage;
  layout: 'full' | 'contained' | 'split-left' | 'split-right';
  background: 'white' | 'ivory' | 'cream' | 'rich-black' | 'charcoal' | 'gradient';
  backgroundGradient?: string;
  buttons: SectionButton[];
  items: SectionItem[];
  spacing: 'none' | 'small' | 'medium' | 'large';
  animation: 'none' | 'fade' | 'slide-up' | 'slide-in';
}

function createDefaultSection(type: SectionType): Section {
  const base: Section = {
    id: crypto.randomUUID(),
    type,
    title: '',
    visible: true,
    order: 0,
    images: [],
    layout: 'full',
    background: 'white',
    buttons: [],
    items: [],
    spacing: 'medium',
    animation: 'none',
  };

  switch (type) {
    case 'hero':
      return { ...base, title: 'Hero Section', heading: '', subheading: '' };
    case 'text-image':
      return { ...base, title: 'Text + Image', heading: '', body: '', layout: 'split-left' };
    case 'banner':
      return { ...base, title: 'Full Width Banner', heading: '', subheading: '', background: 'rich-black' };
    case 'gallery':
      return { ...base, title: 'Gallery', images: [] };
    case 'cards':
      return { ...base, title: 'Cards Grid', items: [{ heading: '', body: '' }] };
    case 'testimonials':
      return { ...base, title: 'Testimonials', items: [{ heading: '', body: '' }] };
    case 'cta':
      return { ...base, title: 'Call to Action', heading: '', body: '', background: 'rich-black' };
    case 'faq':
      return { ...base, title: 'FAQ', items: [{ heading: '', body: '' }] };
    case 'richtext':
      return { ...base, title: 'Rich Text', richText: '' };
    case 'split':
      return { ...base, title: 'Split Layout', layout: 'full' };
    case 'timeline':
      return { ...base, title: 'Timeline', items: [{ heading: '', body: '', label: '' }] };
    default:
      return base;
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function validateSections(sections: Section[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  sections.forEach((section, index) => {
    const label = section.title || `Section ${index + 1}`;

    if (!section.title || section.title.trim() === '') {
      errors.push(`${label}: Section title is required.`);
    }

    switch (section.type) {
      case 'hero':
        if (!section.heading && !section.primaryImage) {
          errors.push(`${label}: Hero section must have a heading or primary image.`);
        }
        break;
      case 'banner':
        if (!section.heading && !section.primaryImage) {
          errors.push(`${label}: Banner section must have a heading or primary image.`);
        }
        break;
      case 'cta':
        if (!section.heading) {
          errors.push(`${label}: CTA section must have a heading.`);
        }
        if (!section.buttons || section.buttons.length === 0) {
          errors.push(`${label}: CTA section must have at least one button.`);
        }
        break;
      case 'faq':
        if (!section.items || section.items.length === 0) {
          errors.push(`${label}: FAQ section must have at least one item.`);
        }
        break;
      case 'text-image':
        if (!section.heading && !section.body && !section.primaryImage) {
          errors.push(`${label}: Text-image section must have a heading, body, or primary image.`);
        }
        break;
    }
  });

  return { valid: errors.length === 0, errors };
}

export function useSectionsBuilder(initialPageKey: string = 'home') {
  const [pageKey, setPageKey] = useState(initialPageKey);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
  }, []);

  const fetchSections = useCallback(async (key?: string) => {
    const targetPageKey = key || pageKey;
    try {
      setLoading(true);
      setError(null);
      clearMessages();
      const response = await fetch(`/api/dynamic-sections?pageKey=${encodeURIComponent(targetPageKey)}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(err.error || `Server error (${response.status})`);
      }
      const data = await response.json();
      const fetchedSections = (data.sections || []).map((s: Section, i: number) => ({
        ...s,
        order: i,
      }));
      // Normalize all internal links in fetched sections
      setSections(normalizeAllSectionLinks(fetchedSections));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sections';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pageKey, clearMessages]);

  const saveSections = useCallback(async (sectionsToSave?: Section[]) => {
    const payload = sectionsToSave || sections;
    // Normalize all links before saving
    const normalizedPayload = normalizeAllSectionLinks(payload);
    try {
      setSaving(true);
      setError(null);

      const validation = validateSections(normalizedPayload);
      if (!validation.valid) {
        setSaving(false);
        toast.error(validation.errors.join(' '));
        return null;
      }

      const orderedSections = normalizedPayload.map((s, i) => ({ ...s, order: i }));

      const response = await fetch('/api/dynamic-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey, sections: orderedSections }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(err.error || `Server error (${response.status})`);
      }

      const saved = await response.json();
      const savedSections = (saved.sections || []).map((s: Section, i: number) => ({
        ...s,
        order: i,
      }));
      setSections(savedSections);
      toast.success('Changes Saved Successfully');

      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      toast.error('Failed to Save Changes');
      return null;
    } finally {
      setSaving(false);
    }
  }, [pageKey, sections]);

  const addSection = useCallback((type: SectionType) => {
    const newSection = createDefaultSection(type);
    setSections(prev => {
      const updated = [...prev, newSection].map((s, i) => ({ ...s, order: i }));
      return updated;
    });
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
  }, []);

  const duplicateSection = useCallback((id: string) => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const clone = deepClone(prev[index]);
      clone.id = crypto.randomUUID();
      clone.title = `${clone.title || 'Section'} (Copy)`;
      const updated = [...prev];
      updated.splice(index + 1, 0, clone);
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const moveSectionUp = useCallback((id: string) => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index <= 0) return prev;
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const moveSectionDown = useCallback((id: string) => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const updateSection = useCallback((id: string, data: Partial<Section>) => {
    // Normalize links if buttons are being updated
    const normalizedData = data.buttons
      ? { ...data, buttons: data.buttons.map(btn => ({ ...btn, link: normalizeUrl(btn.link) })) }
      : data;
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, ...normalizedData } : s))
    );
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  }, []);

  return {
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
  };
}
