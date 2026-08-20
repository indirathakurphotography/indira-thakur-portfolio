'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HiSwatch,
  HiCheck,
  HiArrowPath,
  HiSparkles,
} from 'react-icons/hi2';
import { invalidateThemeSettingsCache } from '@/hooks/useThemeSettings';

export default function AdminThemePage() {
  const [theme, setTheme] = useState<any>({
    primaryColor: '#C39E96',
    secondaryColor: '#A88179',
    accentColor: '#E2C3BC',
    backgroundColor: '#FAF6F3',
    surfaceColor: '#FFFFFF',
    textColor: '#2B2625',
    mutedTextColor: '#7C706D',
    cardBackground: '#FFFFFF',
    cardBorder: '#F4ECE8',
    cardRadius: '0px',
    buttonRadius: '0px',
    buttonStyle: 'filled',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTheme = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/theme', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setTheme((prev: any) => ({ ...prev, ...data }));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch theme settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleChange = (field: string, value: any) => {
    setTheme((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const res = await fetch('/api/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(theme),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save theme settings');
      }

      const updated = await res.json();
      if (updated) setTheme(updated);

      invalidateThemeSettingsCache();
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme-updated', Date.now().toString());
      }
      setSuccess('Theme, typography, and styling settings saved to MongoDB successfully!');
    } catch (err: any) {
      setError(err?.message || 'Error saving theme settings');
    } finally {
      setSaving(false);
    }
  };

  const fontOptions = [
    { label: 'Playfair Display (Default Editorial Serif)', value: 'Playfair Display' },
    { label: 'Cormorant Garamond (Fine Art Classical)', value: 'Cormorant Garamond' },
    { label: 'Cinzel (Luxury Roman Inscription)', value: 'Cinzel' },
    { label: 'Bodoni Moda (High Fashion Editorial)', value: 'Bodoni Moda' },
  ];

  const bodyFontOptions = [
    { label: 'Inter (Clean Modern Sans)', value: 'Inter' },
    { label: 'Plus Jakarta Sans (Refined Geometric Sans)', value: 'Plus Jakarta Sans' },
    { label: 'Outfit (Contemporary Minimalist)', value: 'Outfit' },
    { label: 'Montserrat (Modern Editorial Sans)', value: 'Montserrat' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625]">
              Theme, Typography & Appearance CMS
            </h1>
            <p className="text-xs text-[#7C706D] mt-1">
              Customize website typography, accent color palettes, background tones, and border radii while maintaining the luxury editorial identity.
            </p>
          </div>
          <button
            onClick={fetchTheme}
            className="p-2 text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3] rounded-lg transition-all"
            title="Refresh theme from database"
          >
            <HiArrowPath className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <HiCheck className="w-5 h-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Typography Settings */}
          <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
            <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
              <HiSparkles className="w-5 h-5 text-[#C39E96]" />
              Typography Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Heading Font Family
                </label>
                <select
                  value={theme.headingFont || 'Playfair Display'}
                  onChange={(e) => handleChange('headingFont', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  {fontOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#7C706D] mt-1">Applied to editorial headlines, service titles & hero text.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Body & Subtext Font Family
                </label>
                <select
                  value={theme.bodyFont || 'Inter'}
                  onChange={(e) => handleChange('bodyFont', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  {bodyFontOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#7C706D] mt-1">Applied to paragraph descriptions, navigation links & forms.</p>
              </div>
            </div>
          </div>

          {/* Color Palette & Tones */}
          <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
            <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
              <HiSwatch className="w-5 h-5 text-[#C39E96]" />
              Color Palette & Theme Tones
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Primary Accent Color (Rose Gold)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor || '#C39E96'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded border border-[#E7DDD2] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor || '#C39E96'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor || '#A88179'}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded border border-[#E7DDD2] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor || '#A88179'}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Highlight Accent Tint
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accentColor || '#E2C3BC'}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="w-10 h-10 rounded border border-[#E7DDD2] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.accentColor || '#E2C3BC'}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Page Canvas Background (Warm Ivory)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor || '#FAF6F3'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded border border-[#E7DDD2] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor || '#FAF6F3'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Primary Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.textColor || '#2B2625'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="w-10 h-10 rounded border border-[#E7DDD2] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.textColor || '#2B2625'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Muted Subtext Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.mutedTextColor || '#7C706D'}
                    onChange={(e) => handleChange('mutedTextColor', e.target.value)}
                    className="w-10 h-10 rounded border border-[#E7DDD2] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.mutedTextColor || '#7C706D'}
                    onChange={(e) => handleChange('mutedTextColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Border Radius & Visual Shaping */}
          <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
            <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3">
              Shape & Corner Styling
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Card Corner Radius
                </label>
                <select
                  value={theme.cardRadius || '0px'}
                  onChange={(e) => handleChange('cardRadius', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625]"
                >
                  <option value="0px">Sharp 0px (High Editorial Luxury)</option>
                  <option value="4px">Subtle 4px</option>
                  <option value="8px">Soft 8px</option>
                  <option value="12px">Rounded 12px</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1.5">
                  Button Corner Radius
                </label>
                <select
                  value={theme.buttonRadius || '0px'}
                  onChange={(e) => handleChange('buttonRadius', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625]"
                >
                  <option value="0px">Square 0px (Bespoke Luxury)</option>
                  <option value="2px">Gentle 2px</option>
                  <option value="4px">Subtle 4px</option>
                  <option value="8px">Soft 8px</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-xs flex items-center gap-2"
            >
              {saving ? 'Saving Theme...' : 'Save Theme & Styling'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
