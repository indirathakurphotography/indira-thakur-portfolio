/**
 * Meta Pixel Tracking Utilities for Facebook Ads
 * Supports PageView, Lead, Contact, ViewContent, Schedule, and Custom Events
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

/**
 * Standard Meta Pixel Standard Events
 */
export type MetaStandardEvent =
  | 'PageView'
  | 'Lead'
  | 'Contact'
  | 'ViewContent'
  | 'Schedule'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Search'
  | 'CompleteRegistration';

/**
 * Track a standard Meta Pixel event safely on client
 */
export function trackMetaEvent(
  eventName: MetaStandardEvent | string,
  params?: Record<string, any>
) {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.fbq === 'function') {
      if (params) {
        window.fbq('track', eventName, params);
      } else {
        window.fbq('track', eventName);
      }
    }
  } catch (err) {
    // Non-blocking error handling
    console.debug('[MetaPixel] Tracking event suppressed:', err);
  }
}

/**
 * Track a custom Meta Pixel event
 */
export function trackMetaCustomEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.fbq === 'function') {
      if (params) {
        window.fbq('trackCustom', eventName, params);
      } else {
        window.fbq('trackCustom', eventName);
      }
    }
  } catch (err) {
    console.debug('[MetaPixel] Custom tracking event suppressed:', err);
  }
}
