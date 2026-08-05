'use client';

import { useState, useEffect } from 'react';
import { useSiteConfig, SiteConfigProvider } from '@/hooks/useSiteConfig';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import DynamicHead from './DynamicHead';
import PublicLayoutWrapper from './PublicLayoutWrapper';
import type { SiteConfigData } from '@/hooks/useSiteConfig';

interface AppProvidersProps {
  initialConfig: SiteConfigData | null;
  initialTheme: any;
  initialBrand: any;
  children: React.ReactNode;
}

export default function AppProviders({ initialConfig, initialTheme, initialBrand, children }: AppProvidersProps) {
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

  // Client-side brand fetching and live updates
  useEffect(() => {
    const fetchBrand = () => {
      fetch('/api/brand')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setBrand(data);
        })
        .catch(console.error);
    };

    fetchBrand();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'brand-updated') {
        fetchBrand();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const effectiveConfig = config || hookConfig;
  const effectiveTheme = theme || hookTheme;

  // Only show loading on client if no initial data was provided
  const isLoading = isClient && !hasInitialData && (configLoading || themeLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory">
        <p className="font-sans text-sm text-warm-gray/40">Loading...</p>
      </div>
    );
  }

  console.log('[AppProviders] render', { pathname: typeof window !== 'undefined' ? window.location.pathname : 'ssr', isClient, hasInitialData, isLoading });

  return (
    <SiteConfigProvider initialConfig={initialConfig}>
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
      {brand?.favicon?.url ? (
        <link rel="icon" href={`${brand.favicon.url}?v=${brand.updatedAt || Date.now()}`} />
      ) : (
        <link rel="icon" href="/favicon.ico" />
      )}
      <DynamicHead />
      <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
    </SiteConfigProvider>
  );
}
