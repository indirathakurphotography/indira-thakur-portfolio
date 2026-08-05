'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';

  const formattedTitle = slug
    ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Bespoke Experience';

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2B2625] pt-32 pb-24 flex items-center justify-center">
      <div className="container-editorial max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
            FINE ART COMMISSION
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#2B2625] leading-tight">
            {formattedTitle}
          </h1>
          <div className="w-10 h-px bg-[#C39E96]/40 mx-auto my-6" />
          <p className="font-sans text-sm md:text-base text-[#7C706D] leading-relaxed max-w-xl mx-auto">
            Every {formattedTitle.toLowerCase()} commission with Indira Thakur includes bespoke styling consultation, guided direction, expert retouching, and delivery of heirloom album keepsakes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link
              href={`/contact?service=${encodeURIComponent(slug)}`}
              className="px-8 py-4 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#3D3534] transition-colors shadow-sm"
            >
              Inquire For This Session
            </Link>
            <Link
              href="/services"
              className="font-sans text-xs text-[#C39E96] uppercase tracking-[0.2em] hover:text-[#2B2625] transition-colors"
            >
              ← Back To All Services
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
