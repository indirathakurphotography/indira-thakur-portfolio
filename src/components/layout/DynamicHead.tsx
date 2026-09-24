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
        // Never override with legacy JPEG logo or invalid image format
        if (
          !faviconUrl ||
          cancelled ||
          faviconUrl.endsWith('.jpeg') ||
          faviconUrl.endsWith('.jpg') ||
          faviconUrl.includes('Indira_Photography_logo')
        ) {
          return;
        }

        const href = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${brand.updatedAt || Date.now()}`;
        let applying = false;

        const enforce = () => {
          if (applying || cancelled) return;
          applying = true;

          // Only update custom icon if explicitly a valid icon and not already present
          let customLink = document.head.querySelector('link[data-brand-favicon="true"]') as HTMLLinkElement | null;
          if (!customLink) {
            customLink = document.createElement('link');
            customLink.rel = 'icon';
            customLink.setAttribute('data-brand-favicon', 'true');
            document.head.appendChild(customLink);
          }
          const lowerHref = href.toLowerCase();
          customLink.type = lowerHref.includes('.png') ? 'image/png' : lowerHref.includes('.ico') ? 'image/x-icon' : lowerHref.includes('.svg') ? 'image/svg+xml' : 'image/png';
          customLink.href = href;
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
