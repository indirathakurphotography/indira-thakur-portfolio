'use client';

import React, { useState } from 'react';
import {
  TypographyConfig,
  ELEMENT_TYPE_PRESETS,
  FONT_FAMILY_PRESETS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_PRESETS,
  TEXT_STYLE_PRESETS,
  TEXT_ALIGN_PRESETS,
  LINE_HEIGHT_PRESETS,
  LETTER_SPACING_PRESETS,
  COLOR_PALETTE_PRESETS,
  getTypographyStyles,
} from '@/types/typography';
import {
  HiPaintBrush,
  HiChevronDown,
  HiChevronUp,
  HiArrowPath,
  HiSparkles,
  HiPlus,
  HiTrash,
} from 'react-icons/hi2';

export interface TypographyControlProps {
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (newVal: TypographyConfig) => void;
  defaultColor?: string;
  allowCustomSize?: boolean;
  onDelete?: () => void;
}

export interface TypographyElementOption {
  id: string;
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (val: TypographyConfig) => void;
  defaultColor?: string;
  isCustom?: boolean;
  onDelete?: () => void;
}

export interface SectionTypographyManagerProps {
  title?: string;
  description?: string;
  elements: TypographyElementOption[];
  defaultSelectedId?: string;
  onAddCustomElement?: (id: string, label: string) => void;
}

/**
 * Core individual typography editing panel for a single element
 */
