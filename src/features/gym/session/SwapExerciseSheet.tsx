import { useMemo, useState } from 'react';
import { Search, Shuffle } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { useGymStore } from '../../../hooks/useGymStore';
import type { Exercise } from '../../../types';

interface SwapExerciseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseIndex: number;
  currentExerciseName: string;
  muscleGroup: string;
}

/**
 * "La máquina está ocupada": propone alternativas del mismo grupo muscular
 * y cambia el ejercicio sin perder el resto de la sesión.
 */
export function SwapExerciseSheet({
  isOpen,
  onClose,
  exerciseIndex,
  currentExerciseName,
  muscleGroup,
}: SwapExerciseSheetProps) {
  const exercises = useGymStore((state) => state.exercises);
  const swapActiveExercise = useGymStore((state) => state.swapActiveExercise);
  const [search, setSearch] = useState('');

  const options = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exercises
      .filter((exercise) => exercise.name !== currentExerciseName)
      .filter((exercise) =>
        query
          ? exercise.name.toLowerCase().includes(query)
          : exercise.muscleGroup.toLowerCase() === muscleGroup.toLowerCase()
      )
      .slice(0, 24);
  }, [exercises, currentExerciseName, muscleGroup, search]);

  const handleSwap = async (exercise: Exercise) => {
    await swapActiveExercise(exerciseIndex, exercise);
    setSearch('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar ejercicio"
      description={`Alternativas para ${muscleGroup.toLowerCase()}. Las series ya cargadas de ${currentExerciseName} se descartan.`}
      size="md"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cualquier ejercicio..."
            className="pl-11"
          />
        </div>

        <div className="space-y-2">
          {options.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink-800 py-10 text-center text-sm text-ink-500">
              No encontramos alternativas para {muscleGroup}.
            </p>
          ) : (
            options.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => handleSwap(exercise)}
                className="flex w-full items-center gap-3 rounded-2xl border border-ink-800 bg-ink-850 p-3 text-left transition-colors hover:border-ember-500/50 hover:bg-ink-800"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-ember-400">
                  <Shuffle className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-100">{exercise.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-400">
                    {exercise.muscleGroup}
                    {exercise.equipment ? ` · ${exercise.equipment}` : ''}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
