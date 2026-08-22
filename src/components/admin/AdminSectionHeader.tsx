'use client';

import React from 'react';
import Link from 'next/link';
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowTopRightOnSquare,
  HiArrowPath,
} from 'react-icons/hi2';

export interface AdminSectionHeaderProps {
  title: string;
  description: string;
  isDirty?: boolean;
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  livePageUrl?: string;
  previewUrl?: string;
  livePageLabel?: string;
  customActions?: React.ReactNode;
}

export default function AdminSectionHeader({
  title,
  description,
  isDirty,
  hasUnsavedChanges,
  saving,
  isSaving,
  onSave,
  livePageUrl,
  previewUrl,
  livePageLabel = 'View Live Page',
  customActions,
}: AdminSectionHeaderProps) {
  const dirty = hasUnsavedChanges !== undefined ? hasUnsavedChanges : (isDirty || false);
  const isCurrentlySaving = isSaving !== undefined ? isSaving : (saving || false);
  const targetUrl = previewUrl || livePageUrl;
  return (
    <div className="bg-white border-b border-[#E7DDD2] px-6 lg:px-8 py-5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl lg:text-3xl text-[#2B2625] font-semibold tracking-tight">
              {title}
            </h1>
            {/* Status indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  <HiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Saved
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-[#7C706D] font-sans max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          {targetUrl && (
            <Link
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans text-[#7C706D] hover:text-[#2B2625] bg-[#FAF6F3] hover:bg-[#F3ECE6] border border-[#E7DDD2] rounded-lg transition-colors"
            >
              <span>{livePageLabel}</span>
              <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
            </Link>
          )}

          {customActions}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isCurrentlySaving}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-sans font-medium uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer ${
                dirty
                  ? 'bg-[#2B2625] hover:bg-[#1C1817] text-white ring-2 ring-[#C39E96]/50'
                  : 'bg-[#2B2625] hover:bg-[#1C1817] text-white opacity-90'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Save changes (Ctrl+S / ⌘S)"
            >
              {isCurrentlySaving ? (
                <>
                  <HiArrowPath className="w-4 h-4 animate-spin text-[#C39E96]" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                  <span className="hidden lg:inline text-[10px] text-white/50 font-mono">⌘S</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
