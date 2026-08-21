import type React from 'react';

export type ElementTypeOption =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'caption'
  | 'label'
  | 'quote'
  | 'button'
  | 'custom';

export type FontFamilyOption =
  | 'default'
  | 'serif'
  | 'sans'
  | 'cormorant'
  | 'playfair'
  | 'montserrat'
  | 'great-vibes'
  | 'mono'
  | string;

export type FontSizeOption =
  | 'default'
  | 'small'
  | 'compact'
  | 'normal'
  | 'large'
  | 'xl'
  | 'huge'
  | 'grand'
  | 'hero'
  | 'tiny'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | 'display'
  | 'inherit'
  | string;

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
  | 'inherit'
  | string;

export type TextStyleOption = 'normal' | 'italic' | 'underline' | 'italic-underline' | string;

export type TextAlignOption = 'left' | 'center' | 'right' | 'justify' | 'inherit' | string;

export type LineHeightOption = 'tight' | 'normal' | 'relaxed' | 'loose' | string;

export type LetterSpacingOption = 'tight' | 'normal' | 'wide' | 'widest' | string;

export interface TypographyConfig {
  elementType?: ElementTypeOption | string;
  fontSize?: FontSizeOption | string;
  customFontSize?: string | number;
  fontFamily?: FontFamilyOption | string;
  fontWeight?: FontWeightOption | string;
  color?: string;
  textStyle?: TextStyleOption | string;
  textAlign?: TextAlignOption | string;
  lineHeight?: LineHeightOption;
  letterSpacing?: LetterSpacingOption;
}

export interface TypographyOptions {
  defaultFamily?: FontFamilyOption | string;
  defaultSize?: FontSizeOption | string;
  defaultWeight?: FontWeightOption | string;
  defaultColor?: string;
  defaultStyle?: TextStyleOption | string;
  defaultAlign?: TextAlignOption | string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
}

export interface TypographyResult extends React.CSSProperties {
  className: string;
  style: React.CSSProperties;
}

export const ELEMENT_TYPE_PRESETS: { id: ElementTypeOption; label: string; desc: string }[] = [
  { id: 'heading', label: 'Heading', desc: 'Main section title / primary headline' },
  { id: 'subheading', label: 'Subheading', desc: 'Secondary title / section subtitle' },
  { id: 'body', label: 'Body', desc: 'Standard paragraph & editorial prose' },
  { id: 'caption', label: 'Caption', desc: 'Detail footnote / image caption' },
  { id: 'label', label: 'Label / Eyebrow', desc: 'Uppercase tag or category label' },
  { id: 'quote', label: 'Quote', desc: 'Testimonial quote or philosophy callout' },
  { id: 'button', label: 'Button / Link', desc: 'Interactive call to action' },
];

export const FONT_FAMILY_PRESETS: { id: string; label: string; previewClass: string; fontCss: string }[] = [
  { id: 'default', label: 'Default Site Font', previewClass: '', fontCss: 'inherit' },
  { id: 'serif', label: 'Editorial Serif', previewClass: 'font-serif', fontCss: "'Playfair Display', Georgia, serif" },
  { id: 'playfair', label: 'Playfair Display', previewClass: 'font-serif', fontCss: "'Playfair Display', Georgia, serif" },
  { id: 'cormorant', label: 'Cormorant Garamond', previewClass: 'font-serif italic', fontCss: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" },
  { id: 'sans', label: 'Clean Sans', previewClass: 'font-sans', fontCss: "'Inter', system-ui, sans-serif" },
  { id: 'montserrat', label: 'Montserrat', previewClass: 'font-sans tracking-wide', fontCss: "'Montserrat', 'Inter', system-ui, sans-serif" },
  { id: 'great-vibes', label: 'Great Vibes (Script)', previewClass: 'font-serif italic', fontCss: "'Great Vibes', cursive, 'Playfair Display', Georgia, serif" },
  { id: 'mono', label: 'Technical Mono', previewClass: 'font-mono', fontCss: "'DM Mono', monospace" },
];

export const FONT_SIZE_PRESETS: { id: string; label: string; desc: string; pxEquivalent: string }[] = [
  { id: 'small', label: 'Small', desc: 'Subtle meta/tag (13px)', pxEquivalent: '13px' },
  { id: 'compact', label: 'Compact', desc: 'Secondary body (14px)', pxEquivalent: '14px' },
  { id: 'normal', label: 'Normal', desc: 'Standard readable (16px)', pxEquivalent: '16px' },
  { id: 'large', label: 'Large', desc: 'Lead body / Subhead (20px)', pxEquivalent: '20px' },
  { id: 'xl', label: 'XL', desc: 'Secondary title (28px)', pxEquivalent: '28px' },
  { id: 'huge', label: 'Huge', desc: 'Major heading (38px)', pxEquivalent: '38px' },
  { id: 'grand', label: 'Grand', desc: 'Editorial display (48px)', pxEquivalent: '48px' },
  { id: 'hero', label: 'Hero', desc: 'Billboard display (64px)', pxEquivalent: '64px' },
];

export const FONT_WEIGHT_PRESETS: { id: string; label: string; weightVal: number }[] = [
  { id: '300', label: 'Light 300', weightVal: 300 },
  { id: '400', label: 'Regular 400', weightVal: 400 },
  { id: '500', label: 'Medium 500', weightVal: 500 },
  { id: '600', label: 'Semi-Bold 600', weightVal: 600 },
  { id: '700', label: 'Bold 700', weightVal: 700 },
];

export const TEXT_STYLE_PRESETS: { id: TextStyleOption; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'italic', label: 'Italic' },
  { id: 'underline', label: 'Underline' },
  { id: 'italic-underline', label: 'Italic + Underline' },
];

