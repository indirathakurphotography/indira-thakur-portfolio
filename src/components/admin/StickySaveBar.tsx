'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowPath } from 'react-icons/hi2';

interface StickySaveBarProps {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
  pendingCount?: number;
}

export default function StickySaveBar({
  dirty,
  saving,
  onDiscard,
  onSave,
  pendingCount,
}: StickySaveBarProps) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:ml-72"
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-cream/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-3.5 flex items-center justify-between gap-4">
              {/* Left: Status */}
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                <span className="font-sans text-sm text-warm-gray/70">
                  Unsaved Changes
                  {pendingCount != null && pendingCount > 0 && (
                    <span className="ml-1.5 text-warm-gray/40">
                      ({pendingCount} field{pendingCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onDiscard}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] font-sans text-xs uppercase tracking-[0.15em] text-warm-gray/60 hover:text-rich-black transition-colors disabled:opacity-40"
                >
                  <HiArrowPath className="w-3.5 h-3.5" />
                  Discard
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || !dirty}
                  className="inline-flex items-center justify-center gap-2 px-7 py-2.5 min-h-[44px] bg-rich-black text-white font-sans text-xs uppercase tracking-[0.15em] hover:bg-charcoal transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
