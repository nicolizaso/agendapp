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
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-h-[50vh] z-[9999] overflow-y-auto overscroll-contain bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl p-2",
              "md:absolute md:top-full md:left-0 md:translate-x-0 md:translate-y-1 md:w-full md:max-h-60 md:rounded-lg md:border-neutral-800 md:shadow-xl md:p-1"
            )}
          >
            <div className="space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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
                      <div
                        className={cn(
                          "p-1.5 rounded-md",
                          opt.bgClass,
                          opt.colorClass
                        )}
                      >
                        <opt.icon size={16} />
                      </div>
                    )}
                    <span className="text-neutral-200 text-base font-medium">
                      {opt.label}
                    </span>
                  </div>
                  {value === opt.value && (
                    <Check size={16} className="text-red-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
