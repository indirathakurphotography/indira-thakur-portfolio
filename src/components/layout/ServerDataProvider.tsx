import ThemeSettings from '@/models/ThemeSettings';
import AppProviders from './AppProviders';

import { fetchSiteConfig, sanitizeConfig } from '@/lib/siteConfigStorage';

interface ServerData {
  config: any;
  theme: any;
  brand: any;
}

export function invalidateServerDataCache() {
  // No-op for compatibility; cache is not retained across requests
}

async function fetchServerData(): Promise<ServerData> {
  const t0 = performance.now();
  let config = null;
  let theme = null;

  try {
    const [siteConfigResult, themeDoc] = await Promise.all([
      fetchSiteConfig(),
      process.env.MONGODB_URI ? ThemeSettings.findOne().lean().catch(() => null) : Promise.resolve(null),
    ]);

    config = sanitizeConfig(siteConfigResult);
    theme = themeDoc;
  } catch {
    // Graceful fallback to default client-side configuration when DB is not available
  }

  const result = { config, theme, brand: config?.brand ?? null };

  console.log(`[PERF][Server] fetchServerData took ${(performance.now() - t0).toFixed(2)}ms`);
  return result;
}

export default async function ServerDataProvider({ children }: { children: React.ReactNode }) {
  console.log('[ServerDataProvider] render');
  const { config, theme, brand } = await fetchServerData();

  const mergedConfig = config;

  return (
    <AppProviders initialConfig={mergedConfig} initialTheme={theme} initialBrand={brand}>
      {children}
    </AppProviders>
  );
}
