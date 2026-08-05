'use client';

import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi2';
import { toast } from '@/lib/toast';

const icons = {
  success: HiCheckCircle,
  error: HiExclamationCircle,
  info: HiInformationCircle,
};

const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

export default function ToastContainer() {
  const toasts = useSyncExternalStore(
    toast.subscribe,
    toast.getSnapshot,
    () => []
  );

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 border rounded-lg shadow-lg shadow-black/5 backdrop-blur-sm ${styles[t.type]}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-sans text-sm font-medium flex-1">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
