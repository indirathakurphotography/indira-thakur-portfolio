'use client';

import React, { useState } from 'react';
import {
  TypographyConfig,
  FONT_FAMILY_PRESETS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_PRESETS,
  COLOR_PALETTE_PRESETS,
} from '@/types/typography';
import { HiPaintBrush, HiChevronDown, HiChevronUp, HiArrowPath, HiSparkles } from 'react-icons/hi2';

export interface TypographyControlProps {
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (newVal: TypographyConfig) => void;
  defaultColor?: string;
  allowCustomSize?: boolean;
}

export interface TypographyElementOption {
  id: string;
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (val: TypographyConfig) => void;
  defaultColor?: string;
}

export interface SectionTypographyManagerProps {
  title?: string;
  description?: string;
  elements: TypographyElementOption[];
  defaultSelectedId?: string;
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
}: TypographyControlProps) {
  const currentFamily = value.fontFamily || 'default';
  const currentSize = value.fontSize || 'normal';
  const currentWeight = value.fontWeight || '400';
  const currentColor = value.color || defaultColor;

  const handleChange = (field: keyof TypographyConfig, val: any) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      fontFamily: 'default',
      fontSize: 'normal',
      fontWeight: '400',
      color: defaultColor,
    });
  };

  return (
    <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E7DDD2] shadow-2xs">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7DDD2]/70">
        <div>
          <span className="text-xs font-bold text-[#2B2625] uppercase tracking-wider block">
            {label}
          </span>
          {sublabel && <span className="text-[11px] text-[#7C706D] block mt-0.5">{sublabel}</span>}
        </div>

        {/* Live Preview Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] text-[11px] text-[#2B2625] self-start sm:self-auto">
          <span
            className="w-3 h-3 rounded-full border border-black/15 shrink-0 shadow-2xs"
            style={{ backgroundColor: currentColor }}
          />
          <span className="font-medium capitalize">{currentFamily}</span>
          <span className="text-[#A88179]">•</span>
          <span className="font-medium capitalize">{currentSize}</span>
          <span className="text-[#A88179]">•</span>
          <span className="font-medium">{currentWeight}</span>
        </div>
      </div>

      {/* Row 1: Font Family & Font Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Font Family */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            Font Family / Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
            {FONT_FAMILY_PRESETS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleChange('fontFamily', f.id)}
                className={`py-1.5 px-2 text-[11px] rounded transition-all text-center ${
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

        {/* Font Size Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-[#2B2625] uppercase tracking-wide">
              Font Size
            </label>
            <span className="text-[10px] text-[#A88179] font-mono capitalize">
              Active: {currentSize}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
            {FONT_SIZE_PRESETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleChange('fontSize', s.id)}
                className={`py-1.5 text-[10px] rounded transition-all font-medium text-center ${
                  currentSize === s.id
                    ? 'bg-white text-[#2B2625] shadow-xs font-bold border border-[#E7DDD2]'
                    : 'text-[#7C706D] hover:text-[#2B2625] hover:bg-white/60'
                }`}
                title={s.desc}
              >
                {s.label}
              </button>
            ))}
          </div>

          {allowCustomSize && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-[#7C706D] font-medium whitespace-nowrap">
                Custom Size:
              </span>
              <input
                type="text"
                placeholder="e.g. 1.25rem, 24px, 3rem"
                value={
                  !['compact', 'normal', 'large', 'huge', 'grand', 'hero', 'default'].includes(
                    currentSize
                  )
                    ? currentSize
                    : ''
                }
                onChange={(e) => handleChange('fontSize', e.target.value || 'normal')}
                className="flex-1 px-2.5 py-1 text-[11px] font-mono rounded border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Font Weight & Text Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E7DDD2]/60">
        {/* Font Weight */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            Font Weight / Bold
          </label>
          <div className="grid grid-cols-5 gap-1 bg-[#FAF6F3] p-1.5 rounded-lg border border-[#E7DDD2]">
            {FONT_WEIGHT_PRESETS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleChange('fontWeight', w.id)}
                className={`py-1 text-[10px] rounded transition-all text-center ${
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

        {/* Text Color */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2B2625] mb-1.5 uppercase tracking-wide">
            Text Color
          </label>
          <div className="flex items-center gap-2">
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
              className="w-24 px-2 py-1 text-xs font-mono rounded border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
            />
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {COLOR_PALETTE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange('color', p.value)}
                  className="w-5 h-5 rounded-full border border-black/15 shrink-0 transition-transform hover:scale-115 shadow-2xs"
                  style={{ backgroundColor: p.value }}
                  title={p.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Reset Action */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E7DDD2]/40 text-[10px] text-[#7C706D]">
        <span className="flex items-center gap-1">
          <HiSparkles className="w-3 h-3 text-[#C39E96]" />
          Changes apply instantly and save with section configuration.
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-[#7C706D] hover:text-[#2B2625] font-medium transition-colors cursor-pointer"
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
 * Groups all text elements for a given section into a single clean dropdown selector
 */
export function SectionTypographyManager({
  title = 'Typography & Text Styling',
  description = 'Select an individual text element from the dropdown below to customize its font size, font family, font weight, and text color independently.',
  elements,
  defaultSelectedId,
}: SectionTypographyManagerProps) {
  const [selectedId, setSelectedId] = useState<string>(
    defaultSelectedId || (elements.length > 0 ? elements[0].id : '')
  );

  if (!elements || elements.length === 0) return null;

  const currentElement = elements.find((el) => el.id === selectedId) || elements[0];

  return (
    <div className="pt-5 border-t border-[#E7DDD2]/80 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
      </div>

      {/* Centralized Element Selector Dropdown & Quick-Tab Bar */}
      <div className="bg-[#FAF6F3]/80 p-3 rounded-xl border border-[#E7DDD2] space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-[11px] font-semibold text-[#2B2625] uppercase tracking-wide flex items-center gap-1.5">
            <span>Select Text Element:</span>
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
              Boolean(el.value?.fontFamily && el.value.fontFamily !== 'default') ||
              Boolean(el.value?.color && el.value.color !== el.defaultColor) ||
              Boolean(el.value?.fontWeight && el.value.fontWeight !== '400');

            return (
              <button
                key={el.id}
                type="button"
                onClick={() => setSelectedId(el.id)}
                className={`px-2.5 py-1 text-[10px] rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
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
          />
        </div>
      )}
    </div>
  );
}
