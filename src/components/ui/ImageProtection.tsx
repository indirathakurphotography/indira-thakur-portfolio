'use client';

import { useEffect } from 'react';

export default function ImageProtection() {
  useEffect(() => {
    // 1. Prevent context menu (right-click) on images and image wrappers
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'IMG' ||
          target.closest('img') ||
          target.classList.contains('protected-image'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // 2. Prevent dragging images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'IMG' || target.closest('img'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Block keyboard shortcuts for saving / viewing source / printing on image focus
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S (Save), Ctrl/Cmd + U (View Source), Ctrl/Cmd + P (Print)
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return; // Allow saving/normal text editing if typing in inputs
        }
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, false);
    document.addEventListener('dragstart', handleDragStart, false);
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, false);
      document.removeEventListener('dragstart', handleDragStart, false);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, []);

  return null;
}
