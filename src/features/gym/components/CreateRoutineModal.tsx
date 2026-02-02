import { useState } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { CreateExerciseModal } from './CreateExerciseModal';

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoutineExerciseInput {
  exerciseId: number;
  name: string; // for display
  targetSets: number;
  targetReps: string;
  targetWeight: string;
}

export function CreateRoutineModal({ isOpen, onClose }: CreateRoutineModalProps) {
  const { exercises, createRoutine } = useGymStore();

  const [name, setName] = useState('');
  const [addedExercises, setAddedExercises] = useState<RoutineExerciseInput[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    if (addedExercises.length === 0) return;

    await createRoutine(name, addedExercises);
    reset();
    onClose();
  };

  const reset = () => {
    setName('');
    setAddedExercises([]);
    setIsSelecting(false);
    setSearch('');
  };

  const handleAddExercise = (exercise: any) => {
    setAddedExercises([
      ...addedExercises,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        targetSets: 4,
        targetReps: '10',
        targetWeight: ''
      }
    ]);
    setIsSelecting(false);
    setSearch('');
  };

  const updateExercise = (index: number, field: keyof RoutineExerciseInput, value: any) => {
    const newExercises = [...addedExercises];
    // @ts-ignore
    newExercises[index][field] = value;
    setAddedExercises(newExercises);
  };

  const removeExercise = (index: number) => {
    const newExercises = [...addedExercises];
    newExercises.splice(index, 1);
    setAddedExercises(newExercises);
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isSelecting ? "Agregar Ejercicio" : "Nueva Rutina"}>
      {isSelecting ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSelecting(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <Button variant="outline" size="icon" onClick={() => setIsCreateExerciseOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {filteredExercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => handleAddExercise(ex)}
                className="w-full text-left p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 flex justify-between items-center"
              >
                <span className="text-neutral-200">{ex.name}</span>
                <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-1 rounded">{ex.muscleGroup}</span>
              </button>
            ))}
          </div>
          <CreateExerciseModal
            isOpen={isCreateExerciseOpen}
            onClose={() => setIsCreateExerciseOpen(false)}
            onExerciseCreated={handleAddExercise}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Nombre de la Rutina</Label>
            <Input
              placeholder="Ej. Pecho y Tríceps"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Ejercicios ({addedExercises.length})</Label>
              <Button variant="outline" size="sm" onClick={() => setIsSelecting(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {addedExercises.length === 0 && (
                <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                  Agrega ejercicios para configurar tu rutina
                </div>
              )}

              {addedExercises.map((ex, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-neutral-200">{ex.name}</span>
                    <button onClick={() => removeExercise(idx)} className="text-neutral-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">Series</label>
                      <input
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-sm text-center focus:border-red-500 focus:outline-none"
                        value={ex.targetSets}
                        onChange={(e) => updateExercise(idx, 'targetSets', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">Reps</label>
                      <input
                        type="text"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-sm text-center focus:border-red-500 focus:outline-none"
                        value={ex.targetReps}
                        onChange={(e) => updateExercise(idx, 'targetReps', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">Peso</label>
                      <input
                        type="text"
                        placeholder="Op."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-sm text-center focus:border-red-500 focus:outline-none"
                        value={ex.targetWeight}
                        onChange={(e) => updateExercise(idx, 'targetWeight', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full gap-2 justify-center"
              onClick={handleSave}
              disabled={!name || addedExercises.length === 0}
            >
              <Save className="w-4 h-4" /> Guardar Rutina
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
