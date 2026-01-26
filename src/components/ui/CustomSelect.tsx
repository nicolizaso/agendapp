import { useState, useRef, useEffect } from 'react';
import type React from 'react';
import {
  Dumbbell,
  Briefcase,
  Heart,
  Sprout,
  Home,
  MoreHorizontal,
  ChevronDown,
  Check,
  GraduationCap,
  Users,
  Cake
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CategoryOption {
  id: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const CATEGORY_CONFIG: Record<string, CategoryOption> = {
  gym: { id: 'gym', label: 'Gym', icon: Dumbbell, colorClass: 'text-orange-300', bgClass: 'bg-orange-500/20' },
  trabajo: { id: 'trabajo', label: 'Trabajo', icon: Briefcase, colorClass: 'text-blue-300', bgClass: 'bg-blue-500/20' },
  salud: { id: 'salud', label: 'Salud', icon: Heart, colorClass: 'text-red-300', bgClass: 'bg-red-500/20' },
  cultivo: { id: 'cultivo', label: 'Cultivo', icon: Sprout, colorClass: 'text-green-300', bgClass: 'bg-green-500/20' },
  casa: { id: 'casa', label: 'Casa', icon: Home, colorClass: 'text-purple-300', bgClass: 'bg-purple-500/20' },
  otros: { id: 'otros', label: 'Otros', icon: MoreHorizontal, colorClass: 'text-gray-300', bgClass: 'bg-gray-500/20' },
  // Fallbacks for existing categories in constants.ts that weren't explicitly styled in prompt, reusing similar logic
  facultad: { id: 'facultad', label: 'Facultad', icon: GraduationCap, colorClass: 'text-indigo-300', bgClass: 'bg-indigo-500/20' },
  amigos: { id: 'amigos', label: 'Amigos', icon: Users, colorClass: 'text-yellow-300', bgClass: 'bg-yellow-500/20' },
  cumpleanos: { id: 'cumpleanos', label: 'Cumpleaños', icon: Cake, colorClass: 'text-pink-300', bgClass: 'bg-pink-500/20' },
};

interface CustomSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CustomSelect({ value, onChange, placeholder = 'Seleccionar...' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = value ? CATEGORY_CONFIG[value] : null;

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
          "bg-rose-900/50 border border-rose-800 rounded-md p-3",
          "text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500",
          "transition-all duration-200"
        )}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2">
             <div className={cn("p-1 rounded-md", selectedCategory.bgClass, selectedCategory.colorClass)}>
                <selectedCategory.icon size={16} />
             </div>
             <span>{selectedCategory.label}</span>
          </div>
        ) : (
          <span className="text-stone-400">{placeholder}</span>
        )}
        <ChevronDown size={16} className={cn("text-rose-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-rose-950 border border-rose-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
           <div className="p-1 space-y-1 max-h-60 overflow-y-auto">
              {Object.values(CATEGORY_CONFIG).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                        onChange(cat.id);
                        setIsOpen(false);
                    }}
                    className={cn(
                        "w-full flex items-center justify-between p-2 rounded-md transition-colors",
                        "hover:bg-rose-900/50",
                        value === cat.id ? "bg-rose-900/80" : ""
                    )}
                  >
                     <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md", cat.bgClass, cat.colorClass)}>
                            <cat.icon size={16} />
                        </div>
                        <span className="text-stone-200 text-sm font-medium">{cat.label}</span>
                     </div>
                     {value === cat.id && <Check size={16} className="text-rose-500" />}
                  </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
