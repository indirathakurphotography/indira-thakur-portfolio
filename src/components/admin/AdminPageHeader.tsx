'use client';

import { HiEye } from 'react-icons/hi2';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  error?: string | null;
  success?: string | null;
  dirty?: boolean;
  lastSavedAt?: Date | null;
  onClearMessages?: () => void;
  previewHref?: string;
}

export default function AdminPageHeader({
  title,
  description,
  dirty,
  lastSavedAt,
  previewHref,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-rich-black mb-2">{title}</h1>
            <p className="font-sans text-sm text-warm-gray/60">{description}</p>
          </div>
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 border border-cream/60 text-warm-gray/60 hover:text-rich-black font-sans text-[10px] uppercase tracking-wider rounded transition-colors"
            >
              <HiEye className="w-3.5 h-3.5" />
              Preview
            </a>
          )}
        </div>
        {dirty && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full font-sans text-[10px] text-amber-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      {lastSavedAt && (
        <p className="font-sans text-[10px] text-warm-gray/30 mt-3">
          Last saved: {lastSavedAt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
