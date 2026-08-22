'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowPath } from 'react-icons/hi2';

export interface StickySaveBarProps {
  dirty?: boolean;
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  isSaving?: boolean;
  onDiscard?: () => void;
  onReset?: () => void;
  onSave: () => void;
  pendingCount?: number;
  label?: string;
}

export default function StickySaveBar({
  dirty,
  hasUnsavedChanges,
  saving,
  isSaving,
  onDiscard,
  onReset,
  onSave,
  pendingCount,
  label = 'Unsaved Changes',
}: StickySaveBarProps) {
  const isDirty = hasUnsavedChanges !== undefined ? hasUnsavedChanges : (dirty || false);
  const isCurrentlySaving = isSaving !== undefined ? isSaving : (saving || false);
  const handleDiscard = onReset || onDiscard || (() => {});

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:ml-72"
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-[#E7DDD2] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-3.5 flex items-center justify-between gap-4">
              {/* Left: Status */}
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="font-sans text-xs md:text-sm text-[#2B2625] font-medium">
                  {label}
                  {pendingCount != null && pendingCount > 0 && (
                    <span className="ml-1.5 text-[#7C706D]">
                      ({pendingCount} field{pendingCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isCurrentlySaving}
                  className="font-sans text-xs text-[#7C706D] hover:text-[#2B2625] px-3.5 py-2 rounded-lg hover:bg-[#FAF6F3] transition-colors border border-transparent hover:border-[#E7DDD2] cursor-pointer disabled:opacity-50"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isCurrentlySaving}
                  className="inline-flex items-center gap-2 font-sans text-xs font-medium uppercase tracking-wider bg-[#2B2625] hover:bg-[#1C1817] text-white px-5 py-2 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCurrentlySaving ? (
                    <>
                      <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[#C39E96]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
