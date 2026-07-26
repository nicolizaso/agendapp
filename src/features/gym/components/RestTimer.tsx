import { useEffect, useState } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Plus, Timer } from 'lucide-react';
import { Button } from '../../../components/Button';

export function RestTimer() {
  const { restTimerTarget, stopRestTimer, startRestTimer, restTimerDuration } = useGymStore();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!restTimerTarget) {
        setTimeLeft(0);
        return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((restTimerTarget - now) / 1000);

      if (diff <= 0) {
        stopRestTimer();
        // Optional: Vibration or Sound here
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } else {
        setTimeLeft(diff);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [restTimerTarget, stopRestTimer]);

  if (!restTimerTarget) return null;

  const progress = Math.min(100, (timeLeft / restTimerDuration) * 100);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-4 z-50 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">

        {/* Timer Display */}
        <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center bg-neutral-800 rounded-full">
                <Timer className="w-5 h-5 text-lime-400 animate-pulse" />
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                        cx="24" cy="24" r="20"
                        fill="none" strokeWidth="2"
                        stroke="currentColor"
                        className="text-neutral-700"
                    />
                    <circle
                        cx="24" cy="24" r="20"
                        fill="none" strokeWidth="2"
                        stroke="currentColor"
                        className="text-lime-400 transition-all duration-1000 ease-linear"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 - (125.6 * progress) / 100}
                    />
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="text-sm text-neutral-400 font-medium">Descanso</span>
                <span className="text-2xl font-bold font-heading text-white tabular-nums">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                onClick={() => startRestTimer(timeLeft + 30)}
                className="bg-neutral-800 text-white hover:bg-neutral-700 h-10 rounded-full px-3 gap-1"
            >
                <Plus className="w-4 h-4" /> 30s
            </Button>
            <Button
                variant="ghost"
                onClick={stopRestTimer}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 h-10 rounded-full px-3"
            >
                Saltear
            </Button>
        </div>
      </div>

      {/* Linear Progress Bar at strict bottom */}
      <div className="absolute bottom-0 left-0 h-1 bg-lime-600 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
    </div>
  );
}