export function TypographyPanel({
  label,
  sublabel,
  value = {},
  onChange,
  defaultColor = '#2B2625',
  allowCustomSize = true,
  onDelete,
}: TypographyControlProps) {
  const currentElementType = value.elementType || 'body';
  const currentFamily = value.fontFamily || 'default';
  const currentSize = value.fontSize || 'normal';
  const currentCustomSize = value.customFontSize !== undefined ? String(value.customFontSize) : '';
  const currentWeight = value.fontWeight ? String(value.fontWeight) : '400';
  const currentColor = value.color || defaultColor;
  const currentStyle = value.textStyle || 'normal';
  const currentAlign = value.textAlign || 'left';
  const currentLineHeight = value.lineHeight || 'normal';
  const currentLetterSpacing = value.letterSpacing || 'normal';

  const [previewText, setPreviewText] = useState(
    currentElementType === 'heading'
      ? label || 'Fine Art Photography'
      : currentElementType === 'quote'
      ? '"Photography is the art of preserving human emotion."'
      : currentElementType === 'button'
      ? 'Book a Consultation →'
      : 'Capturing timeless memories and family legacies with museum-grade craftsmanship.'
  );

  const handleChange = (field: keyof TypographyConfig, val: any) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      elementType: 'body',
      fontFamily: 'default',
      fontSize: 'normal',
      customFontSize: undefined,
      fontWeight: '400',
      color: defaultColor,
      textStyle: 'normal',
      textAlign: 'left',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    });
  };

  // Compute live styled CSS for preview
  const liveStyles = getTypographyStyles(value, {
    defaultColor,
    defaultFamily: 'default',
    defaultSize: 'normal',
    defaultWeight: '400',
  });

  return (
    <div className="space-y-5 bg-white p-4 sm:p-6 rounded-xl border border-[#E7DDD2] shadow-2xs">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7DDD2]/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#2B2625] uppercase tracking-wider block">
              {label}
            </span>
            {value.elementType && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#C39E96]/20 text-[#2B2625] font-semibold">
                {value.elementType}
              </span>
            )}
          </div>
          {sublabel && <span className="text-[11px] text-[#7C706D] block mt-0.5">{sublabel}</span>}
        </div>

        {/* Live Status Pill & Delete button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] text-[11px] text-[#2B2625]">
            <span
              className="w-3 h-3 rounded-full border border-black/15 shrink-0 shadow-2xs"
              style={{ backgroundColor: currentColor }}
            />
            <span className="font-medium capitalize">{currentFamily}</span>
            <span className="text-[#A88179]">•</span>
            <span className="font-medium capitalize">
              {currentCustomSize ? `${currentCustomSize}px` : currentSize}
            </span>
            <span className="text-[#A88179]">•</span>
            <span className="font-medium">{currentWeight}</span>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Delete this custom text element"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Live Preview Box */}
      <div className="p-4 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2]/80 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#7C706D] uppercase tracking-wider">
          <span>Live Typography Preview</span>
          <span className="text-[#C39E96]">Rendered output</span>
        </div>
        <div
          className="p-3 bg-white rounded-lg border border-[#E7DDD2]/60 min-h-[60px] flex items-center transition-all"
        >
          <p
            className={`w-full ${liveStyles.className}`}
            style={liveStyles.style}
          >
            {previewText}
          </p>
        </div>
      </div>

      {/* Row 1: Element Type Preset */}
      <div>
        <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
          1. Element Type / Role
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
          {ELEMENT_TYPE_PRESETS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleChange('elementType', t.id)}
              className={`py-1.5 px-2 text-[10px] rounded transition-all text-center ${
                currentElementType === t.id
                  ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                  : 'text-[#7C706D] hover:text-[#2B2625] hover:bg-white/60'
              }`}
              title={t.desc}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Font Family / Style */}
      <div>
        <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
          2. Font Family
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
          {FONT_FAMILY_PRESETS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleChange('fontFamily', f.id)}
              className={`py-2 px-2.5 text-[11px] rounded transition-all text-center ${
                currentFamily === f.id
                  ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                  : 'text-[#7C706D] hover:text-[#2B2625] hover:bg-white/60'
              } ${f.previewClass}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Font Size Presets & Custom Numeric Size Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-[#2B2625] uppercase tracking-wide">
            3. Font Size & Scale
          </label>
          <span className="text-[10px] text-[#A88179] font-mono capitalize">
            {currentCustomSize ? `Custom: ${currentCustomSize}px` : `Preset: ${currentSize}`}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
          {FONT_SIZE_PRESETS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange({
                  ...value,
                  fontSize: s.id,
                  customFontSize: undefined,
                });
              }}
              className={`py-1.5 text-[10px] rounded transition-all font-medium text-center ${
                currentSize === s.id && !currentCustomSize
                  ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                  : 'text-[#7C706D] hover:text-[#2B2625] hover:bg-white/60'
              }`}
              title={`${s.desc} (${s.pxEquivalent})`}
            >
              <span className="block">{s.label}</span>
              <span className="block text-[9px] text-[#7C706D]/70 font-mono mt-0.5">
                {s.pxEquivalent}
              </span>
            </button>
          ))}
        </div>

        {allowCustomSize && (
          <div className="mt-2.5 flex items-center gap-3 bg-[#FAF6F3] p-2.5 rounded-lg border border-[#E7DDD2]/70">
            <span className="text-[11px] font-medium text-[#2B2625] whitespace-nowrap">
              Exact Numeric Size (px):
            </span>
            <input
              type="number"
              min="8"
              max="140"
              placeholder="e.g. 42"
              value={currentCustomSize}
              onChange={(e) => {
                const val = e.target.value;
                onChange({
                  ...value,
                  customFontSize: val ? Number(val) : undefined,
                  fontSize: val ? val : value.fontSize || 'normal',
                });
              }}
              className="w-24 px-2.5 py-1 text-xs font-mono rounded border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
            <span className="text-[10px] text-[#7C706D]">
              Enter exact pixel value (e.g. 18, 24, 42, 64) for precision editorial styling.
            </span>
          </div>
        )}
      </div>

      {/* Row 4: Font Weight / Bold */}
      <div>
        <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
          4. Font Weight & Thickness
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
          {FONT_WEIGHT_PRESETS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleChange('fontWeight', w.id)}
              className={`py-1.5 text-[11px] rounded transition-all text-center ${
                currentWeight === w.id
                  ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                  : 'text-[#7C706D] hover:text-[#2B2625] hover:bg-white/60'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 5: Text Color (Picker + HEX Input + Luxury Presets) */}
      <div>
        <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
          5. Text Color
        </label>
        <div className="flex flex-wrap items-center gap-2.5 bg-[#FAF6F3] p-2.5 rounded-lg border border-[#E7DDD2]">
          <input
            type="color"
            value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#2B2625'}
            onChange={(e) => handleChange('color', e.target.value)}
            className="w-8 h-8 rounded border border-[#E7DDD2] cursor-pointer p-0.5 shrink-0 bg-white"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => handleChange('color', e.target.value)}
            placeholder="#2B2625"
            className="w-28 px-2.5 py-1.5 text-xs font-mono rounded border border-[#E7DDD2] bg-white text-[#2B2625] uppercase focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          />
          <div className="flex items-center gap-1.5 flex-wrap pl-2 border-l border-[#E7DDD2]">
            {COLOR_PALETTE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleChange('color', p.value)}
                className={`w-6 h-6 rounded-full border shrink-0 transition-transform hover:scale-115 shadow-2xs ${
                  currentColor.toLowerCase() === p.value.toLowerCase()
                    ? 'ring-2 ring-[#C39E96] ring-offset-1 border-black/30'
                    : 'border-black/15'
                }`}
                style={{ backgroundColor: p.value }}
                title={`${p.label} (${p.value})`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Row 6: Style (Italic/Underline) & Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Style */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            6. Text Style
          </label>
          <div className="grid grid-cols-4 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
            {TEXT_STYLE_PRESETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleChange('textStyle', s.id)}
                className={`py-1.5 text-[10px] rounded transition-all text-center ${
                  currentStyle === s.id
                    ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                    : 'text-[#7C706D] hover:text-[#2B2625]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            7. Text Alignment
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
            {TEXT_ALIGN_PRESETS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleChange('textAlign', a.id)}
                className={`py-1.5 text-[10px] rounded transition-all text-center ${
                  currentAlign === a.id
                    ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                    : 'text-[#7C706D] hover:text-[#2B2625]'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 7: Line Height & Letter Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Line Height */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            8. Line Height
          </label>
          <div className="grid grid-cols-4 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
            {LINE_HEIGHT_PRESETS.map((lh) => (
              <button
                key={lh.id}
                type="button"
                onClick={() => handleChange('lineHeight', lh.id)}
                className={`py-1.5 text-[10px] rounded transition-all text-center ${
                  currentLineHeight === lh.id
                    ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                    : 'text-[#7C706D] hover:text-[#2B2625]'
                }`}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            9. Letter Spacing (Tracking)
          </label>
          <div className="grid grid-cols-4 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
            {LETTER_SPACING_PRESETS.map((ls) => (
              <button
                key={ls.id}
                type="button"
                onClick={() => handleChange('letterSpacing', ls.id)}
                className={`py-1.5 text-[10px] rounded transition-all text-center ${
                  currentLetterSpacing === ls.id
                    ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                    : 'text-[#7C706D] hover:text-[#2B2625]'
                }`}
              >
                {ls.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Reset Action */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E7DDD2]/60 text-[10px] text-[#7C706D]">
        <span className="flex items-center gap-1">
          <HiSparkles className="w-3.5 h-3.5 text-[#C39E96]" />
          Changes apply live and save with this section.
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-[#7C706D] hover:text-[#2B2625] font-medium transition-colors cursor-pointer"
        >
          <HiArrowPath className="w-3 h-3" />
          <span>Reset to Section Default</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Reusable Section-Level Centralized Typography Manager
 * Provides a categorized dropdown + pill selector for all text elements in the section,
 * with support for dynamically adding new custom text elements.
 */
export function SectionTypographyManager({
  title = 'Typography & Text Styling',
  description = 'Select an individual text element below to independently customize its font size, font family, font weight, color, style, and spacing.',
  elements,
  defaultSelectedId,
  onAddCustomElement,
}: SectionTypographyManagerProps) {
  const [selectedId, setSelectedId] = useState<string>(
    defaultSelectedId || (elements.length > 0 ? elements[0].id : '')
  );

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  if (!elements || elements.length === 0) return null;

  const currentElement = elements.find((el) => el.id === selectedId) || elements[0];

  const handleCreateCustom = () => {
    if (!newLabel.trim() || !onAddCustomElement) return;
    const cleanId = `custom_${newLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    onAddCustomElement(cleanId, newLabel.trim());
    setSelectedId(cleanId);
    setNewLabel('');
    setIsAddingNew(false);
  };

  return (
    <div className="pt-5 border-t border-[#E7DDD2]/80 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96]">
            <HiPaintBrush className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B2625]">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-[#7C706D] mt-0.5 max-w-2xl">{description}</p>
            )}
          </div>
        </div>

        {onAddCustomElement && (
          <button
            type="button"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-[#C39E96] hover:text-[#2B2625] font-semibold transition-colors"
          >
            <HiPlus className="w-3.5 h-3.5" />
            <span>{isAddingNew ? 'Cancel' : '+ Add Custom Text Element'}</span>
          </button>
        )}
      </div>

      {/* Add Custom Text Element Input Bar */}
      {isAddingNew && (
        <div className="flex items-center gap-2 bg-[#FAF6F3] p-3 rounded-lg border border-[#E7DDD2]">
          <input
            type="text"
            placeholder="e.g. My Photography Philosophy, Quote 2, Extended Story..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          />
          <button
            type="button"
            onClick={handleCreateCustom}
            disabled={!newLabel.trim()}
            className="px-4 py-1.5 bg-[#2B2625] text-white text-xs font-mono uppercase rounded disabled:opacity-50 hover:bg-[#3D3534] transition-colors"
          >
            Add Element
          </button>
        </div>
      )}

      {/* Centralized Element Selector Dropdown & Quick-Tab Bar */}
      <div className="bg-[#FAF6F3]/80 p-3.5 rounded-xl border border-[#E7DDD2] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-[11px] font-semibold text-[#2B2625] uppercase tracking-wide flex items-center gap-1.5">
            <span>Select Text Element to Customize:</span>
          </label>

          {/* Clean Dropdown Selector */}
          <select
            value={currentElement.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#C39E96] cursor-pointer"
          >
            {elements.map((el) => (
              <option key={el.id} value={el.id}>
                {el.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick-Switch Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {elements.map((el) => {
            const isSelected = el.id === currentElement.id;
            const hasCustomStyles =
              Boolean(el.value?.fontSize && el.value.fontSize !== 'normal') ||
              Boolean(el.value?.customFontSize) ||
              Boolean(el.value?.fontFamily && el.value.fontFamily !== 'default') ||
              Boolean(el.value?.color && el.value.color !== el.defaultColor) ||
              Boolean(el.value?.fontWeight && el.value.fontWeight !== '400') ||
              Boolean(el.value?.textStyle && el.value.textStyle !== 'normal');

            return (
              <button
                key={el.id}
                type="button"
                onClick={() => setSelectedId(el.id)}
                className={`px-3 py-1.5 text-[10px] rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2B2625] text-white font-semibold shadow-xs'
                    : 'bg-white text-[#7C706D] hover:text-[#2B2625] border border-[#E7DDD2]'
                }`}
              >
                <span>{el.label}</span>
                {hasCustomStyles && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-[#C39E96]' : 'bg-[#2B2625]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Typography Panel For Selected Element */}
      <TypographyPanel
        key={currentElement.id}
        label={currentElement.label}
        sublabel={currentElement.sublabel}
        value={currentElement.value}
        onChange={currentElement.onChange}
        defaultColor={currentElement.defaultColor}
        onDelete={currentElement.isCustom ? currentElement.onDelete : undefined}
      />
    </div>
  );
}

/**
 * Standard Collapsible Typography Control (for individual use when needed)
 */
export default function TypographyControl({
  label,
  sublabel,
  value = {},
  onChange,
  defaultColor = '#2B2625',
  allowCustomSize = true,
  onDelete,
}: TypographyControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#E7DDD2]/70 rounded-xl bg-[#FAF6F3]/40 overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#FAF6F3] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96]">
            <HiPaintBrush className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#2B2625] block">{label}</span>
            {sublabel && <span className="text-[10px] text-[#7C706D] block">{sublabel}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7C706D]">
            {isOpen ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expanded Control Panel */}
      {isOpen && (
        <div className="p-3 bg-white border-t border-[#E7DDD2]">
          <TypographyPanel
            label={label}
            sublabel={sublabel}
            value={value}
            onChange={onChange}
            defaultColor={defaultColor}
            allowCustomSize={allowCustomSize}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
