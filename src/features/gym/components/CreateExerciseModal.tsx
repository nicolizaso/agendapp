import { useState } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { useGymStore } from '../../../hooks/useGymStore';
import type { Exercise } from '../../../types';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Cardio', 'Otro'
];

export function CreateExerciseModal({ isOpen, onClose, onExerciseCreated }: CreateExerciseModalProps) {
  const { addExercise } = useGymStore();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newExercise = await addExercise(name, muscleGroup);
    if (newExercise) {
        onExerciseCreated(newExercise);
        handleClose();
    }
  };

  const handleClose = () => {
      setName('');
      setMuscleGroup(MUSCLE_GROUPS[0]);
      onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Ejercicio">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Burpees"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Grupo Muscular</Label>
          <select
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:border-lime-500 focus:outline-none"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
          >
            {MUSCLE_GROUPS.map(group => (
                <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
            </Button>
            <Button type="submit" variant="primary">
                Crear Ejercicio
            </Button>
        </div>
      </form>
    </Modal>
  );
}
