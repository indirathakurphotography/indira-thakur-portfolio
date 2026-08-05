'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-ivory text-rich-black min-h-screen flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-magenta/70">404 Error</span>
        <h1 className="font-serif text-4xl md:text-5xl text-rich-black mt-3">Page Not Found</h1>
        <div className="w-8 h-px bg-magenta/30 mx-auto my-6" />
        <p className="font-sans text-sm text-warm-gray/60 leading-relaxed">
          The page you are looking for may have been moved, renamed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-8 py-3.5 bg-rich-black text-white font-sans text-xs uppercase tracking-[0.2em] hover:bg-charcoal transition-colors duration-500"
        >
          Return to Gallery
        </Link>
      </div>
    </div>
  );
}
