import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CalendarClock, Check } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { db } from '../../../lib/db';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import {
  buildProgressionTable,
  dateForPlanWeek,
  isPlanFinished,
  totalWeeksForPlanDay,
  weekIndexForPlanDay,
  REPS_BY_PHASE,
  WEEKS_PER_BLOCK,
} from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import { weekdayLabel, weekdayLetter } from '../../../lib/weekdays';
import type { PlanExercise, PlanWeekTarget, TrainingPlan } from '../../../types';

const EMPTY_PLAN_EXERCISES: PlanExercise[] = [];
const EMPTY_EXERCISE_IDS: number[] = [];

interface ProgressionColumn {
  key: number;
  name: string;
  targets: PlanWeekTarget[];
}

interface PlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TrainingPlan;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function PlanDetailModal({ isOpen, onClose, plan }: PlanDetailModalProps) {
  const getPlanDays = useAgendaStore((state) => state.getPlanDays);
  const getPlanExercises = useAgendaStore((state) => state.getPlanExercises);
  const planDays = useAgendaStore((state) => state.planDays);
  const exercisesByPlanDay = useAgendaStore((state) => state.planExercisesByPlanDay);
  const catalog = useGymStore((state) => state.exercises);
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);

  // Orden real de los ejercicios de la rutina de cada día (el plan no guarda orden propio).
  const [routineExerciseIdsByDay, setRoutineExerciseIdsByDay] = useState<Record<number, number[]>>({});
  const [activeDayId, setActiveDayId] = useState<number | null>(null);
  // Semana que se está mirando; arranca en la que toca hoy y se puede recorrer con las fichas.
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

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

  const totalWeeks = activeDay ? Math.max(1, totalWeeksForPlanDay(plan, activeDay.dayOfWeek)) : 1;
  const currentWeek = activeDay ? Math.min(weekIndexForPlanDay(plan, activeDay.dayOfWeek), totalWeeks - 1) : 0;
  const viewedWeek = Math.min(selectedWeek ?? currentWeek, totalWeeks - 1);

  // Al cambiar de día, la vista vuelve a la semana en curso de ese día.
  useEffect(() => {
    setSelectedWeek(null);
  }, [activeDayId]);

  const columns: ProgressionColumn[] = useMemo(
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
              totalWeeks,
              planExercise.incrementOverride
            ),
          };
        }),
    [routineExerciseIds, dayExercises, catalog, totalWeeks]
  );

  const unconfiguredCount = routineExerciseIds.length - columns.length;
  const viewedDate = activeDay ? dateForPlanWeek(plan, activeDay.dayOfWeek, viewedWeek) : null;
  const phaseReps = REPS_BY_PHASE[viewedWeek % WEEKS_PER_BLOCK];
  const weeksToNextBump = WEEKS_PER_BLOCK - (viewedWeek % WEEKS_PER_BLOCK);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan.name}
      description="Cada día de la semana avanza por su cuenta. Tocá una semana para ver con cuánto peso toca entrenar."
      size="lg"
    >
      {days.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">Este plan todavía no tiene días configurados.</p>
      ) : (
        <div className="space-y-4">
          {days.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-ink-800 bg-ink-900 p-1.5 no-scrollbar">
              {days.map((day) => {
                const dayRoutine = routines.find((item) => item.id === day.routineId);
                const isActive = activeDayId === day.id;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id ?? null)}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors',
                      isActive ? 'bg-ember-500 text-ink-950' : 'text-ink-400 hover:text-ink-100'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                        isActive ? 'bg-ink-950/15 text-ink-950' : 'bg-ink-850 text-ink-300'
                      )}
                    >
                      {weekdayLetter(day.dayOfWeek)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{weekdayLabel(day.dayOfWeek)}</span>
                      <span className={cn('block truncate text-[11px]', isActive ? 'text-ink-950/70' : 'text-ink-500')}>
                        {dayRoutine?.name ?? 'Rutina eliminada'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeDay && (
            <p className="flex items-center gap-2 text-xs text-ink-500">
              <CalendarClock className="h-3.5 w-3.5 text-ink-600" />
              Todos los {weekdayLabel(activeDay.dayOfWeek).toLowerCase()} a las {activeDay.time}
              {routine ? ` · ${routine.name}` : ''}
            </p>
          )}

          {finished && (
            <p className="rounded-card border border-ink-800 bg-ink-900/40 px-4 py-3 text-sm text-ink-400">
              Este plan ya terminó el{' '}
              {new Date(plan.endDate as Date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}.
            </p>
          )}

          {!routine ? (
            <p className="py-8 text-center text-sm text-flare-400">
              La rutina de este día fue eliminada, así que no tiene ejercicios para mostrar.
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

              {/* Resumen de la semana que se está mirando */}
              <section className="relative overflow-hidden rounded-card border border-ink-800 bg-ink-900 p-5">
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-ember-500/12 blur-3xl" />

                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                        {viewedWeek === currentWeek ? 'Semana en curso' : 'Semana'}
                      </p>
                      <p className="font-heading text-2xl font-bold text-ink-100">
                        Semana {viewedWeek + 1}
                        <span className="text-base font-semibold text-ink-500"> / {totalWeeks}</span>
                      </p>
                      {viewedDate && <p className="mt-0.5 text-xs capitalize text-ink-500">{shortDate(viewedDate)}</p>}
                    </div>
                    <span className="shrink-0 rounded-xl border border-ember-500/40 bg-ember-500/10 px-3 py-1.5 text-center">
                      <span className="block font-heading text-lg font-bold leading-none text-ember-300">
                        4×{phaseReps}
                      </span>
                      <span className="mt-1 block text-[10px] font-bold uppercase text-ember-400/70">objetivo</span>
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                    <div
                      className="h-full rounded-full bg-ember-500 transition-all duration-300"
                      style={{ width: `${((viewedWeek + 1) / totalWeeks) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-ink-400">
                    {weeksToNextBump === WEEKS_PER_BLOCK && viewedWeek % WEEKS_PER_BLOCK === 0 && viewedWeek > 0
                      ? 'Esta semana sube el peso y las repeticiones vuelven a 8.'
                      : `Faltan ${weeksToNextBump} semana${weeksToNextBump > 1 ? 's' : ''} para el próximo aumento de peso.`}
                  </p>
                </div>
              </section>

              <WeekStrip
                totalWeeks={totalWeeks}
                currentWeek={currentWeek}
                selectedWeek={viewedWeek}
                onSelect={setSelectedWeek}
                dateFor={(week) => (activeDay ? dateForPlanWeek(plan, activeDay.dayOfWeek, week) : new Date())}
              />

              <ul className="space-y-2.5">
                {columns.map((column) => {
                  const target = column.targets[viewedWeek];
                  const previous = viewedWeek > 0 ? column.targets[viewedWeek - 1] : null;
                  const delta = previous ? Math.round((target.weight - previous.weight) * 100) / 100 : 0;
                  const first = column.targets[0];
                  const last = column.targets[column.targets.length - 1];

                  return (
                    <li key={column.key} className="rounded-card border border-ink-800 bg-ink-900 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-100">{column.name}</p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            {first.weight} kg <ArrowUpRight className="inline h-3 w-3" /> {last.weight} kg en todo el plan
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-heading text-xl font-bold tabular-nums text-ink-100">
                            {target.weight}
                            <span className="ml-1 text-sm font-semibold text-ink-500">kg</span>
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-ink-400">
                            {target.sets} × {target.reps}
                          </p>
                        </div>
                      </div>

                      {delta > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-mint-500/30 bg-mint-500/10 px-2 py-0.5 text-[11px] font-bold text-mint-300">
                          <ArrowUpRight className="h-3 w-3" /> +{delta} kg respecto de la semana pasada
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Fichas horizontales de semanas: reemplazan la tabla para moverse por la progresión. */
function WeekStrip({
  totalWeeks,
  currentWeek,
  selectedWeek,
  onSelect,
  dateFor,
}: {
  totalWeeks: number;
  currentWeek: number;
  selectedWeek: number;
  onSelect: (week: number) => void;
  dateFor: (week: number) => Date;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selectedWeek, totalWeeks]);

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
      {Array.from({ length: totalWeeks }, (_, week) => {
        const isSelected = week === selectedWeek;
        const isDone = week < currentWeek;
        const isBlockStart = week % WEEKS_PER_BLOCK === 0;

        return (
          <button
            key={week}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(week)}
            aria-current={week === currentWeek ? 'date' : undefined}
            className={cn(
              'flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-colors',
              isSelected
                ? 'border-ember-500 bg-ember-500/15 text-ember-200'
                : isBlockStart
                  ? 'border-ink-700 bg-ink-900 text-ink-300'
                  : 'border-ink-800 bg-ink-900 text-ink-400 hover:text-ink-100'
            )}
          >
            <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
              {isDone && <Check className="h-3 w-3 text-mint-400" />}S{week + 1}
            </span>
            <span className="text-[10px] tabular-nums text-ink-500">
              {dateFor(week).toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })}
            </span>
            {week === currentWeek && (
              <span className="mt-0.5 h-1 w-1 rounded-full bg-ember-400" aria-label="Semana actual" />
            )}
          </button>
        );
      })}
    </div>
  );
}
