import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, SkipForward } from 'lucide-react';
import { useGymStore } from '../../../hooks/useGymStore';
import { cn } from '../../../lib/utils';

const CIRCUMFERENCE = 2 * Math.PI * 38;

/**
 * Cronómetro de descanso. Vive pegado al borde inferior, por encima de la
 * barra de acciones, y desaparece solo cuando llega a cero.
 */
export function RestOverlay() {
  const restTimerTarget = useGymStore((state) => state.restTimerTarget);
  const restTimerDuration = useGymStore((state) => state.restTimerDuration);
  const adjustRestTimer = useGymStore((state) => state.adjustRestTimer);
  const stopRestTimer = useGymStore((state) => state.stopRestTimer);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const hasBuzzed = useRef(false);

  useEffect(() => {
    if (!restTimerTarget) return;

    hasBuzzed.current = false;

    const tick = () => {
      const remaining = Math.ceil((restTimerTarget - Date.now()) / 1000);

      if (remaining <= 0) {
        setSecondsLeft(0);
        if (!hasBuzzed.current) {
          hasBuzzed.current = true;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([180, 90, 180]);
          }
        }
        stopRestTimer();
        return;
      }

      setSecondsLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 250);

    // Al volver del bloqueo de pantalla el contador debe estar al día.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', tick);
    };
  }, [restTimerTarget, stopRestTimer]);

  if (!restTimerTarget) return null;

  const progress = Math.max(0, Math.min(1, secondsLeft / Math.max(1, restTimerDuration)));
  const isFinalStretch = secondsLeft <= 10;

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-200 border-t border-ink-800 bg-ink-900/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
        <div className="relative h-[86px] w-[86px] shrink-0">
          <svg viewBox="0 0 86 86" className="h-full w-full -rotate-90">
            <circle cx="43" cy="43" r="38" fill="none" strokeWidth="5" className="stroke-ink-800" />
            <circle
              cx="43"
              cy="43"
              r="38"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className={cn(
                'transition-[stroke-dashoffset] duration-200 ease-linear',
                isFinalStretch ? 'stroke-ember-500' : 'stroke-mint-400'
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                'font-heading text-xl font-bold tabular-nums leading-none',
                isFinalStretch ? 'text-ember-400' : 'text-ink-100'
              )}
            >
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-ink-500">
              Descanso
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => adjustRestTimer(-15)}
            className="flex h-12 items-center justify-center gap-1 rounded-xl border border-ink-700 bg-ink-850 text-sm font-semibold text-ink-200 transition-colors active:scale-[0.97]"
          >
            <Minus className="h-4 w-4" /> 15s
          </button>
          <button
            type="button"
            onClick={() => adjustRestTimer(15)}
            className="flex h-12 items-center justify-center gap-1 rounded-xl border border-ink-700 bg-ink-850 text-sm font-semibold text-ink-200 transition-colors active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" /> 15s
          </button>
          <button
            type="button"
            onClick={stopRestTimer}
            className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-ember-500 text-sm font-bold text-ink-950 transition-colors active:scale-[0.97]"
          >
            <SkipForward className="h-4 w-4" /> Saltar descanso
          </button>
        </div>
      </div>
    </div>
  );
}