export const TEXT_ALIGN_PRESETS: { id: TextAlignOption; label: string }[] = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
];

export const LINE_HEIGHT_PRESETS: { id: LineHeightOption; label: string; val: number }[] = [
  { id: 'tight', label: 'Tight (1.2)', val: 1.2 },
  { id: 'normal', label: 'Normal (1.5)', val: 1.5 },
  { id: 'relaxed', label: 'Relaxed (1.75)', val: 1.75 },
  { id: 'loose', label: 'Loose (2.0)', val: 2.0 },
];

export const LETTER_SPACING_PRESETS: { id: LetterSpacingOption; label: string; val: string }[] = [
  { id: 'tight', label: 'Tight (-0.02em)', val: '-0.02em' },
  { id: 'normal', label: 'Normal (0)', val: '0em' },
  { id: 'wide', label: 'Wide (0.1em)', val: '0.1em' },
  { id: 'widest', label: 'Widest (0.25em)', val: '0.25em' },
];

export const COLOR_PALETTE_PRESETS = [
  { label: 'Deep Charcoal', value: '#2B2625' },
  { label: 'Warm Muted Gray', value: '#7C706D' },
  { label: 'Rose Gold Accent', value: '#C39E96' },
  { label: 'Warm Gold Accent', value: '#D4AF7F' },
  { label: 'Terracotta', value: '#A88179' },
  { label: 'Dark Noir', value: '#151211' },
  { label: 'Soft Ivory', value: '#FAF6F3' },
  { label: 'Pure White', value: '#FFFFFF' },
];

export function getFontFamilyCss(family?: string): string | undefined {
  if (!family || family === 'default' || family === 'inherit') return undefined;
  switch (family) {
    case 'serif':
      return "'Playfair Display', Georgia, serif";
    case 'playfair':
      return "'Playfair Display', Georgia, serif";
    case 'sans':
      return "'Inter', system-ui, -apple-system, sans-serif";
    case 'montserrat':
      return "'Montserrat', 'Inter', system-ui, sans-serif";
    case 'great-vibes':
      return "'Great Vibes', cursive, 'Playfair Display', Georgia, serif";
    case 'cormorant':
      return "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
    case 'mono':
      return "'DM Mono', monospace";
    default:
      return family;
  }
}

export function getFontWeightCss(weight?: string | number): string | number | undefined {
  if (!weight || weight === 'inherit' || weight === 'default') return undefined;
  switch (weight) {
    case 'light':
    case '300':
    case 300:
      return 300;
    case 'normal':
    case 'regular':
    case '400':
    case 400:
      return 400;
    case 'medium':
    case '500':
    case 500:
      return 500;
    case 'semibold':
    case '600':
    case 600:
      return 600;
    case 'bold':
    case '700':
    case 700:
      return 700;
    default:
      return weight;
  }
}

