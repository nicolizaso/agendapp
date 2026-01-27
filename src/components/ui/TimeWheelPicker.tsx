import { useEffect, useRef, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimeWheelPickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
const ITEM_HEIGHT = 40; // h-10 in tailwind is 2.5rem = 40px usually.
// However, relying on pixels is safer for scroll math.
// I'll style with h-[40px].

export function TimeWheelPicker({ value, onChange }: TimeWheelPickerProps) {
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Sync state with prop value
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHours(h);
      setMinutes(m);
    }
  }, [value]);

  // Initial scroll to position logic is handled below on mount

  useEffect(() => {
     // Scroll on mount
     const timer = setTimeout(() => {
        // Parse value prop directly to avoid stale state closure
        let initialHours = '12';
        let initialMinutes = '00';

        if (value && value.includes(':')) {
            const [h, m] = value.split(':');
            initialHours = h;
            initialMinutes = m;
        }

        if (hourRef.current) {
            const hIndex = HOURS.indexOf(initialHours);
            if (hIndex !== -1) hourRef.current.scrollTo({ top: hIndex * ITEM_HEIGHT, behavior: 'smooth' });
        }
        if (minuteRef.current) {
            // simplified matching
            const val = parseInt(initialMinutes);
            const closest = MINUTES.reduce((prev, curr) =>
               Math.abs(parseInt(curr) - val) < Math.abs(parseInt(prev) - val) ? curr : prev
            );
            const mIndex = MINUTES.indexOf(closest);
            if (mIndex !== -1) minuteRef.current.scrollTo({ top: mIndex * ITEM_HEIGHT, behavior: 'smooth' });
        }
     }, 50); // Small delay to ensure render
     return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleScroll = (type: 'hours' | 'minutes') => {
    const ref = type === 'hours' ? hourRef : minuteRef;
    if (!ref.current) return;

    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);

    if (type === 'hours') {
        const newHour = HOURS[Math.min(index, HOURS.length - 1)];
        if (newHour && newHour !== hours) {
             // We don't setHours immediately to avoid jitter or loop?
             // Actually we should, to update the visual if needed, but the scroll drives the value.
             // We should call onChange eventually.
             const newTime = `${newHour}:${minutes}`;
             if (newTime !== value) onChange(newTime);
        }
    } else {
        const newMinute = MINUTES[Math.min(index, MINUTES.length - 1)];
        if (newMinute && newMinute !== minutes) {
             const newTime = `${hours}:${newMinute}`;
             if (newTime !== value) onChange(newTime);
        }
    }
  };

  // Helper to snap manually on click
  const scrollToItem = (type: 'hours' | 'minutes', val: string) => {
     const ref = type === 'hours' ? hourRef : minuteRef;
     const list = type === 'hours' ? HOURS : MINUTES;
     const index = list.indexOf(val);
     if (ref.current && index !== -1) {
        ref.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
     }
  };

  return (
    <div className="flex h-[160px] relative bg-neutral-900 rounded-lg overflow-hidden select-none">
       {/* Overlay Center Bar */}
       <div className="absolute top-1/2 left-0 w-full h-[40px] -translate-y-1/2 bg-neutral-800/30 border-y border-neutral-700/50 pointer-events-none z-10" />

       {/* Hours Column */}
       <div
         ref={hourRef}
         onScroll={() => handleScroll('hours')}
         className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar text-center"
         style={{ scrollbarWidth: 'none' }}
       >
          <div className="h-[60px]" /> {/* Top Padding (160-40)/2 */}
          {HOURS.map((h) => (
             <div
               key={h}
               onClick={() => scrollToItem('hours', h)}
               className={cn(
                  "h-[40px] flex items-center justify-center snap-center cursor-pointer transition-colors",
                  hours === h ? "text-white font-bold text-xl" : "text-neutral-500 text-base"
               )}
             >
                {h}
             </div>
          ))}
          <div className="h-[60px]" /> {/* Bottom Padding */}
       </div>

       {/* Separator */}
       <div className="flex items-center justify-center text-red-500 font-bold z-20 pb-1">:</div>

       {/* Minutes Column */}
       <div
         ref={minuteRef}
         onScroll={() => handleScroll('minutes')}
         className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar text-center"
         style={{ scrollbarWidth: 'none' }}
       >
          <div className="h-[60px]" />
          {MINUTES.map((m) => (
             <div
               key={m}
               onClick={() => scrollToItem('minutes', m)}
               className={cn(
                  "h-[40px] flex items-center justify-center snap-center cursor-pointer transition-colors",
                  // Approximate check for minute highlighting (since we might have 03 but list has 00, 05)
                  // But our logic snaps to list items, so strict equality is fine after snap.
                  minutes === m ? "text-white font-bold text-xl" : "text-neutral-500 text-base"
               )}
             >
                {m}
             </div>
          ))}
          <div className="h-[60px]" />
       </div>
    </div>
  );
}
