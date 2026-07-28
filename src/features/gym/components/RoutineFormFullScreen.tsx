import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Plus, Trash2, X, Save } from 'lucide-react';
import type { Routine, Exercise } from '../../../types';
import { ExerciseSelectorDrawer } from './ExerciseSelectorDrawer';

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

export function RoutineFormFullScreen({ isOpen, onClose, initialData }: RoutineFormFullScreenProps) {
  const { createRoutine, updateRoutine } = useGymStore();

  const [name, setName] = useState('');
  const [addedExercises, setAddedExercises] = useState<RoutineExerciseInput[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.routine.name);
        setAddedExercises(initialData.exercises);
      } else {
        setName('');
        setAddedExercises([]);
      }
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!name.trim() || addedExercises.length === 0) return;

    if (initialData?.routine.id) {
      await updateRoutine(initialData.routine.id, name.trim(), addedExercises);
    } else {
      await createRoutine(name.trim(), addedExercises);
    }

    onClose();
  };

  const handleExercisesSelected = (selectedList: Exercise[]) => {
    const formatted: RoutineExerciseInput[] = selectedList.map((ex) => ({
      exerciseId: ex.id!,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      targetSets: 4,
      targetReps: '10',
      targetWeight: '',
    }));

    setAddedExercises((prev) => {
      const existingIds = new Set(prev.map((e) => e.exerciseId));
      const filteredNew = formatted.filter((item) => !existingIds.has(item.exerciseId));
      return [...prev, ...filteredNew];
    });
  };

  const updateExerciseField = (
    index: number,
    field: keyof RoutineExerciseInput,
    value: string | number
  ) => {
    setAddedExercises((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeExercise = (index: number) => {
    setAddedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const isSaveDisabled = !name.trim() || addedExercises.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-9990 w-screen h-dvh bg-neutral-950 overflow-y-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header Fijo */}
      <header className="sticky top-0 z-20 h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancelar"
          className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg active:bg-neutral-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-base font-semibold text-neutral-100">
          {initialData ? 'Editar Rutina' : 'Nueva Rutina'}
        </h2>

        <Button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="h-10 px-5 bg-lime-400 hover:bg-lime-500 text-neutral-950 font-bold rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <Save className="w-4 h-4 mr-1.5" /> Guardar
        </Button>
      </header>

      {/* Formulario */}
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Nombre de la rutina
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Espalda y Bíceps / Pierna Foco Cuadriceps"
            className="h-13 bg-neutral-900 border-neutral-800 text-lg font-medium text-white placeholder:text-neutral-600 focus:border-lime-400 px-4 rounded-xl"
            autoFocus={!initialData}
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
                Ejercicios
              </span>
              <span className="bg-neutral-800 text-lime-400 text-xs font-bold px-2 py-0.5 rounded-full border border-neutral-700">
                {addedExercises.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {addedExercises.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500 text-sm">
                No agregaste ejercicios aún. Presioná el botón de abajo para explorar la biblioteca.
              </div>
            ) : (
              addedExercises.map((ex, idx) => (
                <div
                  key={`${ex.exerciseId}-${idx}`}
                  className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-base text-white leading-snug">
                        {ex.name}
                      </h4>
                      {ex.muscleGroup && (
                        <span className="text-[10px] bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800 inline-block mt-1">
                          {ex.muscleGroup}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExercise(idx)}
                      aria-label="Eliminar ejercicio"
                      className="w-12 h-12 flex items-center justify-center text-neutral-500 hover:text-red-400 rounded-lg active:bg-neutral-800 transition-colors -mr-2 -mt-2 shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">
                        PESO BASE (KG)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={ex.targetWeight}
                        onChange={(e) => updateExerciseField(idx, 'targetWeight', e.target.value)}
                        className="w-full h-12 text-center text-base font-semibold bg-neutral-950 border border-neutral-800 text-white rounded-lg focus:border-lime-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block text-center">
                        REPS META
                      </label>
                      <input
                        type="text"
                        inputMode="text"
                        placeholder="8-12"
                        value={ex.targetReps}
                        onChange={(e) => updateExerciseField(idx, 'targetReps', e.target.value)}
                        className="w-full h-12 text-center text-base font-semibold bg-neutral-950 border border-neutral-800 text-white rounded-lg focus:border-lime-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block text-center">
                        SERIES
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="4"
                        value={ex.targetSets}
                        onChange={(e) => updateExerciseField(idx, 'targetSets', parseInt(e.target.value) || 0)}
                        className="w-full h-12 text-center text-base font-semibold bg-neutral-950 border border-neutral-800 text-white rounded-lg focus:border-lime-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSelectorOpen(true)}
            className="w-full h-13 border-dashed border-neutral-700 text-neutral-300 hover:text-white hover:border-lime-400/50 hover:bg-neutral-900 rounded-xl font-bold text-base gap-2 mt-2"
          >
            <Plus className="w-5 h-5 text-lime-400" /> Agregar Ejercicio
          </Button>
        </div>
      </main>

      {isSelectorOpen && (
        <ExerciseSelectorDrawer
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          alreadyAddedIds={addedExercises.map((e) => e.exerciseId)}
          onConfirm={handleExercisesSelected}
        />
      )}
    </div>,
    document.body
  );
}