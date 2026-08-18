import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Select } from '../../../components/Select';
import { useAgendaStore, type PlanExercisePayload } from '../../../hooks/useAgendaStore';
import { ExerciseSelectorDrawer } from '../../gym/components/ExerciseSelectorDrawer';
import { EQUIPMENT_OPTIONS } from '../../gym/taxonomy';
import { getDefaultIncrement } from '../../../lib/progression';
import type { EquipmentType, Exercise, TrainingPlan } from '../../../types';

/** "2026-08-18" a partir de un Date, sin corrimientos de huso horario. */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface PlanExerciseRow extends PlanExercisePayload {
  name: string;
}

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: { plan: TrainingPlan; exercises: PlanExerciseRow[] } | null;
}

export function PlanFormModal({ isOpen, onClose, editing }: PlanFormModalProps) {
  const createPlan = useAgendaStore((state) => state.createPlan);
  const updatePlan = useAgendaStore((state) => state.updatePlan);

  const [name, setName] = useState(editing?.plan.name ?? '');
  const [startDate, setStartDate] = useState(toDateInputValue(editing?.plan.startDate ?? new Date()));
  const [rows, setRows] = useState<PlanExerciseRow[]>(editing?.exercises ?? []);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSaveDisabled =
    !name.trim() || !startDate || rows.length === 0 || rows.some((row) => !(row.initialWeight >= 0)) || isSaving;

  const handleExercisesSelected = (selected: Exercise[]) => {
    setRows((previous) => {
      const existing = new Set(previous.map((row) => row.exerciseId));
      const additions = selected
        .filter((exercise) => typeof exercise.id === 'number' && !existing.has(exercise.id))
        .map((exercise) => {
          const equipmentType = (EQUIPMENT_OPTIONS as readonly string[]).includes(exercise.equipment ?? '')
            ? (exercise.equipment as EquipmentType)
            : ('Otro' as EquipmentType);

          return {
            exerciseId: exercise.id as number,
            name: exercise.name,
            equipmentType,
            initialWeight: 0,
          };
        });

      return [...previous, ...additions];
    });
  };

  const updateRow = (index: number, patch: Partial<PlanExerciseRow>) => {
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    if (isSaveDisabled) return;
    setIsSaving(true);

    const payload: PlanExercisePayload[] = rows.map((row) => ({
      exerciseId: row.exerciseId,
      equipmentType: row.equipmentType,
      initialWeight: row.initialWeight,
      incrementOverride: row.incrementOverride,
    }));
    const parsedDate = new Date(`${startDate}T00:00`);

    if (editing?.plan.id) {
      await updatePlan(editing.plan.id, name.trim(), parsedDate, payload);
      toast.success('Plan actualizado');
    } else {
      await createPlan(name.trim(), parsedDate, payload);
      toast.success('Plan creado');
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Editar plan' : 'Nuevo plan de entrenamiento'}
      description="El peso sube según la herramienta: máquina +6 kg, mancuerna +2,5 kg, barra +2,5 kg, polea +5 kg."
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Nombre del plan</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Fuerza tren superior"
              autoFocus={!editing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-start">Semana 0 arranca el</Label>
            <Input id="plan-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Ejercicios del plan</Label>
            <span className="rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[11px] font-bold text-ember-400">
              {rows.length}
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-card border border-dashed border-ink-800 bg-ink-900/40 px-4 py-8 text-center text-sm text-ink-500">
              Agregá los ejercicios cuyo peso querés ir subiendo semana a semana.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((row, index) => {
                const defaultIncrement = getDefaultIncrement(row.equipmentType);

                return (
                  <li key={`${row.exerciseId}-${index}`} className="space-y-3 rounded-card border border-ink-800 bg-ink-900 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 truncate font-semibold text-ink-100">{row.name}</h3>
                      <button
                        type="button"
                        onClick={() => setRows((previous) => previous.filter((_, i) => i !== index))}
                        aria-label={`Quitar ${row.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-flare-500/10 hover:text-flare-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">
                          Equipamiento
                        </span>
                        <Select
                          value={row.equipmentType}
                          onChange={(event) => updateRow(index, { equipmentType: event.target.value as EquipmentType })}
                          className="h-11 text-sm"
                        >
                          {EQUIPMENT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">
                          Peso inicial (kg)
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={0.5}
                          value={Number.isFinite(row.initialWeight) ? row.initialWeight : 0}
                          onChange={(event) => updateRow(index, { initialWeight: parseFloat(event.target.value) || 0 })}
                          className="h-11 text-sm"
                        />
                      </div>

                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">
                          Sube de a (kg)
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={0.5}
                          value={row.incrementOverride ?? defaultIncrement}
                          onChange={(event) =>
                            updateRow(index, { incrementOverride: parseFloat(event.target.value) || 0 })
                          }
                          className="h-11 text-sm"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Button variant="outline" size="lg" className="w-full border-dashed" onClick={() => setIsSelectorOpen(true)}>
            <Plus className="h-5 w-5 text-ember-400" /> Agregar ejercicios
          </Button>
        </section>

        <Button size="lg" className="w-full" disabled={isSaveDisabled} onClick={handleSave}>
          {editing ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>

      {isSelectorOpen && (
        <ExerciseSelectorDrawer
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          alreadyAddedIds={rows.map((row) => row.exerciseId)}
          onConfirm={handleExercisesSelected}
          confirmLabel="Agregar al plan"
        />
      )}
    </Modal>
  );
}
