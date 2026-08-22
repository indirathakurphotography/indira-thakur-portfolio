'use client';

import React from 'react';
import { GalleryThumbnailSize } from '@/types/gallerySettings';
import { HiAdjustmentsHorizontal, HiEye } from 'react-icons/hi2';

export interface GalleryThumbnailControlProps {
  value?: GalleryThumbnailSize;
  customValue?: number;
  onChangePreset: (preset: GalleryThumbnailSize) => void;
  onChangeCustom: (px: number) => void;
  className?: string;
}

const PRESETS: { id: GalleryThumbnailSize; label: string; desc: string; pxEquivalent: number }[] = [
  { id: 'small', label: 'Small', desc: 'Dense multi-column overview', pxEquivalent: 220 },
  { id: 'compact', label: 'Compact', desc: 'Editorial catalog view', pxEquivalent: 270 },
  { id: 'normal', label: 'Standard', desc: 'Balanced luxury gallery scale', pxEquivalent: 340 },
  { id: 'large', label: 'Large', desc: 'Impactful editorial showcase', pxEquivalent: 440 },
  { id: 'extra-large', label: 'XL', desc: 'Spacious exhibition hero size', pxEquivalent: 560 },
  { id: 'custom', label: 'Custom', desc: 'Precise pixel width definition', pxEquivalent: 380 },
];

export default function GalleryThumbnailControl({
  value = 'normal',
  customValue = 340,
  onChangePreset,
  onChangeCustom,
  className = '',
}: GalleryThumbnailControlProps) {
  const isCustom = value === 'custom';
  const effectiveWidth = isCustom ? customValue : (PRESETS.find(p => p.id === value)?.pxEquivalent || 340);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-1">
        <label className="block text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
          Gallery Thumbnail Size & Column Scale
        </label>
        <p className="text-xs text-[#7C706D] font-sans">
          Select standard editorial presets or define custom pixel dimensions. This directly controls thumbnail sizing in the live public gallery.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {PRESETS.map((preset) => {
          const isSelected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChangePreset(preset.id)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-[#2B2625] text-white border-[#2B2625] shadow-xs'
                  : 'bg-white text-[#2B2625] border-[#E7DDD2] hover:border-[#2B2625]/60 hover:bg-[#FAF6F3]'
              }`}
            >
              <span className="font-serif text-sm font-medium">{preset.label}</span>
              <span
                className={`text-[10px] font-mono ${
                  isSelected ? 'text-[#C39E96]' : 'text-[#7C706D]'
                }`}
              >
                {preset.id === 'custom' ? `${customValue}px` : `${preset.pxEquivalent}px`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Slider and Numeric Input (Shown when Custom is selected or always available for fine tuning) */}
      {isCustom && (
        <div className="bg-[#FAF6F3] p-5 rounded-xl border border-[#E7DDD2] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2B2625] font-sans">
              Custom Thumbnail Width:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={150}
                max={800}
                step={10}
                value={customValue}
                onChange={(e) => onChangeCustom(Number(e.target.value) || 340)}
                className="w-20 px-2.5 py-1 text-xs font-mono rounded-lg border border-[#E7DDD2] bg-white text-[#2B2625] text-right font-semibold focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
              />
              <span className="text-xs font-mono text-[#7C706D]">px</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#7C706D]">
              <span>150px (Compact)</span>
              <span className="font-semibold text-[#2B2625]">{customValue}px</span>
              <span>800px (Exhibition)</span>
            </div>
            <input
              type="range"
              min={150}
              max={800}
              step={10}
              value={customValue}
              onChange={(e) => onChangeCustom(Number(e.target.value))}
              className="w-full accent-[#2B2625] cursor-pointer h-1.5 bg-[#E7DDD2] rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Live Scale Preview Box */}
      <div className="bg-white p-5 rounded-xl border border-[#E7DDD2] space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7C706D] uppercase">
          <span className="flex items-center gap-1.5 font-semibold text-[#2B2625]">
            <HiEye className="w-4 h-4 text-[#C39E96]" />
            Scale Preview
          </span>
          <span>Width: ~{effectiveWidth}px</span>
        </div>

        <div className="p-4 bg-[#FAF6F3] rounded-lg border border-[#E7DDD2] flex items-center justify-center overflow-hidden min-h-[160px]">
          <div
            className="transition-all duration-300 bg-white rounded-lg border border-[#E7DDD2] shadow-xs overflow-hidden flex flex-col items-center justify-center p-3 text-center"
            style={{
              width: `${Math.min(360, Math.max(120, effectiveWidth * 0.55))}px`,
              aspectRatio: '4/5',
            }}
          >
            <div className="w-8 h-8 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96] mb-2">
              <HiAdjustmentsHorizontal className="w-4 h-4" />
            </div>
            <span className="font-serif text-xs font-medium text-[#2B2625]">
              Sample Frame
            </span>
            <span className="text-[10px] font-mono text-[#7C706D] mt-0.5">
              {effectiveWidth}px scale
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
