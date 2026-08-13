'use client';

interface ImagePlaceholderProps {
  className?: string;
  aspect?: string;
  label?: string;
  icon?: 'camera' | 'portrait' | 'landscape' | 'film';
}

const icons = {
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  portrait: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  landscape: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  ),
  film: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
};

export default function ImagePlaceholder({
  className = '',
  aspect = 'aspect-[4/3]',
  label,
  icon = 'camera',
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-cream via-beige/30 to-cream/50 ${aspect} ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-12 h-12 text-warm-gray/15 mb-2">{icons[icon]}</div>
        {label && (
          <p className="font-mono text-[9px] text-warm-gray/20 uppercase tracking-[0.2em]">{label}</p>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cream/20 via-transparent to-transparent" />
    </div>
  );
}
