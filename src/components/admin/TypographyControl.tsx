'use client';

import React, { useState } from 'react';
import {
  TypographyConfig,
  FONT_FAMILY_PRESETS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_PRESETS,
  COLOR_PALETTE_PRESETS,
  FontFamilyOption,
  FontSizeOption,
  FontWeightOption,
} from '@/types/typography';
import { HiPaintBrush, HiChevronDown, HiChevronUp, HiArrowPath } from 'react-icons/hi2';

interface TypographyControlProps {
  label: string;
  sublabel?: string;
  value?: TypographyConfig;
  onChange: (newVal: TypographyConfig) => void;
  defaultColor?: string;
  allowCustomSize?: boolean;
}

export default function TypographyControl({
  label,
  sublabel,
  value = {},
  onChange,
  defaultColor = '#2B2625',
  allowCustomSize = true,
}: TypographyControlProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="border border-[#E7DDD2]/70 rounded-xl bg-[#FAF6F3]/40 overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#FAF6F3] transition-colors"
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
          {/* Active Preview Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-[#E7DDD2] text-[10px] text-[#7C706D]">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <span className="capitalize">{currentFamily}</span>
            <span>•</span>
            <span className="capitalize">{currentSize}</span>
          </div>

          <span className="text-xs text-[#7C706D]">
            {isOpen ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expanded Control Panel */}
      {isOpen && (
        <div className="p-4 border-t border-[#E7DDD2]/60 bg-white space-y-4">
          {/* Top Row: Font Family & Font Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Font Family */}
            <div>
              <label className="block text-[11px] font-medium text-[#2B2625] mb-1.5">
                Font Family
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                {FONT_FAMILY_PRESETS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleChange('fontFamily', f.id)}
                    className={`py-1.5 px-2 text-[11px] rounded transition-colors text-center ${
                      currentFamily === f.id
                        ? 'bg-white text-[#2B2625] shadow-2xs font-semibold'
                        : 'text-[#7C706D] hover:text-[#2B2625]'
                    } ${f.previewClass}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Preset */}
            <div>
              <label className="block text-[11px] font-medium text-[#2B2625] mb-1.5">
                Font Size Scale
              </label>
              <div className="grid grid-cols-4 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                {FONT_SIZE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleChange('fontSize', s.id)}
                    className={`py-1.5 text-[10px] rounded transition-colors font-medium text-center ${
                      currentSize === s.id
                        ? 'bg-white text-[#2B2625] shadow-2xs font-semibold'
                        : 'text-[#7C706D] hover:text-[#2B2625]'
                    }`}
                    title={s.desc}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {allowCustomSize && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-[#7C706D] whitespace-nowrap">Custom Size:</span>
                  <input
                    type="text"
                    placeholder="e.g. 1.25rem or 24px"
                    value={
                      !['compact', 'normal', 'large', 'grand', 'default'].includes(currentSize)
                        ? currentSize
                        : ''
                    }
                    onChange={(e) => handleChange('fontSize', e.target.value || 'normal')}
                    className="flex-1 px-2 py-1 text-[10px] font-mono rounded border border-[#E7DDD2] bg-[#FAF6F3] focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Font Weight & Color Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E7DDD2]/40">
            {/* Font Weight */}
            <div>
              <label className="block text-[11px] font-medium text-[#2B2625] mb-1.5">
                Font Weight / Boldness
              </label>
              <div className="grid grid-cols-5 gap-1 bg-[#FAF6F3] p-1 rounded-lg border border-[#E7DDD2]">
                {FONT_WEIGHT_PRESETS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleChange('fontWeight', w.id)}
                    className={`py-1 text-[10px] rounded transition-colors text-center ${
                      currentWeight === w.id
                        ? 'bg-white text-[#2B2625] shadow-2xs font-bold'
                        : 'text-[#7C706D] hover:text-[#2B2625]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker & Swatches */}
            <div>
              <label className="block text-[11px] font-medium text-[#2B2625] mb-1.5">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-8 h-8 rounded border border-[#E7DDD2] cursor-pointer p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-24 px-2 py-1.5 text-xs font-mono rounded border border-[#E7DDD2] bg-[#FAF6F3] text-[#2B2625] uppercase focus:bg-white focus:outline-none"
                />
                <div className="flex items-center gap-1 overflow-x-auto">
                  {COLOR_PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleChange('color', p.value)}
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0 transition-transform hover:scale-110"
                      style={{ backgroundColor: p.value }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Reset Action */}
          <div className="flex items-center justify-between pt-2 text-[10px] text-[#7C706D]">
            <span>Changes preview immediately when applied and saved.</span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 hover:text-[#2B2625] transition-colors"
            >
              <HiArrowPath className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
