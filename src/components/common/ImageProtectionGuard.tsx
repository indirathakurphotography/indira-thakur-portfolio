'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function isEditableElement(target: HTMLElement | null): boolean {
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toUpperCase() : '';
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return true;
  }
  return false;
}

export default function ImageProtectionGuard() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname && (pathname === '/admin' || pathname.startsWith('/admin/')));

  useEffect(() => {
    // Admin routes must remain 100% unaffected
    if (isAdmin) {
      document.body.classList.remove('public-protected');
      return;
    }

    // Apply public protection class to body
    document.body.classList.add('public-protected');

    // 1. Disable browser context menu (right-click) across public website
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (isEditableElement(target)) {
        return; // Retain normal context menu on form inputs/textareas for usability
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 2. Prevent dragging images or media out of the page
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isEditableElement(target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Prevent text selection start outside editable fields
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!isEditableElement(target)) {
        e.preventDefault();
      }
    };

    // 4. Prevent common copy actions (Ctrl/Cmd + C, X, A) and devtools/saving shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;

      if (isEditableElement(target)) {
        return; // Allow normal input/textarea typing, select-all, copy, cut
      }

      // Prevent Ctrl/Cmd + C (copy), Ctrl/Cmd + X (cut), Ctrl/Cmd + A (select all)
      if (ctrlOrCmd && (key === 'c' || key === 'x' || key === 'a')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I / J / C (DevTools)
      if (ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U (view source) or Ctrl+S (save page)
      if (ctrlOrCmd && (key === 'u' || key === 's')) {
        e.preventDefault();
        return false;
      }
    };

    // 5. Prevent copy & cut events globally outside inputs
    const handleCopyCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isEditableElement(target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 6. Prevent touch callouts on mobile (long press image saving)
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'IMG' || target.closest('img') || target.closest('.protected-image')) {
        (target as HTMLElement).style.setProperty('-webkit-touch-callout', 'none');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('selectstart', handleSelectStart, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('copy', handleCopyCut, true);
    window.addEventListener('cut', handleCopyCut, true);
    window.addEventListener('touchstart', handleTouchStart, true);

    return () => {
      document.body.classList.remove('public-protected');
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('selectstart', handleSelectStart, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('copy', handleCopyCut, true);
      window.removeEventListener('cut', handleCopyCut, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
    };
  }, [pathname, isAdmin]);

  return null;
}

