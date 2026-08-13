'use client';

import { motion } from 'framer-motion';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SectionHeading({ eyebrow, title, description, className = '' }: SectionHeadingProps) {
  return (
    <div className={`text-center mb-16 md:mb-20 ${className}`}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono text-[11px] text-magenta/50 uppercase tracking-[0.25em]"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="heading-lg mt-6"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="body-md mt-4 max-w-lg mx-auto text-warm-gray/60"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
