import { useState, useRef, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DatePickerProps {
  value: string | null; // Expecting YYYY-MM-DD
  onChange: (date: string | null) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize current month view based on value or today
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? parseISO(value) : new Date()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const selectedDate = value ? parseISO(value) : null;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative w-full">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
        <input
          readOnly
          value={value ? format(parseISO(value), "d 'de' MMMM, yyyy", { locale: es }) : ""}
          placeholder="Seleccionar fecha"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-neutral-900/50 border border-neutral-800 rounded-md py-2 pl-10 pr-10",
            "text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600",
            "transition-all duration-200 text-base cursor-pointer"
          )}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-[320px] animate-in fade-in zoom-in-95 duration-100 left-0 sm:left-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-neutral-800 rounded-full text-neutral-300">
                <ChevronLeft size={20} />
            </button>
            <h3 className="font-heading font-semibold text-neutral-200 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-neutral-800 rounded-full text-neutral-300">
                <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d, i) => (
                <div key={i} className="text-center text-xs font-medium text-neutral-400 py-1">
                    {d}
                </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleDayClick(day, e)}
                        className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors relative",
                            !isCurrentMonth && "text-neutral-700/40 invisible", // Hide non-current month days for cleaner look or make them faint
                            isCurrentMonth && !isSelected && "text-neutral-300 hover:bg-neutral-800",
                            isSelected && "bg-red-600 text-white shadow-md shadow-red-900/20 font-bold",
                            isTodayDate && !isSelected && "ring-1 ring-red-500 text-red-500"
                        )}
                        disabled={!isCurrentMonth}
                    >
                        {format(day, 'd')}
                    </button>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
