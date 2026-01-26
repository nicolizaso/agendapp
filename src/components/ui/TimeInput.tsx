import React, { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimeInputProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeInput({ value, onChange, disabled }: TimeInputProps) {
  // Parse initial value or default to current time/00:00
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value && value.includes(':')) {
        const [h, m] = value.split(':');
        setHours(h);
        setMinutes(m);
    }
  }

  const handleChange = (type: 'hours' | 'minutes', val: string) => {
    // Allow only numbers
    if (!/^\d*$/.test(val)) return;

    let newVal = val;

    // Limits
    if (type === 'hours') {
        if (parseInt(newVal) > 23) newVal = '23';
    } else {
        if (parseInt(newVal) > 59) newVal = '59';
    }

    // Auto-advance logic could go here (e.g. typing 2 chars moves focus)
    // but keep it simple for now.

    if (type === 'hours') {
        setHours(newVal);
        updateParent(newVal, minutes);
    } else {
        setMinutes(newVal);
        updateParent(hours, newVal);
    }
  };

  const handleBlur = (type: 'hours' | 'minutes') => {
    let val = type === 'hours' ? hours : minutes;
    if (val === '') val = '00';
    else if (val.length === 1) val = '0' + val; // Pad single digit

    if (type === 'hours') {
        setHours(val);
        updateParent(val, minutes);
    } else {
        setMinutes(val);
        updateParent(hours, val);
    }
  };

  const updateParent = (h: string, m: string) => {
    // Ensure padding before sending
    const padH = h.padStart(2, '0');
    const padM = m.padStart(2, '0');
    onChange(`${padH}:${padM}`);
  };

  return (
    <div className={cn(
        "flex items-center bg-rose-900/50 border border-rose-800 rounded-md overflow-hidden w-full",
        "focus-within:ring-2 focus-within:ring-rose-500",
        disabled && "opacity-50 cursor-not-allowed"
    )}>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={hours}
        onChange={(e) => handleChange('hours', e.target.value)}
        onBlur={() => handleBlur('hours')}
        disabled={disabled}
        className="w-full text-center bg-transparent text-stone-200 focus:outline-none p-2 placeholder-rose-700/50"
        placeholder="HH"
      />
      <span className="text-rose-400 font-bold">:</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={minutes}
        onChange={(e) => handleChange('minutes', e.target.value)}
        onBlur={() => handleBlur('minutes')}
        disabled={disabled}
        className="w-full text-center bg-transparent text-stone-200 focus:outline-none p-2 placeholder-rose-700/50"
        placeholder="MM"
      />
    </div>
  );
}
