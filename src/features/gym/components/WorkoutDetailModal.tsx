import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dumbbell, Flame, Loader2, Timer } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { db } from '../../../lib/db';
import { calculate1RM } from '../../../hooks/useGymStore';
import { formatDurationLong } from '../../../lib/format';
import type { Exercise, Workout, WorkoutSet } from '../../../types';

interface WorkoutDetailModalProps {
  workoutId: number;
  onClose: () => void;
}

interface ExerciseBlock {
  exercise: Exercise | null;
  sets: WorkoutSet[];
}

export function WorkoutDetailModal({ workoutId, onClose }: WorkoutDetailModalProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const found = await db.workouts.get(workoutId);
        const sets = await db.sets.where('workoutId').equals(workoutId).toArray();

        const grouped = new Map<number, WorkoutSet[]>();
        for (const set of sets) {
          const list = grouped.get(set.exerciseId) ?? [];
          list.push(set);
          grouped.set(set.exerciseId, list);
        }

        const resolved: ExerciseBlock[] = [];
        for (const [exerciseId, exerciseSets] of grouped) {
          resolved.push({
            exercise: (await db.exercises.get(exerciseId)) ?? null,
            sets: exerciseSets.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
          });
        }

        if (!cancelled) {
          setWorkout(found ?? null);
          setBlocks(resolved);
        }
      } catch (err) {
        console.error('No se pudo leer la sesión', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  const totalVolume = blocks
    .flatMap((block) => block.sets)
    .reduce((sum, set) => sum + set.weight * set.reps, 0);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={workout?.name ?? 'Sesión'}
      description={
        workout ? format(new Date(workout.date), "EEEE d 'de' MMMM yyyy", { locale: es }) : undefined
      }
      size="md"
    >
      {isLoading ? (
        <div className="flex justify-center py-12 text-ember-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !workout ? (
        <p className="py-12 text-center text-sm text-ink-500">No encontramos esta sesión.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <Stat icon={Timer} label="Duración" value={formatDurationLong(workout.durationSeconds)} />
            <Stat icon={Dumbbell} label="Ejercicios" value={String(blocks.length)} />
            <Stat icon={Flame} label="Volumen" value={`${Math.round(totalVolume).toLocaleString('es-AR')} kg`} />
          </div>

          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div key={index} className="rounded-2xl border border-ink-800 bg-ink-850 p-4">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-ink-800 pb-2">
                  <span className="truncate font-semibold text-ink-100">
                    {block.exercise?.name ?? 'Ejercicio eliminado'}
                  </span>
                  {block.exercise?.muscleGroup && (
                    <span className="shrink-0 rounded border border-ink-700 bg-ink-900 px-2 py-0.5 text-[10px] text-ink-400">
                      {block.exercise.muscleGroup}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-y-1.5 text-center text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Serie</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Kg</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Reps</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">1RM est.</span>

                  {block.sets.map((set, setIndex) => (
                    <div key={set.id ?? setIndex} className="contents tabular-nums text-ink-300">
                      <span className="text-ink-500">{setIndex + 1}</span>
                      <span>{set.weight}</span>
                      <span>{set.reps}</span>
                      <span className="font-semibold text-ember-400">{calculate1RM(set.weight, set.reps)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {blocks.length === 0 && (
              <p className="rounded-2xl border border-dashed border-ink-800 py-10 text-center text-sm text-ink-500">
                Esta sesión no tiene series registradas.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-850 p-3">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <Icon className="h-3 w-3 text-ember-400" />
        {label}
      </span>
      <p className="mt-1.5 font-heading text-base font-bold tabular-nums text-ink-100">{value}</p>
    </div>
  );
}
