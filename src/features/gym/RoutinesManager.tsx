import { useEffect, useState } from 'react';
import { ClipboardList, Dumbbell, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useGymStore } from '../../hooks/useGymStore';
import { useAgendaStore } from '../../hooks/useAgendaStore';
import { useUIStore } from '../../hooks/useUIStore';
import { Button } from '../../components/Button';
import { db } from '../../lib/db';
import { MUSCLE_BADGE } from './taxonomy';
import { cn } from '../../lib/utils';
import { RoutineFormFullScreen, type RoutineExerciseInput } from './components/RoutineFormFullScreen';
import type { Routine } from '../../types';

interface RoutineMeta {
  count: number;
  muscleGroups: string[];
}

export function RoutinesManager() {
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const deleteRoutine = useGymStore((state) => state.deleteRoutine);
  const loadRoutineIntoWorkout = useGymStore((state) => state.loadRoutineIntoWorkout);
  const plans = useAgendaStore((state) => state.plans);
  const planDays = useAgendaStore((state) => state.planDays);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const openConfirmDialog = useUIStore((state) => state.openConfirmDialog);

  const [meta, setMeta] = useState<Record<number, RoutineMeta>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ routine: Routine; exercises: RoutineExerciseInput[] } | null>(null);

  useEffect(() => {
    getRoutines();
    getPlans();
  }, [getRoutines, getPlans]);

  // Cantidad de ejercicios y músculos de cada rutina, leídos de IndexedDB.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const catalog = await db.exercises.toArray();
      const next: Record<number, RoutineMeta> = {};

      for (const routine of routines) {
        if (typeof routine.id !== 'number') continue;

        const routineExercises = await db.routineExercises.where('routineId').equals(routine.id).toArray();
        const muscles = new Set<string>();

        for (const item of routineExercises) {
          const definition = catalog.find((exercise) => exercise.id === item.exerciseId);
          if (definition?.muscleGroup) muscles.add(definition.muscleGroup);
        }

        next[routine.id] = { count: routineExercises.length, muscleGroups: Array.from(muscles).slice(0, 3) };
      }

      if (!cancelled) setMeta(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [routines]);

  const handleEdit = async (routine: Routine) => {
    if (typeof routine.id !== 'number') return;

    const catalog = await db.exercises.toArray();
    const routineExercises = await db.routineExercises.where('routineId').equals(routine.id).sortBy('order');

    const exercises: RoutineExerciseInput[] = routineExercises.map((item) => {
      const definition = catalog.find((exercise) => exercise.id === item.exerciseId);
      return {
        exerciseId: item.exerciseId,
        name: definition?.name ?? 'Ejercicio no disponible',
        muscleGroup: definition?.muscleGroup ?? 'Otro',
        equipment: definition?.equipment ?? 'Otro',
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        targetWeight: item.targetWeight ?? '',
      };
    });

    setEditing({ routine, exercises });
    setIsFormOpen(true);
  };

  const handleDelete = (routine: Routine) => {
    if (typeof routine.id !== 'number') return;

    const dependentPlanIds = new Set(
      planDays.filter((day) => day.routineId === routine.id).map((day) => day.planId)
    );
    const dependentPlans = plans.filter((plan) => typeof plan.id === 'number' && dependentPlanIds.has(plan.id));
    const warning =
      dependentPlans.length > 0
        ? ` La usa un día del plan${dependentPlans.length > 1 ? 'es' : ''} "${dependentPlans
            .map((plan) => plan.name)
            .join('", "')}", que se va a quedar sin ejercicios.`
        : '';

    openConfirmDialog({
      title: '¿Eliminar la rutina?',
      message: `"${routine.name}" se borra de forma permanente.${warning} Tus entrenamientos ya registrados no se tocan.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: () => {
        deleteRoutine(routine.id as number);
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">Rutinas</h1>
          <p className="mt-1 text-sm text-ink-400">Tus planes armados, listos para empezar en un toque.</p>
        </div>
        {routines.length > 0 && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva</span>
          </Button>
        )}
      </header>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-ink-800 bg-ink-900/40 px-6 py-16 text-center">
          <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-ink-800 bg-ink-900 text-ember-400">
            <ClipboardList className="h-9 w-9" />
          </span>
          <h2 className="font-heading text-xl font-bold text-ink-100">Todavía no tenés rutinas</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-400">
            Armá tus días de entrenamiento una vez y después arrancá cada sesión con un solo toque.
          </p>
          <Button size="lg" className="mt-6 w-full max-w-xs" onClick={openCreate}>
            Crear mi primera rutina
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {routines.map((routine) => {
            const info = meta[routine.id as number] ?? { count: 0, muscleGroups: [] };

            return (
              <article
                key={routine.id}
                className="flex flex-col justify-between gap-4 rounded-card border border-ink-800 bg-ink-900 p-5 transition-colors hover:border-ink-700"
              >
                <div>
                  <h2 className="font-heading text-lg font-bold leading-snug text-ink-100">{routine.name}</h2>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 px-2 py-1 text-xs font-medium text-ink-300">
                      <Dumbbell className="h-3.5 w-3.5 text-ink-500" />
                      {info.count} {info.count === 1 ? 'ejercicio' : 'ejercicios'}
                    </span>

                    {info.muscleGroups.map((muscle) => (
                      <span
                        key={muscle}
                        className={cn(
                          'rounded-md border px-2 py-1 text-xs font-medium',
                          MUSCLE_BADGE[muscle.toLowerCase()] ?? MUSCLE_BADGE.otro
                        )}
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-ink-800 pt-4">
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={info.count === 0}
                    onClick={() => routine.id && loadRoutineIntoWorkout(routine.id)}
                  >
                    <Play className="h-4 w-4 fill-current" /> Entrenar
                  </Button>

                  <Button variant="outline" size="icon" onClick={() => handleEdit(routine)} aria-label="Editar rutina">
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(routine)}
                    aria-label="Eliminar rutina"
                    className="hover:border-flare-500/40 hover:text-flare-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {routines.length > 3 && (
        <button
          type="button"
          onClick={openCreate}
          aria-label="Nueva rutina"
          className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ember-500 text-ink-950 shadow-ember transition-transform active:scale-90 md:bottom-8"
        >
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </button>
      )}

      {isFormOpen && (
        <RoutineFormFullScreen
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editing}
        />
      )}
    </div>
  );
}
