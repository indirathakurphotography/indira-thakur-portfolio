'use client';

import { useState, useEffect } from 'react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import DynamicHead from './DynamicHead';
import PublicLayoutWrapper from './PublicLayoutWrapper';
import type { SiteConfigData } from '@/hooks/useSiteConfig';

interface ProvidersProps {
  initialConfig: SiteConfigData | null;
  initialTheme: any;
  children: React.ReactNode;
}

export default function Providers({ initialConfig, initialTheme, children }: ProvidersProps) {
  const { config: hookConfig, loading: configLoading } = useSiteConfig();
  const { theme: hookTheme, loading: themeLoading } = useThemeSettings();

  const hasInitialData = initialConfig !== null && initialConfig !== undefined && initialTheme !== null && initialTheme !== undefined;
  const [config, setConfig] = useState<SiteConfigData | null>(initialConfig);
  const [theme, setTheme] = useState<any>(initialTheme);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (hookConfig) setConfig(hookConfig);
    if (hookTheme) setTheme(hookTheme);
  }, [hookConfig, hookTheme]);

  const effectiveConfig = config || hookConfig;
  const effectiveTheme = theme || hookTheme;

  // Only show loading on client if no data yet
  const isLoading = isClient && !hasInitialData && (configLoading || themeLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory">
        <p className="font-sans text-sm text-warm-gray/40">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {effectiveTheme && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary: ${effectiveTheme.primaryColor};
                --color-secondary: ${effectiveTheme.secondaryColor};
                --color-accent: ${effectiveTheme.accentColor};
                --color-bg: ${effectiveTheme.backgroundColor};
                --color-surface: ${effectiveTheme.surfaceColor};
                --color-text: ${effectiveTheme.textColor};
                --color-muted: ${effectiveTheme.mutedTextColor};
                --color-card-bg: ${effectiveTheme.cardBackground};
                --color-card-border: ${effectiveTheme.cardBorder};
                --radius-card: ${effectiveTheme.cardRadius};
                --radius-button: ${effectiveTheme.buttonRadius};
                --color-nav-bg: ${effectiveTheme.navBackground};
                --color-nav-text: ${effectiveTheme.navTextColor};
                --color-footer-bg: ${effectiveTheme.footerBackground};
                --color-footer-text: ${effectiveTheme.footerTextColor};
              }
            `,
          }}
        />
      )}
      <DynamicHead />
      <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
    </>
  );
}