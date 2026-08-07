'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setIsInitialLoad(false), 800);
    }, typeof window !== 'undefined' && document.readyState === 'complete' ? 600 : 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialLoad) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-[100] bg-ivory flex items-center justify-center pointer-events-none"
          role="status"
          aria-label="Loading"
        >
          <div className="text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="font-serif text-2xl md:text-3xl text-rich-black italic"
            >
              Indira Thakur
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-px bg-magenta/40 mt-6 mx-auto origin-left"
              style={{ width: 60 }}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="font-mono text-[11px] text-warm-gray/50 uppercase tracking-[0.25em] mt-6"
            >
              Photography
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
