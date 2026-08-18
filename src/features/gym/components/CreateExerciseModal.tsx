import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { useGymStore } from '../../../hooks/useGymStore';
import { MUSCLE_GROUP_OPTIONS, EQUIPMENT_OPTIONS } from '../taxonomy';
import { cn } from '../../../lib/utils';
import type { Exercise } from '../../../types';

/** ~1,5 MB en base64: por encima de eso IndexedDB se vuelve lento. */
const MAX_IMAGE_BYTES = 1_500_000;

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

/**
 * El formulario se monta recién al abrirse, así que cada apertura arranca
 * limpio sin necesidad de resetear el estado a mano.
 */
export function CreateExerciseModal({ isOpen, onClose, onExerciseCreated }: CreateExerciseModalProps) {
  if (!isOpen) return null;
  return <CreateExerciseForm onClose={onClose} onExerciseCreated={onExerciseCreated} />;
}

function CreateExerciseForm({ onClose, onExerciseCreated }: Omit<CreateExerciseModalProps, 'isOpen'>) {
  const addExercise = useGymStore((state) => state.addExercise);

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUP_OPTIONS[0]);
  const [equipment, setEquipment] = useState<string>(EQUIPMENT_OPTIONS[0]);
  const [fitNotes, setFitNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    const created = await addExercise({
      name,
      muscleGroup,
      equipment,
      fitNotes: fitNotes.trim() || undefined,
      gifUrl: gifUrl || undefined,
      instructions: instructions.trim() ? [instructions.trim()] : undefined,
    });
    setIsSaving(false);

    if (created) {
      onExerciseCreated(created);
      onClose();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('La imagen supera 1,5 MB. Probá con una más liviana.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageError(null);
      setGifUrl(reader.result as string);
    };
    reader.onerror = () => setImageError('No se pudo leer la imagen.');
    reader.readAsDataURL(file);
  };

  return (
    <Modal isOpen onClose={onClose} title="Nuevo ejercicio" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="exercise-name">
            Nombre <span className="text-ember-400">*</span>
          </Label>
          <Input
            id="exercise-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Press plano con mancuernas"
            autoFocus
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Grupo muscular</Label>
          <ChipGroup options={MUSCLE_GROUP_OPTIONS} value={muscleGroup} onChange={setMuscleGroup} />
        </div>

        <div className="space-y-2">
          <Label>Equipamiento</Label>
          <ChipGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
        </div>

        <div className="space-y-2">
          <Label>Imagen de referencia</Label>
          {gifUrl ? (
            <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-ink-800 bg-ink-950">
              <img src={gifUrl} alt="Vista previa" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setGifUrl(null)}
                aria-label="Quitar imagen"
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl border border-ink-800 bg-ink-950/80 text-ink-300 hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-800 text-ink-500 transition-colors hover:border-ember-500/50 hover:text-ink-300"
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Subir imagen</span>
            </button>
          )}
          {imageError && <p className="text-xs text-flare-400">{imageError}</p>}
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-notes">Puesta a punto</Label>
          <textarea
            id="exercise-notes"
            value={fitNotes}
            onChange={(event) => setFitNotes(event.target.value)}
            placeholder="Ej. Asiento en 3, agarre ancho"
            className="h-20 w-full resize-none rounded-xl border border-ink-800 bg-ink-950 p-3 text-sm text-ink-100 transition-colors placeholder:text-ink-600 focus:border-ember-500 focus:outline-none"
          />
          <p className="text-xs text-ink-500">
            Aparece durante el entrenamiento, para no volver a buscar la regulación de la máquina.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-tips">Tips de ejecución</Label>
          <textarea
            id="exercise-tips"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Ej. Mantener el core firme y bajar controlado"
            className="h-20 w-full resize-none rounded-xl border border-ink-800 bg-ink-950 p-3 text-sm text-ink-100 transition-colors placeholder:text-ink-600 focus:border-ember-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" disabled={!name.trim() || isSaving}>
            {isSaving ? 'Guardando...' : 'Crear ejercicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'h-10 rounded-full border px-4 text-sm font-semibold transition-all',
            value === option
              ? 'border-ember-500 bg-ember-500 text-ink-950'
              : 'border-ink-800 bg-ink-950 text-ink-400 hover:text-ink-100'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
