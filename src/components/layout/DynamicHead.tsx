'use client';

import { useEffect } from 'react';

/** Applies the favicon stored in Admin → SEO after the public shell loads. */
export default function DynamicHead() {
  useEffect(() => {
    let disposed = false;

    async function applyAdminFavicon() {
      try {
        const response = await fetch('/api/seo', { cache: 'no-store' });
        if (!response.ok) return;
        const settings = await response.json();
        const favicon = typeof settings?.favicon === 'string' ? settings.favicon.trim() : '';
        if (!favicon || disposed) return;

        document.head.querySelectorAll('link[data-admin-favicon="true"]').forEach((node) => node.remove());
        const separator = favicon.includes('?') ? '&' : '?';
        const href = `${favicon}${separator}v=${encodeURIComponent(settings?.updatedAt || Date.now())}`;
        for (const rel of ['icon', 'shortcut icon', 'apple-touch-icon']) {
          const link = document.createElement('link');
          link.rel = rel;
          link.href = href;
          link.setAttribute('data-admin-favicon', 'true');
          document.head.appendChild(link);
        }
      } catch {
        // The packaged favicon remains as a safe fallback if the CMS is unavailable.
      }
    }

    void applyAdminFavicon();
    return () => { disposed = true; };
  }, []);

  return null;
}
