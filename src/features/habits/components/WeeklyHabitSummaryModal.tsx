import { useState, useMemo } from 'react';
import { useStore } from '../../../lib/store';
import { useHabits } from '../../../hooks/useHabits';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Ticket } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { HabitClaim } from '../../../types';

interface WeeklyHabitSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStartDate: string;
  claimId: string;
}

export function WeeklyHabitSummaryModal({ isOpen, onClose, weekStartDate, claimId }: WeeklyHabitSummaryModalProps) {
  const { habitLogs, categories, addHabitClaim } = useStore();
  const { habits } = useHabits();
  const [view, setView] = useState<'grid' | 'claim'>('grid');

  const startDate = parseISO(weekStartDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Compute stats
  const stats = useMemo(() => {
    return habits.map(habit => {
      const logsForWeek = weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return habitLogs.some(log => log.habitId === habit.id && log.date === dateStr);
      });
      const totalChecks = logsForWeek.filter(Boolean).length;
      const earnedTicket = totalChecks >= 4;

      return {
        habit,
        logs: logsForWeek,
        totalChecks,
        earnedTicket,
      };
    });
  }, [habits, habitLogs, weekDays]);

  // Consolidate tickets
  const consolidatedTickets = useMemo(() => {
    const totals: Record<string, number> = {};
    stats.forEach(({ habit, earnedTicket }) => {
      if (earnedTicket && habit.categoryId) {
        totals[habit.categoryId] = (totals[habit.categoryId] || 0) + 1;
      }
    });
    return Object.entries(totals).map(([categoryId, amount]) => ({ categoryId, amount }));
  }, [stats]);

  const handleClaim = async () => {
    const claim: HabitClaim = {
      id: claimId,
      weekStartDate,
      claimedAt: new Date().toISOString(),
      earnedTickets: consolidatedTickets
    };
    await addHabitClaim(claim);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={view === 'grid' ? "Resumen de la Semana Pasada" : "¡Recompensas Semanales!"} size="lg">
      {view === 'grid' ? (
        <div className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-neutral-400 font-medium border-b border-neutral-800">Hábito</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} className="p-2 text-neutral-400 font-medium text-center border-b border-neutral-800">
                      {format(day, 'EE', { locale: es }).toUpperCase()}
                    </th>
                  ))}
                  <th className="p-2 text-neutral-400 font-medium text-center border-b border-neutral-800">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(({ habit, logs, earnedTicket }) => (
                  <tr key={habit.id} className="border-b border-neutral-800/50">
                    <td className="p-2 py-4 font-medium text-neutral-200">
                      <span className="mr-2">{habit.emoji}</span>
                      {habit.title}
                    </td>
                    {logs.map((checked, idx) => (
                      <td key={idx} className="p-2 text-center">
                        {checked ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-neutral-700 mx-auto" />
                        )}
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      {earnedTicket ? (
                        <span className="flex items-center justify-center gap-1 font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md text-sm">
                          1 <Ticket className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-sm font-medium">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
            <p className="text-sm text-neutral-400">
              <span className="font-bold text-neutral-200">Regla:</span> 4 días o más = 1 Ticket de la categoría del hábito.
            </p>
            <Button onClick={() => setView('claim')}>
              Siguiente
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 py-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-100">¡Gran trabajo!</h2>
            <p className="text-neutral-400">Estos son tus tickets de la semana:</p>
          </div>

          {consolidatedTickets.length === 0 ? (
            <div className="py-8 text-neutral-500">
              No obtuviste tickets esta semana. ¡Sigue esforzándote!
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {consolidatedTickets.map(ticket => {
                const cat = categories.find(c => c.id === ticket.categoryId);
                if (!cat) return null;
                return (
                  <div key={ticket.categoryId} className={cn("flex items-center gap-3 px-6 py-4 rounded-2xl border", cat.bg, cat.border)}>
                     <span className="text-3xl font-bold text-neutral-100">{ticket.amount}</span>
                     <Ticket className={cn("w-8 h-8", cat.color)} />
                     <span className={cn("font-medium", cat.color)}>{cat.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4">
            <Button size="lg" className="w-full md:w-auto px-12" onClick={handleClaim}>
              Añadir a mi Billetera
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}