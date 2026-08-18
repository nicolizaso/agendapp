import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, TrendingUp } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { buildProgressionTable, weekIndexForDate, WEEKS_PER_BLOCK } from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import { ScheduleSessionModal } from '../../agenda/components/ScheduleSessionModal';
import type { PlanExercise, TrainingPlan } from '../../../types';

const WEEKS_TO_SHOW = 12;
const EMPTY_PLAN_EXERCISES: PlanExercise[] = [];

interface PlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TrainingPlan;
}

export function PlanDetailModal({ isOpen, onClose, plan }: PlanDetailModalProps) {
  const getPlanExercises = useAgendaStore((state) => state.getPlanExercises);
  const exercises =
    useAgendaStore((state) => state.planExercisesByPlan[plan.id as number]) ?? EMPTY_PLAN_EXERCISES;
  const catalog = useGymStore((state) => state.exercises);

  const [isScheduling, setIsScheduling] = useState(false);
  const currentWeekIndex = weekIndexForDate(new Date(plan.startDate), new Date());

  useEffect(() => {
    if (isOpen && typeof plan.id === 'number') getPlanExercises(plan.id);
  }, [isOpen, plan.id, getPlanExercises]);

  const columns = useMemo(
    () =>
      exercises.map((planExercise) => {
        const definition = catalog.find((item) => item.id === planExercise.exerciseId);
        return {
          key: planExercise.id ?? planExercise.exerciseId,
          name: definition?.name ?? 'Ejercicio no disponible',
          targets: buildProgressionTable(
            planExercise.initialWeight,
            planExercise.equipmentType,
            WEEKS_TO_SHOW,
            planExercise.incrementOverride
          ),
        };
      }),
    [exercises, catalog]
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={plan.name}
        description="Progresión de peso semana a semana. La semana en curso se calcula sola según la fecha."
        size="xl"
      >
        {columns.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">Este plan todavía no tiene ejercicios.</p>
        ) : (
          <div className="space-y-4">
            {typeof plan.id === 'number' && (
              <Button variant="outline" onClick={() => setIsScheduling(true)}>
                <CalendarPlus className="h-4 w-4" /> Agendar este plan
              </Button>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-ink-900 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      Semana
                    </th>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-500"
                      >
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: WEEKS_TO_SHOW }, (_, weekIndex) => (
                    <tr
                      key={weekIndex}
                      className={cn(
                        'border-t border-ink-800',
                        weekIndex % WEEKS_PER_BLOCK === 0 && weekIndex > 0 && 'border-t-2 border-t-ember-500/30',
                        weekIndex === currentWeekIndex && 'bg-ember-500/5'
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-ink-900 px-3 py-2 font-semibold text-ink-200">
                        Semana {weekIndex + 1}
                        {weekIndex === currentWeekIndex && (
                          <span className="ml-2 rounded-full border border-ember-500/40 bg-ember-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ember-300">
                            Actual
                          </span>
                        )}
                      </td>
                      {columns.map((column) => {
                        const target = column.targets[weekIndex];
                        return (
                          <td key={column.key} className="px-3 py-2 tabular-nums text-ink-300">
                            {target.sets}x{target.reps} · {target.weight} kg
                            {target.isWeightIncrease && (
                              <TrendingUp className="ml-1 inline h-3.5 w-3.5 text-ember-400" aria-label="Sube el peso" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {isScheduling && typeof plan.id === 'number' && (
        <ScheduleSessionModal isOpen onClose={() => setIsScheduling(false)} prefill={{ planId: plan.id }} />
      )}
    </>
  );
}
