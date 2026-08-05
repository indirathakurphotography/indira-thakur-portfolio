'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface UnsavedChangesGuardProps {
  hasUnsavedChanges: boolean;
}

export default function UnsavedChangesGuard({ hasUnsavedChanges }: UnsavedChangesGuardProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleRouteChange = (e: PopStateEvent) => {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        window.history.pushState(null, '', pathname);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [hasUnsavedChanges, pathname]);

  return null;
}
