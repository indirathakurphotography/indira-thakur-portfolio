'use client';

import { useEffect } from 'react';

/**
 * DynamicHead ensures no competing or conflicting favicon sources are injected at runtime,
 * maintaining the authoritative static /favicon.ico and /icon.png as the sole browser tab icon.
 */
export default function DynamicHead() {
  useEffect(() => {
    // Remove any legacy or conflicting dynamic favicon links
    const conflictingLinks = document.head.querySelectorAll('link[data-brand-favicon="true"]');
    conflictingLinks.forEach((link) => link.remove());
  }, []);

  return null;
}