export function getFontSizeClass(size?: string, defaultClass: string = ''): string {
  if (!size || size === 'inherit' || size === 'default') return defaultClass;
  switch (size) {
    case 'small':
    case 'tiny':
    case 'xs':
      return 'text-xs sm:text-[13px]';
    case 'compact':
    case 'sm':
      return 'text-sm sm:text-base';
    case 'normal':
    case 'base':
      return defaultClass || 'text-base';
    case 'large':
    case 'lg':
      return 'text-lg sm:text-xl md:text-2xl';
    case 'xl':
      return 'text-xl sm:text-2xl md:text-3xl';
    case 'huge':
    case '2xl':
    case '3xl':
      return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
    case 'grand':
    case '4xl':
    case '5xl':
      return 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl';
    case 'hero':
    case 'display':
    case '6xl':
      return 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl';
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

  // 1. Text Color
  const effectiveColor = typography?.color || fallback?.defaultColor || fallback?.color;
  if (effectiveColor) {
    styles.color = effectiveColor;
  }

  // 2. Font Family
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

  // 3. Font Weight
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

  // 4. Font Size & Custom Numeric Size
  const customSize = typography?.customFontSize;
  if (customSize !== undefined && customSize !== '' && customSize !== null) {
    const formatted = typeof customSize === 'number' || !isNaN(Number(customSize))
      ? `${Number(customSize)}px`
      : String(customSize).trim();
    styles.fontSize = formatted;
  } else {
    const effectiveSize = typography?.fontSize || fallback?.defaultSize;
    if (effectiveSize && effectiveSize !== 'default') {
      if (['small', 'compact', 'normal', 'large', 'xl', 'huge', 'grand', 'hero', 'tiny', 'xs', 'sm', 'base', 'lg', '2xl', '3xl', '4xl', '5xl', '6xl', 'display'].includes(effectiveSize)) {
        const sizeClass = getFontSizeClass(effectiveSize, '');
        if (sizeClass) {
          classList.push(sizeClass);
        }
      } else if (effectiveSize !== 'inherit') {
        // Direct string size value like '42px' or '2.5rem'
        const formatted = !isNaN(Number(effectiveSize)) ? `${Number(effectiveSize)}px` : effectiveSize;
        styles.fontSize = formatted;
      }
    }
  }

  // 5. Text Style (Italic / Underline)
  const effectiveStyle = typography?.textStyle || fallback?.defaultStyle;
  if (effectiveStyle && effectiveStyle !== 'normal') {
    if (effectiveStyle === 'italic') {
      styles.fontStyle = 'italic';
      classList.push('italic');
    } else if (effectiveStyle === 'underline') {
      styles.textDecoration = 'underline';
      classList.push('underline');
    } else if (effectiveStyle === 'italic-underline') {
      styles.fontStyle = 'italic';
      styles.textDecoration = 'underline';
      classList.push('italic underline');
    }
  }

  // 6. Text Alignment
  const effectiveAlign = typography?.textAlign || fallback?.defaultAlign;
  if (effectiveAlign && effectiveAlign !== 'inherit') {
    if (effectiveAlign === 'left') {
      styles.textAlign = 'left';
      classList.push('text-left');
    } else if (effectiveAlign === 'center') {
      styles.textAlign = 'center';
      classList.push('text-center');
    } else if (effectiveAlign === 'right') {
      styles.textAlign = 'right';
      classList.push('text-right');
    } else if (effectiveAlign === 'justify') {
      styles.textAlign = 'justify';
      classList.push('text-justify');
    }
  }

  // 7. Line Height
  const lineHeight = typography?.lineHeight;
  if (lineHeight) {
    if (lineHeight === 'tight') styles.lineHeight = 1.2;
    else if (lineHeight === 'normal') styles.lineHeight = 1.5;
    else if (lineHeight === 'relaxed') styles.lineHeight = 1.75;
    else if (lineHeight === 'loose') styles.lineHeight = 2.0;
    else styles.lineHeight = lineHeight;
  }

  // 8. Letter Spacing
  const letterSpacing = typography?.letterSpacing;
  if (letterSpacing) {
    if (letterSpacing === 'tight') styles.letterSpacing = '-0.02em';
    else if (letterSpacing === 'normal') styles.letterSpacing = '0em';
    else if (letterSpacing === 'wide') styles.letterSpacing = '0.1em';
    else if (letterSpacing === 'widest') styles.letterSpacing = '0.25em';
    else styles.letterSpacing = letterSpacing;
  }

  const className = classList.join(' ').trim();

  return {
    ...styles,
    className,
    style: styles,
  };
}


