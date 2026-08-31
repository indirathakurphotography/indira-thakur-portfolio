'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);

  // Track PageView on client-side Next.js route changes
  useEffect(() => {
    if (!pathname) return;

    // Skip admin or API routes to prevent polluting analytics
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    // Skip the initial mount because the inline base script already fired PageView
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Fire PageView on subsequent client-side navigations
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}
