'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(false);
  const { config } = useSiteConfig();

  const loadingLogoUrl = config?.brand?.preloaderLogo?.url || config?.brand?.logo?.url || config?.footer?.logo?.url;

  useEffect(() => {
    try {
      if (sessionStorage.getItem('itp_preloader_seen') === 'true') {
        setIsLoading(false);
        return;
      }
    } catch {}

    // First time visitor brief subtle touch
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      try {
        sessionStorage.setItem('itp_preloader_seen', 'true');
      } catch {}
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF6F3] text-[#2B2625] pointer-events-none"
        >
          {/* Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(195,158,150,0.12)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-md">
            {/* CMS Uploaded Logo or Elegant Brand Typography */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative flex flex-col items-center justify-center mb-4"
            >
              {loadingLogoUrl ? (
                <img
                  src={loadingLogoUrl}
                  alt={config?.brand?.preloaderLogo?.alt || config?.brand?.logo?.alt || 'Indira Thakur Photography'}
                  className="max-h-24 max-w-[200px] w-auto h-auto object-contain"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="font-serif text-3xl sm:text-4xl tracking-tight text-[#2B2625]">
                    {config?.brand?.siteName || 'Indira Thakur'}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#C39E96] mt-1.5 font-medium">
                    {config?.brand?.tagline || 'FINE ART PHOTOGRAPHY'}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Minimal Progress Line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80px' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C39E96] to-transparent mt-3 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
