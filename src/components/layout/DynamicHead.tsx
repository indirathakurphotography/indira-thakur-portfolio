'use client';

import { useEffect } from 'react';

/**
 * DynamicHead ensures no legacy monochrome or competing dynamic favicon sources persist in the DOM,
 * keeping the Admin Panel colour icon as the single authoritative icon.
 */
export default function DynamicHead() {
  useEffect(() => {
    const conflictingLinks = document.head.querySelectorAll(
      'link[data-brand-favicon="true"], link[href*="/favicon.ico"], link[href*="/icon.png"], link[href*="/apple-touch-icon.png"]'
    );
    conflictingLinks.forEach((link) => link.remove());
  }, []);

  return null;
}
