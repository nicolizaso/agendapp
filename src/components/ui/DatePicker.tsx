import React, { useState, useRef, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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

  // Sync current month if value changes drastically? Maybe not necessary for UX,
  // but if external change happens, we might want to update.
  // For now, let's keep internal navigation independent unless opened.

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

  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const selectedDate = value ? parseISO(value) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2",
          "bg-rose-900/50 border border-rose-800 rounded-md p-2",
          "text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500",
          "transition-all duration-200"
        )}
      >
        <CalendarIcon size={18} className="text-rose-400" />
        <span className={cn(!value && "text-rose-400/70")}>
            {value ? format(parseISO(value), "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-rose-950 border border-rose-800 rounded-xl shadow-2xl w-[320px] animate-in fade-in zoom-in-95 duration-100 left-0 sm:left-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-rose-900 rounded-full text-rose-300">
                <ChevronLeft size={20} />
            </button>
            <h3 className="font-heading font-semibold text-stone-200 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-rose-900 rounded-full text-rose-300">
                <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-rose-400 py-1">
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
                        onClick={() => handleDayClick(day)}
                        className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors relative",
                            !isCurrentMonth && "text-rose-900/40 invisible", // Hide non-current month days for cleaner look or make them faint
                            isCurrentMonth && !isSelected && "text-stone-300 hover:bg-rose-900/50",
                            isSelected && "bg-rose-600 text-white shadow-md shadow-rose-900/50 font-bold",
                            isTodayDate && !isSelected && "ring-1 ring-rose-500 text-rose-400"
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
