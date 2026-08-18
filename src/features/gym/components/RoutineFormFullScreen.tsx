import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { ExerciseSelectorDrawer } from './ExerciseSelectorDrawer';
import { cn } from '../../../lib/utils';
import type { Exercise, Routine } from '../../../types';

export interface RoutineExerciseInput {
  exerciseId: number;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  targetSets: number;
  targetReps: string;
  targetWeight: string;
}

interface RoutineFormFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    routine: Routine;
    exercises: RoutineExerciseInput[];
  } | null;
}

/**
 * El formulario se monta al abrirse: el estado inicial sale directo de
 * `initialData`, sin sincronizaciones posteriores.
 */
export function RoutineFormFullScreen({ isOpen, onClose, initialData }: RoutineFormFullScreenProps) {
  if (!isOpen) return null;
  return <RoutineForm onClose={onClose} initialData={initialData} />;
}

function RoutineForm({ onClose, initialData }: Omit<RoutineFormFullScreenProps, 'isOpen'>) {
  const createRoutine = useGymStore((state) => state.createRoutine);
  const updateRoutine = useGymStore((state) => state.updateRoutine);

  const [name, setName] = useState(initialData?.routine.name ?? '');
  const [addedExercises, setAddedExercises] = useState<RoutineExerciseInput[]>(
    initialData?.exercises ?? []
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSaveDisabled = !name.trim() || addedExercises.length === 0 || isSaving;

  const handleSave = async () => {
    if (isSaveDisabled) return;
    setIsSaving(true);

    if (initialData?.routine.id) {
      await updateRoutine(initialData.routine.id, name.trim(), addedExercises);
      toast.success('Rutina actualizada');
    } else {
      await createRoutine(name.trim(), addedExercises);
      toast.success('Rutina creada');
    }

    setIsSaving(false);
    onClose();
  };

  const handleExercisesSelected = (selected: Exercise[]) => {
    setAddedExercises((previous) => {
      const existing = new Set(previous.map((item) => item.exerciseId));

      const additions = selected
        .filter((exercise) => typeof exercise.id === 'number' && !existing.has(exercise.id))
        .map((exercise) => ({
          exerciseId: exercise.id as number,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          targetSets: 4,
          targetReps: '10',
          targetWeight: '',
        }));

      return [...previous, ...additions];
    });
  };

  const updateField = (index: number, field: keyof RoutineExerciseInput, value: string | number) => {
    setAddedExercises((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    setAddedExercises((previous) => {
      const target = index + direction;
      if (target < 0 || target >= previous.length) return previous;

      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9400] h-dvh w-screen overflow-y-auto bg-ink-950 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink-800 bg-ink-950/95 px-3 py-2.5 pt-safe backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancelar"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-300 transition-colors hover:bg-ink-850"
        >
          <X className="h-5 w-5" />
        </button>

        <h1 className="font-heading text-base font-bold text-ink-100">
          {initialData ? 'Editar rutina' : 'Nueva rutina'}
        </h1>

        <Button onClick={handleSave} disabled={isSaveDisabled} className="px-4">
          <Save className="h-4 w-4" /> Guardar
        </Button>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4 pb-32">
        <div className="space-y-2">
          <Label htmlFor="routine-name">Nombre de la rutina</Label>
          <Input
            id="routine-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Empuje A · Pecho y hombros"
            className="h-14 text-lg font-semibold"
            autoFocus={!initialData}
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Ejercicios</Label>
            <span className="rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[11px] font-bold text-ember-400">
              {addedExercises.length}
            </span>
          </div>

          {addedExercises.length === 0 ? (
            <p className="rounded-card border border-dashed border-ink-800 bg-ink-900/40 px-4 py-10 text-center text-sm text-ink-500">
              Todavía no agregaste ejercicios. Buscalos en la biblioteca con el botón de abajo.
            </p>
          ) : (
            <ul className="space-y-3">
              {addedExercises.map((exercise, index) => (
                <li
                  key={`${exercise.exerciseId}-${index}`}
                  className="space-y-3 rounded-card border border-ink-800 bg-ink-900 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-850 text-[11px] font-bold text-ink-400">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-ink-100">{exercise.name}</h3>
                        {exercise.muscleGroup && (
                          <span className="mt-1 inline-block rounded border border-ink-800 bg-ink-950 px-2 py-0.5 text-[10px] text-ink-400">
                            {exercise.muscleGroup}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label="Subir ejercicio"
                          className="flex h-6 w-8 items-center justify-center rounded-t-md text-ink-500 hover:text-ink-100 disabled:opacity-25"
                        >
                          <GripVertical className="h-3.5 w-3.5 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === addedExercises.length - 1}
                          aria-label="Bajar ejercicio"
                          className="flex h-6 w-8 items-center justify-center rounded-b-md text-ink-500 hover:text-ink-100 disabled:opacity-25"
                        >
                          <GripVertical className="h-3.5 w-3.5 -rotate-90" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setAddedExercises((previous) => previous.filter((_, i) => i !== index))
                        }
                        aria-label={`Quitar ${exercise.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-flare-500/10 hover:text-flare-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <TargetField
                      label="Series"
                      value={String(exercise.targetSets)}
                      inputMode="numeric"
                      onChange={(value) =>
                        updateField(index, 'targetSets', Math.max(1, Math.min(20, parseInt(value, 10) || 1)))
                      }
                    />
                    <TargetField
                      label="Reps"
                      value={exercise.targetReps}
                      placeholder="8-12"
                      onChange={(value) => updateField(index, 'targetReps', value)}
                    />
                    <TargetField
                      label="Peso base"
                      value={exercise.targetWeight}
                      placeholder="kg"
                      inputMode="decimal"
                      onChange={(value) => updateField(index, 'targetWeight', value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="outline"
            size="lg"
            className="w-full border-dashed"
            onClick={() => setIsSelectorOpen(true)}
          >
            <Plus className="h-5 w-5 text-ember-400" /> Agregar ejercicios
          </Button>
        </section>
      </main>

      {isSelectorOpen && (
        <ExerciseSelectorDrawer
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          alreadyAddedIds={addedExercises.map((item) => item.exerciseId)}
          onConfirm={handleExercisesSelected}
          confirmLabel="Agregar a la rutina"
        />
      )}
    </div>,
    document.body
  );
}

function TargetField({
  label,
  value,
  onChange,
  placeholder,
  inputMode = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-center text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-12 w-full rounded-xl border border-ink-800 bg-ink-950 text-center text-base font-semibold text-ink-100',
          'transition-colors placeholder:font-normal placeholder:text-ink-600 focus:border-ember-500 focus:outline-none'
        )}
      />
    </label>
  );
}
