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

  // Global brand settings are part of the authoritative SiteConfig document.
  useEffect(() => {
    if (!initialBrand) {
      fetch('/api/site-config', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.brand) setBrand(data.brand);
        })
        .catch(console.error);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'site-config-updated') {
        fetch('/api/site-config', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.brand) setBrand(data.brand);
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
