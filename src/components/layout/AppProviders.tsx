'use client';

import { useState, useEffect } from 'react';
import { useSiteConfig, SiteConfigProvider } from '@/hooks/useSiteConfig';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import DynamicHead from './DynamicHead';
import PublicLayoutWrapper from './PublicLayoutWrapper';
import ImageProtectionGuard from '@/components/common/ImageProtectionGuard';
import type { SiteConfigData } from '@/hooks/useSiteConfig';

interface AppProvidersProps {
  initialConfig: SiteConfigData | null;
  initialTheme: any;
  initialBrand: any;
  children: React.ReactNode;
}

function InnerAppProviders({ initialConfig, initialTheme, initialBrand, children }: AppProvidersProps) {
  const { config: hookConfig, loading: configLoading } = useSiteConfig();
  const { theme: hookTheme, loading: themeLoading } = useThemeSettings();

  const hasInitialData = initialConfig !== null && initialConfig !== undefined && initialTheme !== null && initialTheme !== undefined;
  const [config, setConfig] = useState<SiteConfigData | null>(initialConfig);
  const [theme, setTheme] = useState<any>(initialTheme);
  const [brand, setBrand] = useState<any>(initialBrand);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (hookConfig) setConfig(hookConfig);
    if (hookTheme) setTheme(hookTheme);
  }, [hookConfig, hookTheme]);

  // Client-side brand live updates (only fetch if initialBrand was absent or storage event fires)
  useEffect(() => {
    if (!initialBrand) {
      fetch('/api/brand')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setBrand(data);
        })
        .catch(console.error);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'brand-updated') {
        fetch('/api/brand')
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) setBrand(data);
          })
          .catch(console.error);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [initialBrand]);

  const effectiveTheme = theme || hookTheme;

  return (
    <>
      {effectiveTheme && (
        <>
          {/* Dynamic Google Fonts for heading & body font choices */}
          {effectiveTheme.headingFont && !['Playfair Display', 'Georgia', 'serif'].includes(effectiveTheme.headingFont) && (
            <link
              rel="stylesheet"
              href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(effectiveTheme.headingFont)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`}
            />
          )}
          {effectiveTheme.bodyFont && !['Inter', 'system-ui', 'sans-serif'].includes(effectiveTheme.bodyFont) && (
            <link
              rel="stylesheet"
              href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(effectiveTheme.bodyFont)}:wght@300;400;500;600;700&display=swap`}
            />
          )}
          <style
            dangerouslySetInnerHTML={{
              __html: `
                :root {
                  --color-primary: ${effectiveTheme.primaryColor || '#C39E96'};
                  --color-secondary: ${effectiveTheme.secondaryColor || '#A88179'};
                  --color-accent: ${effectiveTheme.accentColor || '#E2C3BC'};
                  --color-bg: ${effectiveTheme.backgroundColor || '#FAF6F3'};
                  --color-surface: ${effectiveTheme.surfaceColor || '#FFFFFF'};
                  --color-text: ${effectiveTheme.textColor || '#2B2625'};
                  --color-muted: ${effectiveTheme.mutedTextColor || '#7C706D'};
                  --color-card-bg: ${effectiveTheme.cardBackground || '#FFFFFF'};
                  --color-card-border: ${effectiveTheme.cardBorder || '#F4ECE8'};
                  --radius-card: ${effectiveTheme.cardRadius || '0px'};
                  --radius-button: ${effectiveTheme.buttonRadius || '0px'};
                  --color-nav-bg: ${effectiveTheme.navBackground || '#FAF6F3'};
                  --color-nav-text: ${effectiveTheme.navTextColor || '#2B2625'};
                  --color-footer-bg: ${effectiveTheme.footerBackground || '#2B2625'};
                  --color-footer-text: ${effectiveTheme.footerTextColor || '#FAF6F3'};
                  ${effectiveTheme.headingFont ? `--font-serif: "${effectiveTheme.headingFont}", "Playfair Display", Georgia, serif;` : ''}
                  ${effectiveTheme.bodyFont ? `--font-sans: "${effectiveTheme.bodyFont}", "Inter", system-ui, sans-serif;` : ''}
                }
              `,
            }}
          />
        </>
      )}
      <DynamicHead />
      <ImageProtectionGuard />
      <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
    </>
  );
}

export default function AppProviders({ initialConfig, initialTheme, initialBrand, children }: AppProvidersProps) {
  return (
    <SiteConfigProvider initialConfig={initialConfig}>
      <InnerAppProviders initialConfig={initialConfig} initialTheme={initialTheme} initialBrand={initialBrand}>
        {children}
      </InnerAppProviders>
    </SiteConfigProvider>
  );
}
