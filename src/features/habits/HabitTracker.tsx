import { useEffect, useState } from 'react';
import { useHabits } from '../../hooks/useHabits';
import { CreateHabitModal } from './components/CreateHabitModal';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function HabitTracker() {
  const { habits, todayLogs, fetchHabits, toggleHabit, isLoading } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  if (isLoading && habits.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {habits.map((habit) => {
          const isCompleted = habit.id && todayLogs.has(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => habit.id && toggleHabit(habit.id)}
              className={cn(
                "group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shrink-0",
                isCompleted
                  ? cn(habit.color, "shadow-[0_0_15px_rgba(0,0,0,0.3)] scale-100")
                  : "bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 opacity-80 hover:opacity-100"
              )}
              title={habit.title}
            >
              <span className={cn(
                "text-xl transition-all duration-300 z-10",
                isCompleted ? "scale-110 drop-shadow-md" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
              )}>
                {habit.emoji}
              </span>

              {/* Active Indicator Glow */}
              {isCompleted && (
                <div className={cn(
                    "absolute inset-0 rounded-full blur-md opacity-40",
                    habit.color
                )} />
              )}
            </button>
          );
        })}

        {/* Add Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-10 h-10 rounded-full bg-neutral-900/50 border border-neutral-800 border-dashed hover:border-neutral-600 hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-all active:scale-95 shrink-0"
        >
          <Plus size={20} />
        </button>
      </div>

      <CreateHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
