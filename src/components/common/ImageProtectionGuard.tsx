'use client';

import { useEffect } from 'react';

const PROTECTED_PATHS = ['/gallery', '/services'];

function isProtectedPage(): boolean {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  return PROTECTED_PATHS.some((p) => path.startsWith(p));
}

export default function ImageProtectionGuard() {
  useEffect(() => {
    // Only apply protection on protected pages (gallery, services)
    if (!isProtectedPage()) return;

    // 1. Prevent right-click on images, pictures, canvas, and protected containers
    // Use standard bubbling phase without e.stopPropagation() so normal interaction is unaffected
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
      }
    };

    // 3. Prevent keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S)
    // Only block when not focused on form inputs
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // F12 - only on protected pages
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+I / J / C - dev tools, only when not in form
      if (ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
          return; // Allow when focused on form field
        }
        e.preventDefault();
        return;
      }

      // Ctrl+U (view source) or Ctrl+S (save page) - only when not in form
      if (ctrlOrCmd && (key === 'u' || key === 's')) {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
          return; // Allow when focused on form field
        }
        e.preventDefault();
        return;
      }

      // Ctrl+C - only block when clicked on an image (not general page copy)
      if (ctrlOrCmd && key === 'c') {
        const active = document.activeElement;
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : '';
        // Only block if no text is selected AND clicking on an image
        if (!selectedText && (active?.tagName === 'IMG' || active?.closest('.protected-image'))) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, false);
    window.addEventListener('dragstart', handleDragStart, false);
    window.addEventListener('keydown', handleKeyDown, false);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, false);
      window.removeEventListener('dragstart', handleDragStart, false);
      window.removeEventListener('keydown', handleKeyDown, false);
    };
  }, []);

  return null;
}
