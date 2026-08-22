'use client';

import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

export interface AdminCardSectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string | React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function AdminCardSection({
  id,
  title,
  description,
  icon,
  badge,
  defaultOpen = true,
  collapsible = true,
  headerAction,
  children,
  className = '',
}: AdminCardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      id={id}
      className={`bg-white rounded-2xl border border-[#E7DDD2] shadow-2xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Section Header */}
      <div
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`p-5 sm:p-6 flex items-center justify-between gap-4 select-none ${
          collapsible ? 'cursor-pointer hover:bg-[#FAF6F3]/40' : ''
        } ${isOpen && collapsible ? 'border-b border-[#E7DDD2]/70' : ''}`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96] shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-serif text-lg sm:text-xl text-[#2B2625] font-medium truncate">
                {title}
              </h2>
              {badge && typeof badge === 'string' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2]">
                  {badge}
                </span>
              ) : (
                badge
              )}
            </div>
            {description && (
              <p className="text-xs text-[#7C706D] mt-1 font-sans line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
          )}
          {collapsible && (
            <button
              type="button"
              className="p-2 rounded-lg text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3] transition-colors"
              aria-label={isOpen ? 'Collapse section' : 'Expand section'}
            >
              {isOpen ? (
                <HiChevronUp className="w-5 h-5" />
              ) : (
                <HiChevronDown className="w-5 h-5 text-[#C39E96]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Section Content */}
      {(!collapsible || isOpen) && (
        <div className="p-5 sm:p-7 space-y-6">{children}</div>
      )}
    </div>
  );
}
