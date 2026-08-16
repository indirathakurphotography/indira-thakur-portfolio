'use client';

import { useThemeSettings } from '@/hooks/useThemeSettings';
import { useLayoutEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeSettings();

  useLayoutEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primaryColor || null);
    root.style.setProperty('--color-secondary', theme.secondaryColor || null);
    root.style.setProperty('--color-accent', theme.accentColor || null);
    root.style.setProperty('--color-bg', theme.backgroundColor || null);
    root.style.setProperty('--color-surface', theme.surfaceColor || null);
    root.style.setProperty('--color-text', theme.textColor || null);
    root.style.setProperty('--color-muted', theme.mutedTextColor || null);
    root.style.setProperty('--color-card-bg', theme.cardBackground || null);
    root.style.setProperty('--color-card-border', theme.cardBorder || null);
    root.style.setProperty('--radius-card', theme.cardRadius || null);
    root.style.setProperty('--radius-button', theme.buttonRadius || null);
    root.style.setProperty('--color-nav-bg', theme.navBackground || null);
    root.style.setProperty('--color-nav-text', theme.navTextColor || null);
    root.style.setProperty('--color-footer-bg', theme.footerBackground || null);
    root.style.setProperty('--color-footer-text', theme.footerTextColor || null);
  }, [theme]);

  return <>{children}</>;
}
