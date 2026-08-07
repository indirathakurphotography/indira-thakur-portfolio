'use client';

interface FieldInputProps {
  label: string;
  helperText?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
}

export default function FieldInput({ label, helperText, value, onChange, placeholder, type = 'text', required, maxLength, error }: FieldInputProps) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70 mb-1">
        {label} {required && <span className="text-magenta">*</span>}
      </label>
      {helperText && <p className="font-sans text-[10px] text-warm-gray/40 mb-1.5 italic">{helperText}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-300' : 'border-cream/60'} text-rich-black font-sans text-sm rounded focus:outline-none focus:border-magenta/40 transition-colors`}
      />
      {maxLength && <p className="font-sans text-[9px] text-warm-gray/30 mt-0.5">{value.length}/{maxLength}</p>}
      {error && <p className="font-sans text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}