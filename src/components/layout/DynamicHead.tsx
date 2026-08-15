'use client';

import { useEffect } from 'react';

/** Keeps the full favicon selected in Brand Settings as the sole browser icon,
 * including after Next.js changes route metadata during navigation. */
export default function DynamicHead() {
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const applyBrandFavicon = async () => {
      try {
        const response = await fetch(`/api/brand?favicon=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok || cancelled) return;

        const brand = await response.json();
        const faviconUrl = brand?.favicon?.url;
        if (!faviconUrl || cancelled) return;

        const href = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${brand.updatedAt || Date.now()}`;
        let applying = false;

        const enforce = () => {
          if (applying || cancelled) return;
          applying = true;
          document.head.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach((node) => node.remove());

          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/jpeg';
          link.href = href;
          link.setAttribute('data-brand-favicon', 'true');
          document.head.appendChild(link);
          applying = false;
        };

        enforce();
        observer = new MutationObserver(() => {
          if (!applying && !document.head.querySelector('link[data-brand-favicon="true"]')) {
            enforce();
          }
        });
        observer.observe(document.head, { childList: true });
      } catch {
        // Preserve the existing browser icon if the Brand Settings endpoint is unavailable.
      }
    };

    void applyBrandFavicon();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return null;
}
