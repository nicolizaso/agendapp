import { useEffect, useState } from 'react';
import { ArrowUpRight, Dumbbell, Play } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { db } from '../../../lib/db';
import { useGymStore } from '../../../hooks/useGymStore';
import { calculateWeekTarget } from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import type { DayEntry } from '../../../lib/agendaDays';

interface ExerciseLine {
  key: number;
  name: string;
  sets: number;
  reps: string;
  /** Sólo en los días de un plan: el peso que toca esa semana. */
  weight?: number;
  /** true si esta semana el peso subió respecto de la anterior. */
  isWeightIncrease?: boolean;
}

interface DayDetailModalProps {
  date: Date;
  entries: DayEntry[];
  onClose: () => void;
}

function titleForDate(date: Date): string {
  const formatted = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function DayDetailModal({ date, entries, onClose }: DayDetailModalProps) {
  const loadRoutineIntoWorkout = useGymStore((state) => state.loadRoutineIntoWorkout);
  const loadPlanDayIntoWorkout = useGymStore((state) => state.loadPlanDayIntoWorkout);

  const [linesByEntry, setLinesByEntry] = useState<Record<string, ExerciseLine[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const catalog = await db.exercises.toArray();
      const result: Record<string, ExerciseLine[]> = {};

      for (const entry of entries) {
        if (!entry.routineExists) {
          result[entry.key] = [];
          continue;
        }

        const routineExercises = await db.routineExercises
          .where('routineId')
          .equals(entry.routineId)
          .sortBy('order');

        const planExercises = entry.planDayId
          ? await db.planExercises.where('planDayId').equals(entry.planDayId).toArray()
          : [];

        result[entry.key] = routineExercises.map((routineExercise) => {
          const definition = catalog.find((item) => item.id === routineExercise.exerciseId);
          const planExercise = planExercises.find((item) => item.exerciseId === routineExercise.exerciseId);

          if (planExercise && typeof entry.weekIndex === 'number') {
            const target = calculateWeekTarget(
              planExercise.initialWeight,
              planExercise.equipmentType,
              entry.weekIndex,
              planExercise.incrementOverride
            );

            return {
              key: routineExercise.exerciseId,
              name: definition?.name ?? 'Ejercicio no disponible',
              sets: target.sets,
              reps: String(target.reps),
              weight: target.weight,
              isWeightIncrease: target.isWeightIncrease,
            };
          }

          return {
            key: routineExercise.exerciseId,
            name: definition?.name ?? 'Ejercicio no disponible',
            sets: routineExercise.targetSets,
            reps: routineExercise.targetReps,
            weight: routineExercise.targetWeight ? Number(routineExercise.targetWeight) || undefined : undefined,
          };
        });
      }

      if (!cancelled) {
        setLinesByEntry(result);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  const handleStart = (entry: DayEntry) => {
    if (entry.planDayId && typeof entry.weekIndex === 'number') {
      loadPlanDayIntoWorkout(entry.planDayId, entry.weekIndex);
    } else {
      loadRoutineIntoWorkout(entry.routineId);
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={titleForDate(date)} description="Lo que toca entrenar ese día." size="lg">
      <div className="space-y-4">
        {entries.map((entry) => {
          const lines = linesByEntry[entry.key] ?? [];

          return (
            <section key={entry.key} className="overflow-hidden rounded-card border border-ink-800 bg-ink-900">
              <header className="flex items-start justify-between gap-3 border-b border-ink-800 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-ink-850 px-2 py-0.5 text-xs font-bold tabular-nums text-ink-300">
                      {entry.time}
                    </span>
                    {entry.kind === 'plan' ? (
                      <span className="rounded-full border border-ember-500/40 bg-ember-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ember-300">
                        Semana {(entry.weekIndex ?? 0) + 1} de {entry.totalWeeks}
                      </span>
                    ) : (
                      <span className="rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-400">
                        Turno suelto
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 truncate font-heading text-lg font-bold text-ink-100">{entry.routineName}</h3>
                  {entry.planName && <p className="truncate text-xs text-ink-500">{entry.planName}</p>}
                  {entry.notes && <p className="mt-1 text-xs text-ink-500">{entry.notes}</p>}
                </div>

                <Button
                  size="sm"
                  disabled={!entry.routineExists}
                  onClick={() => handleStart(entry)}
                  aria-label={`Empezar ${entry.routineName}`}
                >
                  <Play className="h-4 w-4 fill-current" /> Empezar
                </Button>
              </header>

              {!entry.routineExists ? (
                <p className="p-4 text-sm text-flare-400">La rutina de este día fue eliminada.</p>
              ) : isLoading ? (
                <p className="p-4 text-sm text-ink-500">Cargando ejercicios...</p>
              ) : lines.length === 0 ? (
                <p className="p-4 text-sm text-ink-500">Esta rutina todavía no tiene ejercicios.</p>
              ) : (
                <ul className="divide-y divide-ink-800">
                  {lines.map((line) => (
                    <li key={line.key} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Dumbbell className="h-4 w-4 shrink-0 text-ink-600" />
                        <span className="min-w-0 truncate text-sm font-medium text-ink-200">{line.name}</span>
                      </span>

                      <span className="shrink-0 text-right">
                        <span
                          className={cn(
                            'block font-heading text-base font-bold tabular-nums',
                            line.weight === undefined ? 'text-ink-500' : 'text-ink-100'
                          )}
                        >
                          {line.weight === undefined ? '—' : `${line.weight} kg`}
                          {line.isWeightIncrease && (
                            <ArrowUpRight className="ml-0.5 inline h-4 w-4 text-mint-400" aria-label="Sube el peso" />
                          )}
                        </span>
                        <span className="block text-xs tabular-nums text-ink-500">
                          {line.sets} × {line.reps}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
