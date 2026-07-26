import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { useGymStore } from '../../../hooks/useGymStore';
import type { Exercise } from '../../../types';
import { Shuffle } from 'lucide-react';

interface BusyMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseIndex: number;
  currentExerciseName: string;
  muscleGroup: string;
}

export function BusyMachineModal({ isOpen, onClose, exerciseIndex, currentExerciseName, muscleGroup }: BusyMachineModalProps) {
  const { exercises, swapActiveExercise } = useGymStore();
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);

  useEffect(() => {
    if (isOpen) {
        // Find alternatives with the same muscle group, excluding the current one
        const alts = exercises
            .filter(ex => ex.muscleGroup === muscleGroup && ex.name !== currentExerciseName)
            .sort(() => 0.5 - Math.random()) // simple shuffle
            .slice(0, 3);
        setAlternatives(alts);
    }
  }, [isOpen, exercises, muscleGroup, currentExerciseName]);

  const handleSwap = (newExercise: Exercise) => {
    swapActiveExercise(exerciseIndex, newExercise);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Máquina Ocupada">
        <div className="space-y-6">
            <p className="text-sm text-neutral-400 text-center px-4">
                ¿No puedes hacer <strong className="text-neutral-200">{currentExerciseName}</strong>? Aquí tienes alternativas para el mismo grupo muscular ({muscleGroup}).
            </p>

            <div className="space-y-3">
                {alternatives.length > 0 ? (
                    alternatives.map(ex => (
                        <div key={ex.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-white text-lg">{ex.name}</h4>
                                {ex.equipment && (
                                     <span className="text-[10px] uppercase font-bold bg-neutral-950 text-neutral-500 px-2 py-1 rounded">
                                        {ex.equipment}
                                     </span>
                                )}
                            </div>

                            <Button
                                onClick={() => handleSwap(ex)}
                                variant="outline"
                                className="w-full min-h-[48px] gap-2 text-lime-500 hover:text-lime-400 hover:border-lime-500/50 hover:bg-lime-950/20"
                            >
                                <Shuffle className="w-4 h-4" /> Reemplazar solo por hoy
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 border border-dashed border-neutral-800 rounded-xl text-neutral-500">
                        No hay alternativas configuradas para {muscleGroup}.
                    </div>
                )}
            </div>

            <Button variant="ghost" className="w-full min-h-[48px]" onClick={onClose}>
                Cancelar
            </Button>
        </div>
    </Modal>
  );
}
