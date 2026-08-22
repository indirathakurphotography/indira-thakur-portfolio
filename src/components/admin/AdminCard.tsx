'use client';

import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

export interface AdminCardProps {
  id?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function AdminCard({
  id,
  title,
  description,
  badge,
  collapsible = false,
  defaultOpen = true,
  headerActions,
  headerAction,
  children,
  className = '',
}: AdminCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const actions = headerActions || headerAction;

  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-[#E7DDD2] shadow-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Card Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between gap-4 ${
          collapsible ? 'cursor-pointer hover:bg-[#FAF6F3]/40' : ''
        } ${isOpen && children ? 'border-b border-[#E7DDD2]/70' : ''}`}
        onClick={() => {
          if (collapsible) setIsOpen(!isOpen);
        }}
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-serif text-base lg:text-lg text-[#2B2625] font-medium tracking-tight">
              {title}
            </h3>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-xs text-[#7C706D] font-sans leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {actions && (
            <div onClick={(e) => e.stopPropagation()}>{actions}</div>
          )}
          {collapsible && (
            <button
              type="button"
              className="p-1 rounded text-[#7C706D] hover:text-[#2B2625] transition-colors"
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

      {/* Card Body */}
      {(!collapsible || isOpen) && (
        <div className="p-6 space-y-5">{children}</div>
      )}
    </div>
  );
}
