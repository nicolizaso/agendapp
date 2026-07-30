import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { useGymStore } from '../../../hooks/useGymStore';
import type { Exercise } from '../../../types';
import { cn } from '../../../lib/utils';
import { Upload, X } from 'lucide-react';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Cardio', 'Otro'
];

const EQUIPMENT_OPTIONS = [
  'Mancuerna', 'Barra', 'Máquina', 'Polea', 'Peso Corporal', 'Otro'
];

export function CreateExerciseModal({ isOpen, onClose, onExerciseCreated }: CreateExerciseModalProps) {
  const { addExercise } = useGymStore();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [equipment, setEquipment] = useState(EQUIPMENT_OPTIONS[0]);
  const [fitNotes, setFitNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus cleanup and basic reset when opening/closing
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    if (isOpen) {
      setName('');
      setMuscleGroup(MUSCLE_GROUPS[0]);
      setEquipment(EQUIPMENT_OPTIONS[0]);
      setFitNotes('');
      setInstructions('');
      setGifUrl(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const instructionsArray = instructions.trim() ? [instructions.trim()] : undefined;

    const newExercise = await addExercise(
      name,
      muscleGroup,
      equipment,
      fitNotes.trim() || undefined,
      gifUrl || undefined,
      instructionsArray
    );

    if (newExercise) {
      onExerciseCreated(newExercise);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGifUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[10001] rounded-t-3xl bg-neutral-900 border-t border-neutral-800 p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 flex flex-col shadow-2xl">
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-6 shrink-0" />

        <h2 className="text-xl font-bold text-neutral-100 mb-6 shrink-0">Crear Ejercicio</h2>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
          <div className="space-y-3">
            <Label className="text-neutral-300">Nombre del Ejercicio <span className="text-lime-500">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Press de Banca"
              autoFocus
              className="h-12 bg-neutral-950 border-neutral-800 focus:border-lime-500 text-base"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-300">Grupo Muscular <span className="text-lime-500">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setMuscleGroup(group)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    muscleGroup === group
                      ? "bg-lime-500 text-black border-lime-500 shadow-md scale-[1.02]"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-300">Equipamiento <span className="text-lime-500">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => setEquipment(eq)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    equipment === eq
                      ? "bg-lime-500 text-black border-lime-500 shadow-md scale-[1.02]"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
                  )}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-300">Imagen de Referencia / GIF (Opcional)</Label>
            {gifUrl ? (
              <div className="relative w-full h-40 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden group">
                <img src={gifUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setGifUrl(null)}
                  className="absolute top-2 right-2 bg-neutral-950/80 p-2 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 hover:bg-neutral-950/50 transition-all gap-2"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Subir imagen</span>
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-300">Fit Notes (Opcional)</Label>
            <textarea
              value={fitNotes}
              onChange={(e) => setFitNotes(e.target.value)}
              placeholder="Ej. Asiento en 3, usar polea baja..."
              className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 resize-none transition-all"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-300">Tips de ejecución (Opcional)</Label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej. Mantener el core apretado..."
              className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 resize-none transition-all"
            />
          </div>

          <div className="pt-6 flex justify-end gap-3 mt-auto shrink-0 pb-safe">
            <Button type="button" variant="ghost" onClick={onClose} className="h-12 px-6">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim()}
              className="h-12 px-8 bg-lime-500 hover:bg-lime-400 text-black font-bold disabled:opacity-50"
            >
              Crear Ejercicio
            </Button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
