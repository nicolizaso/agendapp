import { useEffect, useState } from 'react';
import { useHabits } from '../../hooks/useHabits';
import { useStore } from '../../lib/store';
import { CreateHabitModal } from './components/CreateHabitModal';
import { Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../components/Button';

export function HabitTracker() {
  const { habits, fetchHabits, isLoading: habitsLoading } = useHabits();
  const { habitLogs, toggleHabitLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  if (habitsLoading && habits.length === 0) return null;

  // Generate last 14 days
  const today = new Date();
  const pastDays = eachDayOfInterval({
    start: subDays(today, 13),
    end: today
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading font-bold text-neutral-100">
          Tracker de Hábitos
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Hábito
        </Button>
      </div>

      <div className="grid gap-4">
        {habits.length === 0 ? (
           <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/50">
               No hay hábitos aún. Crea uno para empezar tu racha.
           </div>
        ) : (
          habits.map((habit) => {
            if (!habit.id) return null;
            return (
              <Card key={habit.id} className="bg-neutral-900/40 border-neutral-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                       <span className="text-3xl drop-shadow-sm">{habit.emoji}</span>
                       <CardTitle className="text-xl text-neutral-200">{habit.title}</CardTitle>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> Historial de 14 días
                      </span>
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="flex overflow-x-auto pb-2 gap-1.5 hide-scrollbar mt-2">
                       {pastDays.map((day) => {
                           const dateStr = format(day, 'yyyy-MM-dd');
                           const isCompleted = habitLogs.some(l => l.habitId === habit.id && l.date === dateStr);

                           return (
                               <button
                                   key={dateStr}
                                   onClick={() => habit.id && toggleHabitLog(habit.id, dateStr)}
                                   className="group flex flex-col items-center shrink-0 w-10 sm:w-12 gap-1.5"
                               >
                                   <div className={cn(
                                       "w-full aspect-square rounded-md transition-all flex items-center justify-center border",
                                       isCompleted
                                        ? cn(habit.color, "border-transparent text-white shadow-sm")
                                        : "bg-neutral-900/50 border-neutral-800 text-transparent hover:border-neutral-600"
                                   )}>
                                       {isCompleted && <CheckCircle2 className="w-4 h-4 opacity-80" />}
                                   </div>
                                   <div className="text-[10px] text-neutral-500 font-medium">
                                       {format(day, 'dd', { locale: es })}
                                   </div>
                                   <div className="text-[9px] text-neutral-600 uppercase">
                                       {format(day, 'EE', { locale: es })}
                                   </div>
                               </button>
                           );
                       })}
                   </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <CreateHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}