import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, TrendingUp } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { db } from '../../../lib/db';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { buildProgressionTable, isPlanFinished, weekIndexForPlanDay, WEEKS_PER_BLOCK } from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import { ScheduleSessionModal } from '../../agenda/components/ScheduleSessionModal';
import type { PlanExercise, TrainingPlan } from '../../../types';

const WEEKS_TO_SHOW = 12;
const EMPTY_PLAN_EXERCISES: PlanExercise[] = [];
const EMPTY_EXERCISE_IDS: number[] = [];

interface PlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TrainingPlan;
}

export function PlanDetailModal({ isOpen, onClose, plan }: PlanDetailModalProps) {
  const getPlanDays = useAgendaStore((state) => state.getPlanDays);
  const getPlanExercises = useAgendaStore((state) => state.getPlanExercises);
  const planDays = useAgendaStore((state) => state.planDays);
  const exercisesByPlanDay = useAgendaStore((state) => state.planExercisesByPlanDay);
  const sessions = useAgendaStore((state) => state.sessions);
  const catalog = useGymStore((state) => state.exercises);
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);

  const [isScheduling, setIsScheduling] = useState(false);
  // Orden real de los ejercicios de la rutina de cada día (el plan no guarda orden propio).
  const [routineExerciseIdsByDay, setRoutineExerciseIdsByDay] = useState<Record<number, number[]>>({});
  const [activeDayId, setActiveDayId] = useState<number | null>(null);

  const finished = isPlanFinished(plan);
  const days = useMemo(
    () => (typeof plan.id === 'number' ? planDays.filter((day) => day.planId === plan.id) : []),
    [planDays, plan.id]
  );

  useEffect(() => {
    if (isOpen && typeof plan.id === 'number') getPlanDays(plan.id);
    getRoutines();
  }, [isOpen, plan.id, getPlanDays, getRoutines]);

  useEffect(() => {
    if (days.length === 0) return;
    for (const day of days) {
      if (typeof day.id === 'number') getPlanExercises(day.id);
    }
    setActiveDayId((current) => (current && days.some((day) => day.id === current) ? current : (days[0].id ?? null)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        days.map(async (day) => {
          if (typeof day.id !== 'number') return [0, []] as const;
          const routineExercises = await db.routineExercises.where('routineId').equals(day.routineId).sortBy('order');
          return [day.id, routineExercises.map((item) => item.exerciseId)] as const;
        })
      );
      if (!cancelled) setRoutineExerciseIdsByDay(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [days]);

  const activeDay = days.find((day) => day.id === activeDayId) ?? null;
  const routine = activeDay ? routines.find((item) => item.id === activeDay.routineId) : undefined;
  const routineExerciseIds = activeDay?.id ? routineExerciseIdsByDay[activeDay.id] ?? EMPTY_EXERCISE_IDS : EMPTY_EXERCISE_IDS;
  const dayExercises = activeDay?.id ? exercisesByPlanDay[activeDay.id] ?? EMPTY_PLAN_EXERCISES : EMPTY_PLAN_EXERCISES;
  const currentWeekIndex = activeDay?.id ? weekIndexForPlanDay(plan, activeDay.id, sessions) : 0;

  const columns = useMemo(
    () =>
      routineExerciseIds
        .map((exerciseId) => dayExercises.find((item) => item.exerciseId === exerciseId))
        .filter((item): item is PlanExercise => Boolean(item))
        .map((planExercise) => {
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
    [routineExerciseIds, dayExercises, catalog]
  );

  const unconfiguredCount = routineExerciseIds.length - columns.length;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={plan.name}
        description="Cada día progresa por su cuenta: la semana en curso se calcula sola según los turnos agendados de ese día que ya pasaron."
        size="xl"
      >
        {days.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">Este plan todavía no tiene días configurados.</p>
        ) : (
          <div className="space-y-4">
            {days.length > 1 && (
              <div className="flex flex-wrap gap-1.5 rounded-2xl border border-ink-800 bg-ink-900 p-1.5">
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id ?? null)}
                    className={cn(
                      'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                      activeDayId === day.id ? 'bg-ember-500 text-ink-950' : 'text-ink-400 hover:text-ink-100'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}

            {finished && (
              <p className="rounded-card border border-ink-800 bg-ink-900/40 px-4 py-3 text-sm text-ink-400">
                Este plan ya terminó ({new Date(plan.endDate as Date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}). No se pueden agendar turnos nuevos con él.
              </p>
            )}

            {!routine ? (
              <p className="py-8 text-center text-sm text-flare-400">
                La rutina de "{activeDay?.label}" fue eliminada, así que no tiene ejercicios para mostrar.
              </p>
            ) : columns.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">
                {routineExerciseIds.length === 0
                  ? 'Esta rutina todavía no tiene ejercicios.'
                  : 'Editá el plan para configurar el peso inicial de los ejercicios de este día.'}
              </p>
            ) : (
              <>
                {unconfiguredCount > 0 && (
                  <p className="rounded-card border border-ember-500/30 bg-ember-500/5 px-4 py-3 text-sm text-ember-300">
                    Hay {unconfiguredCount} ejercicio{unconfiguredCount > 1 ? 's' : ''} de la rutina sin peso inicial
                    configurado. Editá el plan para sumarlo{unconfiguredCount > 1 ? 's' : ''} a la progresión.
                  </p>
                )}
                {typeof plan.id === 'number' && activeDay?.id && !finished && (
                  <Button variant="outline" onClick={() => setIsScheduling(true)}>
                    <CalendarPlus className="h-4 w-4" /> Agendar "{activeDay.label}"
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
              </>
            )}
          </div>
        )}
      </Modal>

      {isScheduling && typeof plan.id === 'number' && activeDay?.id && (
        <ScheduleSessionModal
          isOpen
          onClose={() => setIsScheduling(false)}
          prefill={{ planId: plan.id, planDayId: activeDay.id }}
        />
      )}
    </>
  );
}
