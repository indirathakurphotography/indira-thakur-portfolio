'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF6F3] text-[#2B2625] font-sans min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#C39E96]">Notice</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#2B2625] mt-3">An unexpected moment occurred</h1>
          <p className="font-sans text-sm text-[#7C706D] mt-4 leading-relaxed">
            We apologize for the inconvenience. Please try refreshing or return to our homepage.
          </p>
          <button
            onClick={() => reset()}
            className="mt-8 px-8 py-3.5 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-[0.2em] hover:bg-[#3D3534] transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
