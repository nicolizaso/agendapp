import { useState } from 'react';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGymStore } from '../../../hooks/useGymStore';
import type { ActiveExerciseData } from '../../../types';
import { cn } from '../../../lib/utils';

interface SetTableProps {
  exercise: ActiveExerciseData;
  exerciseIndex: number;
  onAllSetsCompleted: () => void;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

/**
 * Tabla de series del ejercicio en curso.
 *
 * Todo se edita en línea: no hay que abrir modales para cargar el peso.
 * El placeholder de cada campo muestra lo que hiciste la sesión anterior, así
 * que tocar ✓ sin escribir nada nunca es ambiguo.
 */
export function SetTable({ exercise, exerciseIndex, onAllSetsCompleted }: SetTableProps) {
  const updateSet = useGymStore((state) => state.updateSet);
  const toggleSetComplete = useGymStore((state) => state.toggleSetComplete);
  const addSet = useGymStore((state) => state.addSet);
  const removeSet = useGymStore((state) => state.removeSet);

  const [focusedSet, setFocusedSet] = useState<number | null>(null);

  const handleToggle = async (setIndex: number) => {
    const result = await toggleSetComplete(exerciseIndex, setIndex);

    if (result === 'invalid') {
      setFocusedSet(setIndex);
      toast.error('Cargá el peso y las repeticiones antes de marcar la serie.');
      return;
    }

    if (result === 'completed') {
      vibrate(35);
      const current = useGymStore.getState().activeExercises[exerciseIndex];
      if (current && current.sets.every((item) => item.completed)) {
        onAllSetsCompleted();
      } else {
        setFocusedSet(setIndex + 1 < (current?.sets.length ?? 0) ? setIndex + 1 : null);
      }
    }
  };

  const adjust = (setIndex: number, field: 'weight' | 'reps', delta: number) => {
    const currentValue = parseFloat(exercise.sets[setIndex]?.[field] || '') || 0;
    const next = Math.max(0, Math.round((currentValue + delta) * 100) / 100);
    updateSet(exerciseIndex, setIndex, field, String(next));
    vibrate(10);
  };

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-[3.25rem_1fr_1fr_3.25rem] items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Serie</span>
        <span className="text-center text-[10px] font-bold uppercase tracking-widest text-ink-500">Kg</span>
        <span className="text-center text-[10px] font-bold uppercase tracking-widest text-ink-500">Reps</span>
        <span className="sr-only">Completar</span>
      </div>

      {exercise.sets.map((setItem, setIndex) => {
        const previous = exercise.previous?.[setIndex];
        const isFocused = focusedSet === setIndex;
        const isNext = !setItem.completed && exercise.sets.findIndex((item) => !item.completed) === setIndex;

        return (
          <div key={setIndex} className="space-y-2">
            <div
              className={cn(
                'grid grid-cols-[3.25rem_1fr_1fr_3.25rem] items-center gap-2 rounded-2xl border p-2 transition-colors',
                setItem.completed
                  ? 'border-mint-500/30 bg-mint-500/8'
                  : isNext
                    ? 'border-ember-500/50 bg-ember-500/8'
                    : 'border-ink-800 bg-ink-900'
              )}
            >
              <button
                type="button"
                onClick={() => setFocusedSet(isFocused ? null : setIndex)}
                className="flex h-12 flex-col items-center justify-center rounded-xl bg-ink-850/60"
                aria-label={`Opciones de la serie ${setIndex + 1}`}
              >
                <span
                  className={cn(
                    'font-heading text-base font-bold leading-none',
                    setItem.completed ? 'text-mint-300' : isNext ? 'text-ember-400' : 'text-ink-300'
                  )}
                >
                  {setIndex + 1}
                </span>
                {previous && (
                  <span className="mt-0.5 text-[9px] tabular-nums leading-none text-ink-500">
                    {previous.weight}×{previous.reps}
                  </span>
                )}
              </button>

              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={setItem.weight}
                onFocus={() => setFocusedSet(setIndex)}
                onChange={(event) => updateSet(exerciseIndex, setIndex, 'weight', event.target.value)}
                placeholder={previous ? String(previous.weight) : '0'}
                aria-label={`Peso de la serie ${setIndex + 1}`}
                className={cn(
                  'h-12 w-full rounded-xl border bg-ink-950 text-center font-heading text-lg font-bold tabular-nums transition-colors',
                  'placeholder:font-normal placeholder:text-ink-600 focus:outline-none',
                  setItem.completed
                    ? 'border-mint-500/30 text-mint-200'
                    : 'border-ink-800 text-ink-100 focus:border-ember-500'
                )}
              />

              <input
                type="number"
                inputMode="numeric"
                value={setItem.reps}
                onFocus={() => setFocusedSet(setIndex)}
                onChange={(event) => updateSet(exerciseIndex, setIndex, 'reps', event.target.value)}
                placeholder={previous ? String(previous.reps) : '0'}
                aria-label={`Repeticiones de la serie ${setIndex + 1}`}
                className={cn(
                  'h-12 w-full rounded-xl border bg-ink-950 text-center font-heading text-lg font-bold tabular-nums transition-colors',
                  'placeholder:font-normal placeholder:text-ink-600 focus:outline-none',
                  setItem.completed
                    ? 'border-mint-500/30 text-mint-200'
                    : 'border-ink-800 text-ink-100 focus:border-ember-500'
                )}
              />

              <button
                type="button"
                onClick={() => handleToggle(setIndex)}
                aria-pressed={setItem.completed}
                aria-label={setItem.completed ? `Deshacer serie ${setIndex + 1}` : `Completar serie ${setIndex + 1}`}
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-xl border transition-all active:scale-95',
                  setItem.completed
                    ? 'border-transparent bg-mint-400 text-ink-950'
                    : isNext
                      ? 'border-ember-500 bg-ember-500/15 text-ember-400'
                      : 'border-ink-700 bg-ink-850 text-ink-500'
                )}
              >
                <Check className="h-5 w-5 stroke-[3]" />
              </button>
            </div>

            {/* Ajuste rápido: evita teclear para los cambios habituales. */}
            {isFocused && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-150 grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-2xl border border-ink-800 bg-ink-850/60 p-2">
                <div className="flex items-center justify-between gap-1 rounded-xl bg-ink-900 p-1">
                  <StepButton label="Restar 2,5 kg" onClick={() => adjust(setIndex, 'weight', -2.5)} icon="minus" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">2,5 kg</span>
                  <StepButton label="Sumar 2,5 kg" onClick={() => adjust(setIndex, 'weight', 2.5)} icon="plus" />
                </div>

                <div className="flex items-center justify-between gap-1 rounded-xl bg-ink-900 p-1">
                  <StepButton label="Restar 1 repetición" onClick={() => adjust(setIndex, 'reps', -1)} icon="minus" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">1 rep</span>
                  <StepButton label="Sumar 1 repetición" onClick={() => adjust(setIndex, 'reps', 1)} icon="plus" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    removeSet(exerciseIndex, setIndex);
                    setFocusedSet(null);
                  }}
                  aria-label={`Quitar serie ${setIndex + 1}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-flare-500/15 hover:text-flare-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => addSet(exerciseIndex)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-700 text-sm font-semibold text-ink-400 transition-colors hover:border-ember-500/60 hover:text-ember-400"
      >
        <Plus className="h-4 w-4" /> Agregar serie
      </button>
    </section>
  );
}

function StepButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: 'plus' | 'minus';
}) {
  const Icon = icon === 'plus' ? Plus : Minus;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-ink-200 transition-colors active:scale-90"
    >
      <Icon className="h-4 w-4 stroke-[2.5]" />
    </button>
  );
}
