'use client';

import { useEffect } from 'react';

export default function ImageProtectionGuard() {
  useEffect(() => {
    // 1. Prevent right-click on images, pictures, canvas, and protected containers
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isImage =
        target.tagName === 'IMG' ||
        target.tagName === 'PICTURE' ||
        target.tagName === 'CANVAS' ||
        target.tagName === 'VIDEO' ||
        target.closest('img') ||
        target.closest('.protected-image') ||
        target.closest('.gallery-protected-container');

      if (isImage) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Prevent image dragging
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isMedia =
        target.tagName === 'IMG' ||
        target.tagName === 'PICTURE' ||
        target.tagName === 'VIDEO' ||
        target.closest('img') ||
        target.closest('.protected-image');

      if (isMedia) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Prevent keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I / J / C
      if (ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (view source) or Ctrl+S (save page)
      if (ctrlOrCmd && (key === 'u' || key === 's')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+C on images
      if (ctrlOrCmd && key === 'c') {
        const active = document.activeElement;
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : '';
        if (!selectedText && (active?.tagName === 'IMG' || active?.closest('.protected-image'))) {
          e.preventDefault();
          return false;
        }
      }
    };

    // 4. Prevent touch long press context menu on mobile
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'IMG' || target.closest('img') || target.closest('.protected-image')) {
        // Apply inline touch-callout override
        (target as HTMLElement).style.setProperty('-webkit-touch-callout', 'none');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('touchstart', handleTouchStart, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
    };
  }, []);

  return null;
}
