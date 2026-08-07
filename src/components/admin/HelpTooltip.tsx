'use client';

import { useState } from 'react';
import { HiQuestionMarkCircle } from 'react-icons/hi2';

interface HelpTooltipProps {
  text: string;
}

export default function HelpTooltip({ text }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-warm-gray/30 hover:text-warm-gray/60 transition-colors"
      >
        <HiQuestionMarkCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-rich-black text-white text-[10px] font-sans rounded-lg shadow-lg whitespace-nowrap max-w-xs">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-rich-black" />
        </span>
      )}
    </span>
  );
}
