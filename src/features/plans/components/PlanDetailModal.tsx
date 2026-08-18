import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, TrendingUp } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { db } from '../../../lib/db';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { buildProgressionTable, isPlanFinished, weekIndexForPlan, WEEKS_PER_BLOCK } from '../../../lib/progression';
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
  const sessions = useAgendaStore((state) => state.sessions);
  const catalog = useGymStore((state) => state.exercises);
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);

  const [isScheduling, setIsScheduling] = useState(false);
  // Orden real de los ejercicios de la rutina (el plan no guarda orden propio).
  const [routineExerciseIds, setRoutineExerciseIds] = useState<number[]>([]);

  const finished = isPlanFinished(plan);
  const routine = routines.find((item) => item.id === plan.routineId);
  const currentWeekIndex = weekIndexForPlan(plan, sessions);

  useEffect(() => {
    if (isOpen && typeof plan.id === 'number') getPlanExercises(plan.id);
    getRoutines();
  }, [isOpen, plan.id, getPlanExercises, getRoutines]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const routineExercises =
        isOpen && plan.routineId
          ? await db.routineExercises.where('routineId').equals(plan.routineId).sortBy('order')
          : [];
      if (!cancelled) setRoutineExerciseIds(routineExercises.map((item) => item.exerciseId));
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, plan.routineId]);

  const columns = useMemo(
    () =>
      routineExerciseIds
        .map((exerciseId) => exercises.find((item) => item.exerciseId === exerciseId))
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
    [routineExerciseIds, exercises, catalog]
  );

  const unconfiguredCount = routineExerciseIds.length - columns.length;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={plan.name}
        description={
          routine
            ? `Basado en "${routine.name}". La semana en curso se calcula sola según los turnos agendados que ya pasaron.`
            : 'Progresión de peso semana a semana.'
        }
        size="xl"
      >
        {!routine ? (
          <p className="py-8 text-center text-sm text-flare-400">
            La rutina de este plan fue eliminada, así que no tiene ejercicios para mostrar.
          </p>
        ) : columns.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">
            {routineExerciseIds.length === 0
              ? 'Esta rutina todavía no tiene ejercicios.'
              : 'Editá el plan para configurar el peso inicial de los ejercicios de la rutina.'}
          </p>
        ) : (
          <div className="space-y-4">
            {finished && (
              <p className="rounded-card border border-ink-800 bg-ink-900/40 px-4 py-3 text-sm text-ink-400">
                Este plan ya terminó ({new Date(plan.endDate as Date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}). No se pueden agendar turnos nuevos con él.
              </p>
            )}
            {unconfiguredCount > 0 && (
              <p className="rounded-card border border-ember-500/30 bg-ember-500/5 px-4 py-3 text-sm text-ember-300">
                Hay {unconfiguredCount} ejercicio{unconfiguredCount > 1 ? 's' : ''} de la rutina sin peso inicial
                configurado. Editá el plan para sumarlo{unconfiguredCount > 1 ? 's' : ''} a la progresión.
              </p>
            )}
            {typeof plan.id === 'number' && !finished && (
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
