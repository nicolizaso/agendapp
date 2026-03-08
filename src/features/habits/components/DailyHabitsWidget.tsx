import { useEffect, useState } from 'react';
import { useHabits } from '../../../hooks/useHabits';
import { useStore } from '../../../lib/store';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Card';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CreateHabitModal } from './CreateHabitModal';
import { Button } from '../../../components/Button';
import { Plus } from 'lucide-react';

export function DailyHabitsWidget() {
  const { habits, fetchHabits, isLoading: habitsLoading } = useHabits();
  const { habitLogs, toggleHabitLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  if (habitsLoading && habits.length === 0) return null;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = new Set(habitLogs.filter(log => log.date === todayStr).map(log => log.habitId));

  return (
    <>
      <Card className="rounded-2xl bg-neutral-900/40 backdrop-blur border-neutral-800 animate-in slide-in-from-bottom-2 duration-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-heading text-neutral-200">
                Hábitos de Hoy
            </CardTitle>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(true)}
                className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            >
                <Plus className="w-5 h-5" />
            </Button>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-4 text-neutral-500 text-sm">
                No hay hábitos creados aún.
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map(habit => {
                if (!habit.id) return null;
                const isCompleted = todayLogs.has(habit.id);

                return (
                  <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-800/50 bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.emoji}</span>
                      <span className="font-medium text-neutral-200">{habit.title}</span>
                    </div>
                    <button
                        onClick={() => habit.id && toggleHabitLog(habit.id, todayStr)}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isCompleted ? habit.color : "bg-neutral-800 border border-neutral-700"
                        )}
                    >
                        {isCompleted && <Check className="w-5 h-5 text-white" />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <CreateHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}