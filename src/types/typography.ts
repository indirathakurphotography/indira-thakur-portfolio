import type React from 'react';

export type FontFamilyOption = 'default' | 'serif' | 'sans' | 'cormorant' | 'playfair' | 'mono';
export type FontSizeOption =
  | 'tiny'
  | 'compact'
  | 'normal'
  | 'large'
  | 'grand'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | 'display'
  | 'huge'
  | 'inherit';
export type FontWeightOption =
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'inherit';

export interface TypographyConfig {
  fontSize?: FontSizeOption | string;
  fontFamily?: FontFamilyOption | string;
  fontWeight?: FontWeightOption | string;
  color?: string;
}

export interface TypographyOptions {
  defaultFamily?: FontFamilyOption | string;
  defaultSize?: FontSizeOption | string;
  defaultWeight?: FontWeightOption | string;
  defaultColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
}

export interface TypographyResult extends React.CSSProperties {
  className: string;
  style: React.CSSProperties;
}

export const FONT_FAMILY_PRESETS: { id: FontFamilyOption; label: string; previewClass: string }[] = [
  { id: 'default', label: 'Theme Default', previewClass: '' },
  { id: 'serif', label: 'Editorial Serif', previewClass: 'font-serif' },
  { id: 'sans', label: 'Clean Sans', previewClass: 'font-sans' },
  { id: 'cormorant', label: 'Cormorant', previewClass: 'font-serif italic' },
  { id: 'playfair', label: 'Playfair', previewClass: 'font-serif' },
  { id: 'mono', label: 'Technical Mono', previewClass: 'font-mono' },
];

export const FONT_SIZE_PRESETS: { id: FontSizeOption; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: 'Smaller scale' },
  { id: 'normal', label: 'Standard', desc: 'Default balanced scale' },
  { id: 'large', label: 'Large', desc: 'High visual impact' },
  { id: 'grand', label: 'Grand Display', desc: 'Maximum luxury scale' },
];

export const FONT_WEIGHT_PRESETS: { id: FontWeightOption; label: string }[] = [
  { id: '300', label: 'Light' },
  { id: '400', label: 'Regular' },
  { id: '500', label: 'Medium' },
  { id: '600', label: 'Semibold' },
  { id: '700', label: 'Bold' },
];

export const COLOR_PALETTE_PRESETS = [
  { label: 'Deep Charcoal', value: '#2B2625' },
  { label: 'Warm Muted Gray', value: '#7C706D' },
  { label: 'Rose Gold Accent', value: '#C39E96' },
  { label: 'Terracotta', value: '#A88179' },
  { label: 'Soft Ivory', value: '#FAF6F3' },
  { label: 'Pure White', value: '#FFFFFF' },
];

export function getFontFamilyCss(family?: string): string | undefined {
  if (!family || family === 'default' || family === 'inherit') return undefined;
  switch (family) {
    case 'serif':
      return "'Playfair Display', Georgia, serif";
    case 'sans':
      return "'Inter', system-ui, sans-serif";
    case 'cormorant':
      return "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
    case 'playfair':
      return "'Playfair Display', Georgia, serif";
    case 'mono':
      return "'DM Mono', monospace";
    default:
      return family;
  }
}

export function getFontWeightCss(weight?: string): string | number | undefined {
  if (!weight || weight === 'inherit' || weight === 'default') return undefined;
  switch (weight) {
    case 'light':
    case '300':
      return 300;
    case 'normal':
    case 'regular':
    case '400':
      return 400;
    case 'medium':
    case '500':
      return 500;
    case 'semibold':
    case '600':
      return 600;
    case 'bold':
    case '700':
      return 700;
    default:
      return weight;
  }
}

export function getFontSizeClass(size?: string, defaultClass: string = ''): string {
  if (!size || size === 'inherit' || size === 'default' || size === 'normal') return defaultClass;
  switch (size) {
    case 'tiny':
    case 'xs':
      return 'text-[10px] sm:text-xs';
    case 'compact':
    case 'sm':
      return 'text-xs sm:text-sm md:text-base';
    case 'base':
      return 'text-sm sm:text-base md:text-lg';
    case 'lg':
      return 'text-base sm:text-lg md:text-xl';
    case 'xl':
      return 'text-lg sm:text-xl md:text-2xl';
    case 'large':
    case 'huge':
    case '2xl':
      return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
    case '3xl':
      return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
    case '4xl':
      return 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl';
    case '5xl':
      return 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl';
    case 'grand':
    case 'display':
    case '6xl':
      return 'text-4xl sm:text-7xl md:text-8xl lg:text-9xl';
    default:
      return defaultClass;
  }
}

export function getTypographyStyles(
  typography?: TypographyConfig,
  fallback?: TypographyOptions
): TypographyResult {
  const styles: React.CSSProperties = {};
  const classList: string[] = [];

  const effectiveColor = typography?.color || fallback?.defaultColor || fallback?.color;
  if (effectiveColor) {
    styles.color = effectiveColor;
  }

  const effectiveFamily = typography?.fontFamily || fallback?.defaultFamily || fallback?.fontFamily;
  if (effectiveFamily && effectiveFamily !== 'default' && effectiveFamily !== 'inherit') {
    if (effectiveFamily === 'serif') classList.push('font-serif');
    else if (effectiveFamily === 'sans') classList.push('font-sans');
    else if (effectiveFamily === 'mono') classList.push('font-mono');
    else {
      const familyCss = getFontFamilyCss(effectiveFamily);
      if (familyCss) styles.fontFamily = familyCss;
    }
  }

  const effectiveWeight = typography?.fontWeight || fallback?.defaultWeight || fallback?.fontWeight;
  if (effectiveWeight && effectiveWeight !== 'inherit' && effectiveWeight !== 'default') {
    if (effectiveWeight === '300' || effectiveWeight === 'light') classList.push('font-light');
    else if (effectiveWeight === '400' || effectiveWeight === 'normal' || effectiveWeight === 'regular') classList.push('font-normal');
    else if (effectiveWeight === '500' || effectiveWeight === 'medium') classList.push('font-medium');
    else if (effectiveWeight === '600' || effectiveWeight === 'semibold') classList.push('font-semibold');
    else if (effectiveWeight === '700' || effectiveWeight === 'bold') classList.push('font-bold');
    else {
      const weightCss = getFontWeightCss(effectiveWeight);
      if (weightCss !== undefined) styles.fontWeight = weightCss;
    }
  }

  const effectiveSize = typography?.fontSize || fallback?.defaultSize;
  if (effectiveSize) {
    const sizeClass = getFontSizeClass(effectiveSize, '');
    if (sizeClass) {
      classList.push(sizeClass);
    } else if (
      !['default', 'inherit', 'normal', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', 'compact', 'large', 'huge', 'grand', 'display', 'tiny'].includes(
        effectiveSize
      )
    ) {
      styles.fontSize = effectiveSize;
    }
  }

  const className = classList.join(' ').trim();

  return {
    ...styles,
    className,
    style: styles,
  };
}

