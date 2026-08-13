import mongoose, { Schema, Document } from 'mongoose';

export interface IThemeSettings extends Document {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  cardBackground: string;
  cardBorder: string;
  cardRadius: string;
  buttonRadius: string;
  buttonStyle: 'filled' | 'outlined' | 'soft';
  navBackground: string;
  navTextColor: string;
  footerBackground: string;
  footerTextColor: string;
  headingFont: string;
  bodyFont: string;
  shadowIntensity: 'none' | 'light' | 'medium' | 'heavy';
  glassEffect: boolean;
  updatedAt: Date;
}

const ThemeSettingsSchema = new Schema<IThemeSettings>(
  {
    primaryColor: { type: String, default: '#C39E96' },
    secondaryColor: { type: String, default: '#A88179' },
    accentColor: { type: String, default: '#E2C3BC' },
    backgroundColor: { type: String, default: '#FAF6F3' },
    surfaceColor: { type: String, default: '#FFFFFF' },
    textColor: { type: String, default: '#2B2625' },
    mutedTextColor: { type: String, default: '#7C706D' },
    cardBackground: { type: String, default: '#FFFFFF' },
    cardBorder: { type: String, default: '#F4ECE8' },
    cardRadius: { type: String, default: '0px' },
    buttonRadius: { type: String, default: '0px' },
    buttonStyle: { type: String, enum: ['filled', 'outlined', 'soft'], default: 'filled' },
    navBackground: { type: String, default: '#FAF6F3' },
    navTextColor: { type: String, default: '#2B2625' },
    footerBackground: { type: String, default: '#2B2625' },
    footerTextColor: { type: String, default: '#FAF6F3' },
    headingFont: { type: String, default: 'Playfair Display' },
    bodyFont: { type: String, default: 'Inter' },
    shadowIntensity: { type: String, enum: ['none', 'light', 'medium', 'heavy'], default: 'light' },
    glassEffect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ThemeSettings || mongoose.model<IThemeSettings>('ThemeSettings', ThemeSettingsSchema);
