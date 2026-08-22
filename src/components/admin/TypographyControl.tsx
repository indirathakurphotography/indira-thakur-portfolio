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
  HiCheck,
  HiEye,
  HiXMark,
} from 'react-icons/hi2';

export interface TypographyControlProps {
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (newVal: TypographyConfig) => void;
  defaultColor?: string;
  allowCustomSize?: boolean;
  onDelete?: () => void;
  onClose?: () => void;
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

export { default as FocusedTypographyManager } from './FocusedTypographyManager';
import FocusedTypographyManager from './FocusedTypographyManager';

export function SectionTypographyManager({
  title,
  description,
  elements,
  onAddCustomElement,
}: SectionTypographyManagerProps) {
  return (
    <FocusedTypographyManager
      title={title}
      description={description}
      elements={elements}
      onAddCustomElement={onAddCustomElement}
    />
  );
}

/**
 * Clean Single-Element Typography Editor Panel
 * Grouped into readable, non-overwhelming sections
 */
export function TypographyPanel({
  label,
  sublabel,
  value = {},
  onChange,
  defaultColor = '#2B2625',
  allowCustomSize = true,
  onDelete,
  onClose,
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

  const [activeSubTab, setActiveSubTab] = useState<'font' | 'weight' | 'color' | 'spacing'>('font');
  const [previewText, setPreviewText] = useState(
    currentElementType === 'heading'
      ? label || 'Fine Art Photography'
      : currentElementType === 'eyebrow'
      ? 'EDITORIAL COLLECTION'
      : currentElementType === 'quote'
      ? '"Photography is the art of preserving human emotion."'
      : currentElementType === 'button'
      ? 'Reserve Your Session →'
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
    <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn transition-all">
      {/* Active Element Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7DDD2]/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-lg text-[#2B2625] font-medium">
              {label}
            </span>
            {value.elementType && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#C39E96]/20 text-[#2B2625] font-semibold">
                {value.elementType}
              </span>
            )}
          </div>
          {sublabel && (
            <p className="text-xs text-[#7C706D] mt-1 font-sans">{sublabel}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Quick Specs Summary Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] text-xs text-[#2B2625] font-mono">
            <span
              className="w-3 h-3 rounded-full border border-black/15 shrink-0 shadow-2xs"
              style={{ backgroundColor: currentColor }}
            />
            <span className="capitalize">{currentFamily}</span>
            <span className="text-[#C39E96]">•</span>
            <span>{currentCustomSize ? `${currentCustomSize}px` : currentSize}</span>
            <span className="text-[#C39E96]">•</span>
            <span>w{currentWeight}</span>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Delete this custom text element"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3] transition-colors"
              title="Collapse editor"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Live Preview Box */}
      <div className="bg-[#FAF6F3] p-4 sm:p-5 rounded-xl border border-[#E7DDD2]/90 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7C706D] uppercase tracking-wider">
          <span className="flex items-center gap-1.5 font-semibold text-[#2B2625]">
            <HiEye className="w-3.5 h-3.5 text-[#C39E96]" />
            Live Rendered Output
          </span>
          <span className="text-[#C39E96]">Updates in real-time</span>
        </div>
        <div className="p-4 sm:p-6 bg-white rounded-lg border border-[#E7DDD2]/70 min-h-[70px] flex items-center justify-center overflow-x-auto shadow-2xs">
          <p
            className={`w-full text-center ${liveStyles.className}`}
            style={liveStyles.style}
          >
            {previewText}
          </p>
        </div>
      </div>

      {/* Editor Sub-Tabs (Prevents overwhelming 30+ controls simultaneously) */}
      <div className="flex items-center gap-2 border-b border-[#E7DDD2]/80 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('font')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider rounded-t-lg transition-all border-b-2 ${
            activeSubTab === 'font'
              ? 'border-[#2B2625] text-[#2B2625] bg-[#FAF6F3]/60 font-semibold'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]/30'
          }`}
        >
          1. Font & Size
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('weight')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider rounded-t-lg transition-all border-b-2 ${
            activeSubTab === 'weight'
              ? 'border-[#2B2625] text-[#2B2625] bg-[#FAF6F3]/60 font-semibold'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]/30'
          }`}
        >
          2. Weight & Style
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('color')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider rounded-t-lg transition-all border-b-2 ${
            activeSubTab === 'color'
              ? 'border-[#2B2625] text-[#2B2625] bg-[#FAF6F3]/60 font-semibold'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]/30'
          }`}
        >
          3. Text Color
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('spacing')}
          className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider rounded-t-lg transition-all border-b-2 ${
            activeSubTab === 'spacing'
              ? 'border-[#2B2625] text-[#2B2625] bg-[#FAF6F3]/60 font-semibold'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]/30'
          }`}
        >
          4. Align & Spacing
        </button>
      </div>

      {/* TAB 1: Font Family & Size */}
      {activeSubTab === 'font' && (
        <div className="space-y-6 pt-2">
          {/* Element Role Presets */}
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
              Semantic Text Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {ELEMENT_TYPE_PRESETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleChange('elementType', t.id)}
                  className={`py-2 px-3 text-xs rounded-lg transition-all text-center border ${
                    currentElementType === t.id
                      ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                      : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                  }`}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
              Font Family & Archetype
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FONT_FAMILY_PRESETS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleChange('fontFamily', f.id)}
                  className={`p-3 text-xs rounded-xl transition-all text-center border flex flex-col items-center justify-center gap-1 ${
                    currentFamily === f.id
                      ? 'bg-[#2B2625] text-white border-[#2B2625] shadow-xs'
                      : 'bg-[#FAF6F3] text-[#2B2625] border-[#E7DDD2] hover:bg-white hover:border-[#2B2625]'
                  }`}
                >
                  <span className={`text-base font-medium ${f.previewClass}`}>
                    {f.label}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${currentFamily === f.id ? 'text-[#C39E96]' : 'text-[#7C706D]'}`}>
                    {f.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#2B2625] uppercase tracking-wide">
                Font Size Scale
              </label>
              <span className="text-xs text-[#C39E96] font-mono">
                {currentCustomSize ? `Custom: ${currentCustomSize}px` : `Preset: ${currentSize}`}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
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
                  className={`py-2 px-1 text-xs rounded-lg transition-all text-center border ${
                    currentSize === s.id && !currentCustomSize
                      ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                      : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                  }`}
                  title={`${s.desc} (${s.pxEquivalent})`}
                >
                  <span className="block font-medium">{s.label}</span>
                  <span className={`block text-[10px] font-mono mt-0.5 ${currentSize === s.id && !currentCustomSize ? 'text-[#C39E96]' : 'text-[#7C706D]/70'}`}>
                    {s.pxEquivalent}
                  </span>
                </button>
              ))}
            </div>

            {allowCustomSize && (
              <div className="mt-3 flex items-center gap-3 bg-[#FAF6F3] p-3 rounded-xl border border-[#E7DDD2]">
                <span className="text-xs font-semibold text-[#2B2625] whitespace-nowrap">
                  Exact Custom Size (px):
                </span>
                <input
                  type="number"
                  min="8"
                  max="160"
                  placeholder="e.g. 48"
                  value={currentCustomSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange({
                      ...value,
                      customFontSize: val ? Number(val) : undefined,
                      fontSize: val ? val : value.fontSize || 'normal',
                    });
                  }}
                  className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
                <span className="text-xs text-[#7C706D] font-sans">
                  Type any custom pixel size (e.g. 28, 44, 56, 72) for bespoke styling.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Weight & Style */}
      {activeSubTab === 'weight' && (
        <div className="space-y-6 pt-2">
          {/* Font Weight */}
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
              Font Weight & Thickness
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {FONT_WEIGHT_PRESETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleChange('fontWeight', w.id)}
                  className={`py-3 px-3 text-xs rounded-xl transition-all text-center border ${
                    currentWeight === w.id
                      ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                      : 'bg-[#FAF6F3] text-[#2B2625] border-[#E7DDD2] hover:border-[#2B2625] hover:bg-white'
                  }`}
                  style={{ fontWeight: Number(w.id) || 400 }}
                >
                  <span className="block text-sm">{w.label}</span>
                  <span className={`block text-[10px] font-mono mt-0.5 ${currentWeight === w.id ? 'text-[#C39E96]' : 'text-[#7C706D]'}`}>
                    {w.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Style / Transform */}
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
              Text Style & Transformation
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TEXT_STYLE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleChange('textStyle', s.id)}
                  className={`py-2.5 px-3 text-xs rounded-xl transition-all text-center border ${
                    currentStyle === s.id
                      ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                      : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Text Color */}
      {activeSubTab === 'color' && (
        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
              Text Color & Palette
            </label>
            <div className="flex flex-wrap items-center gap-4 bg-[#FAF6F3] p-4 rounded-xl border border-[#E7DDD2]">
              <input
                type="color"
                value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#2B2625'}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#E7DDD2] cursor-pointer p-0.5 shrink-0 bg-white"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#7C706D]">HEX:</span>
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="#2B2625"
                  className="w-28 px-3 py-2 text-xs font-mono rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] uppercase focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap pl-3 border-l border-[#E7DDD2]">
                <span className="text-xs text-[#7C706D] font-sans mr-1">Curated:</span>
                {COLOR_PALETTE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleChange('color', p.value)}
                    className={`w-7 h-7 rounded-full border shrink-0 transition-transform hover:scale-110 shadow-2xs ${
                      currentColor.toLowerCase() === p.value.toLowerCase()
                        ? 'ring-2 ring-[#C39E96] ring-offset-2 border-black/30'
                        : 'border-black/15'
                    }`}
                    style={{ backgroundColor: p.value }}
                    title={`${p.label} (${p.value})`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Alignment & Spacing */}
      {activeSubTab === 'spacing' && (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Alignment */}
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
                Text Alignment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TEXT_ALIGN_PRESETS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleChange('textAlign', a.id)}
                    className={`py-2.5 px-3 text-xs rounded-xl transition-all text-center border ${
                      currentAlign === a.id
                        ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                        : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
                Line Height
              </label>
              <div className="grid grid-cols-4 gap-2">
                {LINE_HEIGHT_PRESETS.map((lh) => (
                  <button
                    key={lh.id}
                    type="button"
                    onClick={() => handleChange('lineHeight', lh.id)}
                    className={`py-2.5 px-2 text-xs rounded-xl transition-all text-center border ${
                      currentLineHeight === lh.id
                        ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                        : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Letter Spacing */}
          <div>
            <label className="block text-xs font-semibold text-[#2B2625] mb-2 uppercase tracking-wide">
              Letter Spacing (Tracking)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LETTER_SPACING_PRESETS.map((ls) => (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => handleChange('letterSpacing', ls.id)}
                  className={`py-2.5 px-3 text-xs rounded-xl transition-all text-center border ${
                    currentLetterSpacing === ls.id
                      ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold shadow-xs'
                      : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:border-[#2B2625] hover:text-[#2B2625]'
                  }`}
                >
                  {ls.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Reset & Feedback */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E7DDD2]/80 text-xs text-[#7C706D]">
        <span className="flex items-center gap-1.5">
          <HiSparkles className="w-4 h-4 text-[#C39E96]" />
          Changes apply live and persist when you save the section.
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-[#7C706D] hover:text-[#2B2625] font-medium transition-colors cursor-pointer"
        >
          <HiArrowPath className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Standard Collapsible Typography Control
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
    <div className="border border-[#E7DDD2] rounded-xl bg-white overflow-hidden transition-all duration-200 shadow-2xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAF6F3]/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96]">
            <HiPaintBrush className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#2B2625] block">{label}</span>
            {sublabel && <span className="text-xs text-[#7C706D] block mt-0.5 font-sans">{sublabel}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7C706D]">
            {isOpen ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5 text-[#C39E96]" />}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 bg-[#FAF6F3]/30 border-t border-[#E7DDD2]">
          <TypographyPanel
            label={label}
            sublabel={sublabel}
            value={value}
            onChange={onChange}
            defaultColor={defaultColor}
            allowCustomSize={allowCustomSize}
            onDelete={onDelete}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
