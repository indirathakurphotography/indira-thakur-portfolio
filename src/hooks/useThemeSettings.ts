'use client';

import { useState, useEffect } from 'react';

export interface ThemeSettingsType {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  cardBackground?: string;
  cardBorder?: string;
  cardRadius?: string;
  buttonRadius?: string;
  buttonStyle?: string;
  navBackground?: string;
  navTextColor?: string;
  footerBackground?: string;
  footerTextColor?: string;
  headingFont?: string;
  bodyFont?: string;
  shadowIntensity?: string;
  glassEffect?: boolean;
}

let cachedTheme: ThemeSettingsType | null = null;
let fetchPromise: Promise<ThemeSettingsType | null> | null = null;

export function invalidateThemeSettingsCache() {
  cachedTheme = null;
  fetchPromise = null;
}

export function useThemeSettings() {
  const [theme, setTheme] = useState<ThemeSettingsType | null>(() => cachedTheme);
  const [loading, setLoading] = useState<boolean>(() => !cachedTheme);

  useEffect(() => {
    if (cachedTheme) {
      return;
    }

    const fetchTheme = async () => {
      try {
        if (!fetchPromise) {
          fetchPromise = fetch('/api/theme').then(r => r.ok ? r.json() : null);
        }
        const data = await fetchPromise;
        if (data) {
          cachedTheme = data;
          setTheme(data);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme-updated') {
        invalidateThemeSettingsCache();
        fetch('/api/theme')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              cachedTheme = data;
              setTheme(data);
            }
          });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { theme, loading };
}
