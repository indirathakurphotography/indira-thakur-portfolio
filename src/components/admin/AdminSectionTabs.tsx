'use client';

import React from 'react';
import {
  HiDocumentText,
  HiPhoto,
  HiPaintBrush,
  HiCog6Tooth,
} from 'react-icons/hi2';

export type AdminTabId = 'content' | 'media' | 'typography' | 'settings';

export interface AdminTabItem {
  id: AdminTabId | string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: 'default' | 'amber' | 'emerald';
}

export interface AdminSectionTabsProps {
  tabs?: AdminTabItem[];
  activeTab: string;
  onChangeTab?: (tabId: string) => void;
  onChange?: (tabId: string) => void;
  className?: string;
}

const DEFAULT_TABS: AdminTabItem[] = [
  { id: 'content', label: 'Content', icon: HiDocumentText },
  { id: 'media', label: 'Media', icon: HiPhoto },
  { id: 'typography', label: 'Typography', icon: HiPaintBrush },
  { id: 'settings', label: 'Settings', icon: HiCog6Tooth },
];

export default function AdminSectionTabs({
  tabs = DEFAULT_TABS,
  activeTab,
  onChangeTab,
  onChange,
  className = '',
}: AdminSectionTabsProps) {
  const handleTabChange = (id: string) => {
    if (onChange) onChange(id);
    else if (onChangeTab) onChangeTab(id);
  };
  return (
    <div className={`bg-white border-b border-[#E7DDD2] px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-sans font-medium uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#2B2625] text-[#2B2625] font-semibold bg-[#FAF6F3]/50'
                  : 'border-transparent text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3]/30'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#C39E96]' : 'text-[#7C706D]'
                  }`}
                />
              )}
              <span>{tab.label}</span>

              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    tab.badgeColor === 'amber'
                      ? 'bg-amber-100 text-amber-800'
                      : tab.badgeColor === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#FAF6F3] text-[#7C706D] border border-[#E7DDD2]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
