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
  HiEye,
  HiPlus,
  HiTrash,
  HiCheck,
  HiXMark,
  HiArrowPath,
  HiSparkles,
  HiAdjustmentsHorizontal,
} from 'react-icons/hi2';

export interface TypographyElementDef {
  id: string;
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (val: TypographyConfig) => void;
  defaultColor?: string;
  sampleText?: string;
  isCustom?: boolean;
  onDelete?: () => void;
}

export interface FocusedTypographyManagerProps {
  title?: string;
  description?: string;
  elements: TypographyElementDef[];
  onAddCustomElement?: (id: string, label: string) => void;
  className?: string;
}

export default function FocusedTypographyManager({
  title = 'Typography & Text Styling',
  description = 'Choose a text element below to open its dedicated styling controls. Modify font family, size, weight, color, alignment, and spacing.',
  elements,
  onAddCustomElement,
  className = '',
}: FocusedTypographyManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  const activeElement = elements.find((el) => el.id === selectedId);

  const handleAddCustom = () => {
    if (!customLabel.trim() || !onAddCustomElement) return;
    const cleanId = `custom_${customLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    onAddCustomElement(cleanId, customLabel.trim());
    setSelectedId(cleanId);
    setCustomLabel('');
    setIsAddingCustom(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Add Custom Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DDD2]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96]">
              <HiPaintBrush className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg text-[#2B2625] font-semibold">
              {title}
            </h3>
          </div>
          <p className="text-xs text-[#7C706D] font-sans max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {onAddCustomElement && (
          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans font-medium uppercase tracking-wider text-[#2B2625] hover:text-[#C39E96] bg-[#FAF6F3] hover:bg-[#F3ECE6] border border-[#E7DDD2] rounded-lg transition-colors shrink-0"
          >
            <HiPlus className="w-4 h-4 text-[#C39E96]" />
            <span>{isAddingCustom ? 'Cancel' : '+ Custom Text Element'}</span>
          </button>
        )}
      </div>

      {/* Add Custom Text Element Bar */}
      {isAddingCustom && (
        <div className="bg-[#FAF6F3] p-4 rounded-xl border border-[#E7DDD2] flex items-center gap-3">
          <input
            type="text"
            placeholder="e.g. Hero Tagline, Philosophy Quote, Story Intro..."
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
            }}
            className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customLabel.trim()}
            className="px-4 py-2 bg-[#2B2625] text-white text-xs font-medium uppercase tracking-wider rounded-lg disabled:opacity-40 hover:bg-[#1C1817] transition-colors"
          >
            Create Element
          </button>
        </div>
      )}

      {/* Selectable Text Elements Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-mono uppercase tracking-wider text-[#7C706D]">
          Select element to style:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {elements.map((el) => {
            const isSelected = el.id === selectedId;
            const fontFam = el.value?.fontFamily || 'default';
            const sizeStr = el.value?.customFontSize
              ? `${el.value.customFontSize}px`
              : el.value?.fontSize || 'normal';
            const weightStr = el.value?.fontWeight ? `w${el.value.fontWeight}` : 'w400';
            const colorStr = el.value?.color || el.defaultColor || '#2B2625';
            const roleStr = el.value?.elementType || 'text';

            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(isSelected ? null : el.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#FAF6F3] border-[#2B2625] ring-2 ring-[#2B2625] shadow-xs'
                    : 'bg-white border-[#E7DDD2] hover:border-[#2B2625]/60 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-sm font-semibold text-[#2B2625] truncate">
                      {el.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        isSelected
                          ? 'bg-[#2B2625] text-white'
                          : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2]'
                      }`}
                    >
                      {roleStr}
                    </span>
                  </div>
                  {el.sublabel && (
                    <p className="text-[11px] text-[#7C706D] mt-1 font-sans line-clamp-2 leading-relaxed">
                      {el.sublabel}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#E7DDD2]/70 flex items-center justify-between text-[11px] font-mono text-[#7C706D]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="capitalize">{fontFam}</span>
                    <span>•</span>
                    <span>{sizeStr}</span>
                    <span>•</span>
                    <span>{weightStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shadow-2xs"
                      style={{ backgroundColor: colorStr }}
                    />
                    <span className="text-[10px] uppercase font-mono">{colorStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SINGLE FOCUSED TYPOGRAPHY EDITOR PANEL */}
      {activeElement && (
        <FocusedEditorModal
          element={activeElement}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

interface FocusedEditorModalProps {
  element: TypographyElementDef;
  onClose: () => void;
}

function FocusedEditorModal({ element, onClose }: FocusedEditorModalProps) {
  const value = element.value || {};
  const defaultColor = element.defaultColor || '#2B2625';

  const [currentRole, setCurrentRole] = useState<string>(value.elementType || 'heading');
  const [currentFamily, setCurrentFamily] = useState<string>(value.fontFamily || 'default');
  const [currentSize, setCurrentSize] = useState<string>(value.fontSize || 'normal');
  const [customSize, setCustomSize] = useState<string>(
    value.customFontSize !== undefined ? String(value.customFontSize) : ''
  );
  const [currentWeight, setCurrentWeight] = useState<string>(
    value.fontWeight ? String(value.fontWeight) : '400'
  );
  const [currentColor, setCurrentColor] = useState<string>(value.color || defaultColor);
  const [currentStyle, setCurrentStyle] = useState<string>(value.textStyle || 'normal');
  const [currentAlign, setCurrentAlign] = useState<string>(value.textAlign || 'left');
  const [currentLineHeight, setCurrentLineHeight] = useState<string>(value.lineHeight || 'normal');
  const [currentLetterSpacing, setCurrentLetterSpacing] = useState<string>(
    value.letterSpacing || 'normal'
  );

  const [sampleText, setSampleText] = useState(
    element.sampleText ||
      (currentRole === 'heading'
        ? element.label || 'Fine Art Photography'
        : currentRole === 'label'
        ? 'EDITORIAL COLLECTION'
        : currentRole === 'quote'
        ? '"Photography is the art of preserving human emotion."'
        : 'Capturing timeless memories and family legacies with museum-grade craftsmanship.')
  );

  const liveConfig: TypographyConfig = {
    elementType: currentRole,
    fontFamily: currentFamily,
    fontSize: currentSize,
    customFontSize: customSize ? Number(customSize) : undefined,
    fontWeight: currentWeight,
    color: currentColor,
    textStyle: currentStyle,
    textAlign: currentAlign,
    lineHeight: currentLineHeight as any,
    letterSpacing: currentLetterSpacing as any,
  };

  const liveStyles = getTypographyStyles(liveConfig, {
    defaultColor,
    defaultFamily: 'default',
    defaultSize: 'normal',
    defaultWeight: '400',
  });

  const handleApply = () => {
    element.onChange(liveConfig);
    onClose();
  };

  const handleApplyLive = (updated: Partial<TypographyConfig>) => {
    const next: TypographyConfig = {
      ...liveConfig,
      ...updated,
    };
    element.onChange(next);
  };

  const handleReset = () => {
    const resetConfig: TypographyConfig = {
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
    };
    setCurrentRole('body');
    setCurrentFamily('default');
    setCurrentSize('normal');
    setCustomSize('');
    setCurrentWeight('400');
    setCurrentColor(defaultColor);
    setCurrentStyle('normal');
    setCurrentAlign('left');
    setCurrentLineHeight('normal');
    setCurrentLetterSpacing('normal');
    element.onChange(resetConfig);
  };

  return (
    <div className="bg-[#FAF6F3] rounded-2xl border-2 border-[#2B2625] p-6 sm:p-8 space-y-6 shadow-md transition-all">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DDD2]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#2B2625] text-white font-semibold">
              Editing
            </span>
            <h4 className="font-serif text-xl text-[#2B2625] font-semibold">
              {element.label}
            </h4>
          </div>
          {element.sublabel && (
            <p className="text-xs text-[#7C706D] mt-0.5 font-sans">{element.sublabel}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {element.isCustom && element.onDelete && (
            <button
              type="button"
              onClick={element.onDelete}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              <HiTrash className="w-3.5 h-3.5" />
              <span>Delete Element</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7C706D] hover:text-[#2B2625] rounded-lg hover:bg-white border border-[#E7DDD2] transition-colors cursor-pointer"
            title="Close editor"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="bg-white p-5 rounded-xl border border-[#E7DDD2] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7C706D] uppercase">
          <span className="flex items-center gap-1.5 font-semibold text-[#2B2625]">
            <HiEye className="w-4 h-4 text-[#C39E96]" />
            Live Preview
          </span>
          <span className="text-xs font-mono lowercase text-[#7C706D]">
            Editable preview text below
          </span>
        </div>
        <div className="p-4 bg-[#FAF6F3]/50 rounded-lg border border-[#E7DDD2]/70 min-h-[90px] flex items-center justify-center overflow-x-auto">
          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className={`w-full text-center bg-transparent border-none focus:outline-none ${liveStyles.className}`}
            style={liveStyles.style}
          />
        </div>
      </div>

      {/* Focused Controls Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-white p-6 rounded-xl border border-[#E7DDD2]">
        {/* ROLE */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Role
          </label>
          <select
            value={currentRole}
            onChange={(e) => {
              setCurrentRole(e.target.value);
              handleApplyLive({ elementType: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          >
            {ELEMENT_TYPE_PRESETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.desc})
              </option>
            ))}
          </select>
        </div>

        {/* FONT FAMILY */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Font Family
          </label>
          <select
            value={currentFamily}
            onChange={(e) => {
              setCurrentFamily(e.target.value);
              handleApplyLive({ fontFamily: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          >
            {FONT_FAMILY_PRESETS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* FONT SIZE & PIXELS */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Font Size
          </label>
          <div className="flex items-center gap-2">
            <select
              value={currentSize}
              onChange={(e) => {
                setCurrentSize(e.target.value);
                setCustomSize('');
                handleApplyLive({ fontSize: e.target.value, customFontSize: undefined });
              }}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            >
              {FONT_SIZE_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.pxEquivalent})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 w-24">
              <input
                type="number"
                placeholder="px"
                value={customSize}
                onChange={(e) => {
                  setCustomSize(e.target.value);
                  handleApplyLive({
                    customFontSize: e.target.value ? Number(e.target.value) : undefined,
                  });
                }}
                className="w-full px-2 py-2 text-xs font-mono rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
              <span className="text-[10px] font-mono text-[#7C706D]">px</span>
            </div>
          </div>
        </div>

        {/* FONT WEIGHT */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Weight
          </label>
          <select
            value={currentWeight}
            onChange={(e) => {
              setCurrentWeight(e.target.value);
              handleApplyLive({ fontWeight: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          >
            {FONT_WEIGHT_PRESETS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {/* COLOR PICKER & HEX */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                handleApplyLive({ color: e.target.value });
              }}
              className="w-9 h-9 rounded-lg border border-[#E7DDD2] cursor-pointer p-0.5 bg-[#FAF6F3]"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                handleApplyLive({ color: e.target.value });
              }}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] uppercase focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
          </div>
        </div>

        {/* STYLE (Normal, Italic, Underline) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Style
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {TEXT_STYLE_PRESETS.filter((s) => s.id !== 'italic-underline').map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentStyle(s.id);
                  handleApplyLive({ textStyle: s.id });
                }}
                className={`py-2 text-xs rounded-lg font-sans transition-all border ${
                  currentStyle === s.id
                    ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold'
                    : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:text-[#2B2625]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ALIGNMENT */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Alignment
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {TEXT_ALIGN_PRESETS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setCurrentAlign(a.id);
                  handleApplyLive({ textAlign: a.id });
                }}
                className={`py-2 text-xs rounded-lg font-sans transition-all border ${
                  currentAlign === a.id
                    ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold'
                    : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:text-[#2B2625]'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* LINE HEIGHT */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Line Height
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {LINE_HEIGHT_PRESETS.filter((lh) => lh.id !== 'loose').map((lh) => (
              <button
                key={lh.id}
                type="button"
                onClick={() => {
                  setCurrentLineHeight(lh.id);
                  handleApplyLive({ lineHeight: lh.id as any });
                }}
                className={`py-2 text-xs rounded-lg font-sans transition-all border ${
                  currentLineHeight === lh.id
                    ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold'
                    : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:text-[#2B2625]'
                }`}
              >
                {lh.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* LETTER SPACING */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
            Letter Spacing
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {LETTER_SPACING_PRESETS.filter((ls) => ls.id !== 'widest').map((ls) => (
              <button
                key={ls.id}
                type="button"
                onClick={() => {
                  setCurrentLetterSpacing(ls.id);
                  handleApplyLive({ letterSpacing: ls.id as any });
                }}
                className={`py-2 text-xs rounded-lg font-sans transition-all border ${
                  currentLetterSpacing === ls.id
                    ? 'bg-[#2B2625] text-white border-[#2B2625] font-semibold'
                    : 'bg-[#FAF6F3] text-[#7C706D] border-[#E7DDD2] hover:text-[#2B2625]'
                }`}
              >
                {ls.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Palette presets row */}
      <div className="flex items-center gap-2 flex-wrap bg-white p-3.5 rounded-xl border border-[#E7DDD2]">
        <span className="text-xs text-[#7C706D] font-mono mr-2">Curated Colors:</span>
        {COLOR_PALETTE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              setCurrentColor(p.value);
              handleApplyLive({ color: p.value });
            }}
            className={`w-6 h-6 rounded-full border shrink-0 transition-transform hover:scale-110 shadow-2xs ${
              currentColor.toLowerCase() === p.value.toLowerCase()
                ? 'ring-2 ring-[#2B2625] ring-offset-2 border-black/30'
                : 'border-black/15'
            }`}
            style={{ backgroundColor: p.value }}
            title={`${p.label} (${p.value})`}
          />
        ))}
      </div>

      {/* Action Buttons: [ Apply ] [ Reset ] */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-medium text-[#7C706D] hover:text-[#2B2625] bg-white hover:bg-[#F3ECE6] border border-[#E7DDD2] rounded-lg transition-colors cursor-pointer"
        >
          <HiArrowPath className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-sans text-[#7C706D] hover:text-[#2B2625] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2B2625] hover:bg-[#1C1817] text-white text-xs font-medium uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <HiCheck className="w-4 h-4 text-[#C39E96]" />
            <span>Apply Style</span>
          </button>
        </div>
      </div>
    </div>
  );
}
