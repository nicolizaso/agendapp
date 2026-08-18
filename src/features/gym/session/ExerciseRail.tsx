import { useEffect, useRef } from 'react';
import { Check, Plus } from 'lucide-react';
import type { ActiveExerciseData } from '../../../types';
import { cn } from '../../../lib/utils';

interface ExerciseRailProps {
  exercises: ActiveExerciseData[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

/**
 * Tira superior con todos los ejercicios de la sesión: dice dónde estás,
 * qué falta y permite saltar a cualquiera sin salir del entrenamiento.
 */
export function ExerciseRail({ exercises, currentIndex, onSelect, onAdd }: ExerciseRailProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // El ejercicio en curso siempre queda a la vista.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-ink-800 bg-ink-950/80 px-4 py-2.5">
      {exercises.map((exercise, index) => {
        const done = exercise.sets.filter((item) => item.completed).length;
        const isComplete = done === exercise.sets.length && exercise.sets.length > 0;
        const isCurrent = index === currentIndex;

        return (
          <button
            key={`${exercise.exerciseId}-${index}`}
            ref={isCurrent ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-all',
              isCurrent
                ? 'border-ember-500 bg-ember-500/15 text-ember-300'
                : isComplete
                  ? 'border-mint-500/40 bg-mint-500/10 text-mint-300'
                  : 'border-ink-700 bg-ink-900 text-ink-400'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                isCurrent ? 'bg-ember-500 text-ink-950' : isComplete ? 'bg-mint-400 text-ink-950' : 'bg-ink-800 text-ink-400'
              )}
            >
              {isComplete ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
            </span>
            <span className="max-w-[7.5rem] truncate">{exercise.name}</span>
            <span className="tabular-nums opacity-70">
              {done}/{exercise.sets.length}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        aria-label="Agregar ejercicio"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-ink-600 text-ink-400 transition-colors hover:border-ember-500 hover:text-ember-400"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
