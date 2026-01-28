import { Lock } from 'lucide-react';
import { clsx } from 'clsx';
import type { Achievement } from '../utils/types';

interface Props {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: Props) {
  const { title, description, icon: Icon, level, isUnlocked, progress, maxProgress } = achievement;

  // Level Styling
  const levelStyles = {
    BRONZE: 'border-amber-700/50 text-amber-500 bg-amber-900/10',
    SILVER: 'border-neutral-400/50 text-neutral-300 bg-neutral-900/10',
    GOLD: 'border-yellow-500/50 text-yellow-400 bg-yellow-900/10',
    PLATINUM: 'border-cyan-400/50 text-cyan-400 bg-cyan-900/10',
    FIRE: 'border-red-500/50 text-red-500 bg-red-900/10'
  };

  const currentStyle = levelStyles[level] || levelStyles.BRONZE;

  return (
    <div
      className={clsx(
        "group relative p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300",
        isUnlocked ? currentStyle : "border-neutral-800 bg-neutral-900/30 opacity-60 grayscale",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      <div className={clsx(
        "mb-3 p-3 rounded-full transition-all duration-500",
        isUnlocked ? "bg-white/5 ring-1 ring-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]" : "bg-neutral-800"
      )}>
        {isUnlocked ? (
          <Icon className="w-8 h-8" />
        ) : (
          <Lock className="w-8 h-8 text-neutral-600" />
        )}
      </div>

      <h4 className="font-heading font-bold text-sm md:text-base mb-1 text-neutral-200">
        {title}
      </h4>

      {/* Hover Reveal / Details */}
      <div className="text-xs text-neutral-400">
         {description}
      </div>

      {/* Progress Bar */}
      <div className="w-full mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
            className={clsx("h-full transition-all duration-1000", isUnlocked ? "bg-current" : "bg-neutral-600")}
            style={{ width: `${Math.min((progress / maxProgress) * 100, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-neutral-500 font-mono">
        {progress} / {maxProgress}
      </div>
    </div>
  );
}
