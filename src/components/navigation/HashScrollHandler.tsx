'use client';

import { useEffect } from 'react';

/**
 * HashScrollHandler
 *
 * Ensures robust, smooth scrolling to anchor sections (#services, #contact, etc.)
 * across direct navigation, page refresh, client-side route transitions (such as
 * Gallery -> Explore All Services), and browser back/forward navigation.
 */
export default function HashScrollHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutIds: NodeJS.Timeout[] = [];
    let isUserScrolling = false;
    let userScrollTimer: NodeJS.Timeout | null = null;

    // Detect if user has manually started scrolling to prevent intrusive jump-back
    const onUserScroll = () => {
      isUserScrolling = true;
      if (userScrollTimer) clearTimeout(userScrollTimer);
      userScrollTimer = setTimeout(() => {
        isUserScrolling = false;
      }, 1500);
    };

    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });

    const scrollToTarget = (targetId: string, smooth: boolean = true): boolean => {
      const el = document.getElementById(targetId);
      if (!el) return false;

      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Calculate position with offset for floating navbar (height ~80px + margin)
      const navOffset = window.innerWidth < 768 ? 80 : 96;
      const rect = el.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top - navOffset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto',
      });

      return true;
    };

    const handleHashCheck = (smooth: boolean = true) => {
      let target = '';

      if (window.location.hash) {
        target = window.location.hash.replace(/^#/, '');
      }

      try {
        const sessionTarget = sessionStorage.getItem('scrollToSection');
        if (sessionTarget) {
          target = sessionTarget;
          sessionStorage.removeItem('scrollToSection');
        }
      } catch {
        // ignore storage errors
      }

      if (!target) return;

      // Attempt immediate scroll
      if (scrollToTarget(target, smooth)) return;

      // If element is not yet rendered or layout is settling, retry across staggered intervals
      timeoutIds.forEach(clearTimeout);
      timeoutIds = [];

      const delays = [50, 150, 300, 600, 1000, 1500];
      delays.forEach((delay) => {
        const tid = setTimeout(() => {
          if (!isUserScrolling) {
            scrollToTarget(target, smooth);
          }
        }, delay);
        timeoutIds.push(tid);
      });
    };

    // Run check on mount
    handleHashCheck(false);

    // Hash change event (internal link click)
    const onHashChange = () => {
      handleHashCheck(true);
    };

    // Popstate event (browser back / forward button)
    const onPopState = () => {
      if (window.location.pathname === '/' && !window.location.hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleHashCheck(true);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onPopState);

    return () => {
      timeoutIds.forEach(clearTimeout);
      if (userScrollTimer) clearTimeout(userScrollTimer);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return null;
}
