import { useState, useRef, useEffect } from 'react';
import type React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ElementType;
  colorClass?: string;
  bgClass?: string;
}

interface CustomSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = 'Seleccionar...' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = value ? options.find(opt => opt.value === value) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between",
          "bg-neutral-900/50 border border-neutral-800 rounded-md p-3",
          "text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600",
          "transition-all duration-200 text-base"
        )}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
             {selectedOption.icon && (
                 <div className={cn("p-1 rounded-md", selectedOption.bgClass, selectedOption.colorClass)}>
                    <selectedOption.icon size={16} />
                 </div>
             )}
             <span>{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}
        <ChevronDown size={16} className={cn("text-neutral-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
           <div className="p-1 space-y-1">
              {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                    }}
                    className={cn(
                        "w-full flex items-center justify-between p-2 rounded-md transition-colors",
                        "hover:bg-neutral-800",
                        value === opt.value ? "bg-neutral-800" : ""
                    )}
                  >
                     <div className="flex items-center gap-2">
                        {opt.icon && (
                            <div className={cn("p-1.5 rounded-md", opt.bgClass, opt.colorClass)}>
                                <opt.icon size={16} />
                            </div>
                        )}
                        <span className="text-neutral-200 text-base font-medium">{opt.label}</span>
                     </div>
                     {value === opt.value && <Check size={16} className="text-red-500" />}
                  </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
