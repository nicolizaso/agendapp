import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Select } from '../../../components/Select';
import { db } from '../../../lib/db';
import { useAgendaStore, type PlanExercisePayload } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { EQUIPMENT_OPTIONS } from '../../gym/taxonomy';
import { getDefaultIncrement } from '../../../lib/progression';
import type { EquipmentType, TrainingPlan } from '../../../types';

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
  /** `exerciseConfig` trae la progresión ya cargada de cada ejercicio, por exerciseId. */
  editing?: { plan: TrainingPlan; exerciseConfig: Record<number, PlanExercisePayload> } | null;
}

export function PlanFormModal({ isOpen, onClose, editing }: PlanFormModalProps) {
  const createPlan = useAgendaStore((state) => state.createPlan);
  const updatePlan = useAgendaStore((state) => state.updatePlan);
  const routines = useGymStore((state) => state.routines);
  const catalog = useGymStore((state) => state.exercises);

  const [name, setName] = useState(editing?.plan.name ?? '');
  const [routineId, setRoutineId] = useState<string>(
    editing?.plan.routineId ? String(editing.plan.routineId) : ''
  );
  const [startDate, setStartDate] = useState(toDateInputValue(editing?.plan.startDate ?? new Date()));
  const [endDate, setEndDate] = useState(editing?.plan.endDate ? toDateInputValue(editing.plan.endDate) : '');
  const [rows, setRows] = useState<PlanExerciseRow[]>([]);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Los ejercicios del plan son siempre los de la rutina elegida, en su mismo orden: al
  // cambiar de rutina se releen sus ejercicios y se conserva la progresión ya cargada para
  // los que coinciden por exerciseId.
  useEffect(() => {
    if (!routineId) {
      setRows([]);
      return;
    }

    let cancelled = false;
    setIsLoadingRoutine(true);

    (async () => {
      const routineExercises = await db.routineExercises
        .where('routineId')
        .equals(Number(routineId))
        .sortBy('order');

      if (cancelled) return;

      const nextRows: PlanExerciseRow[] = routineExercises.map((routineExercise) => {
        const definition = catalog.find((exercise) => exercise.id === routineExercise.exerciseId);
        const previousConfig = editing?.exerciseConfig[routineExercise.exerciseId];
        const fallbackEquipment = (EQUIPMENT_OPTIONS as readonly string[]).includes(definition?.equipment ?? '')
          ? (definition?.equipment as EquipmentType)
          : ('Otro' as EquipmentType);

        return {
          exerciseId: routineExercise.exerciseId,
          name: definition?.name ?? 'Ejercicio no disponible',
          equipmentType: previousConfig?.equipmentType ?? fallbackEquipment,
          initialWeight: previousConfig?.initialWeight ?? 0,
          incrementOverride: previousConfig?.incrementOverride,
        };
      });

      setRows(nextRows);
      setIsLoadingRoutine(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, catalog]);

  const isDateRangeValid = Boolean(startDate) && Boolean(endDate) && endDate > startDate;
  const isSaveDisabled =
    !name.trim() ||
    !routineId ||
    !isDateRangeValid ||
    rows.length === 0 ||
    rows.some((row) => !(row.initialWeight >= 0)) ||
    isLoadingRoutine ||
    isSaving;

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
    const parsedStartDate = new Date(`${startDate}T00:00`);
    const parsedEndDate = new Date(`${endDate}T00:00`);
    const parsedRoutineId = Number(routineId);

    if (editing?.plan.id) {
      await updatePlan(editing.plan.id, name.trim(), parsedRoutineId, parsedStartDate, parsedEndDate, payload);
      toast.success('Plan actualizado');
    } else {
      await createPlan(name.trim(), parsedRoutineId, parsedStartDate, parsedEndDate, payload);
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
      description="El plan usa los ejercicios de una rutina y les sube el peso solo: máquina +6 kg, mancuerna +2,5 kg, barra +2,5 kg, polea +5 kg."
      size="lg"
    >
      <div className="space-y-5">
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
          <Label htmlFor="plan-routine">Rutina a progresar</Label>
          {routines.length === 0 ? (
            <p className="text-sm text-ink-500">
              Todavía no tenés rutinas creadas. Armá una rutina primero y después volvé a crear el plan.
            </p>
          ) : (
            <Select id="plan-routine" value={routineId} onChange={(event) => setRoutineId(event.target.value)}>
              <option value="" disabled>
                Elegí una rutina
              </option>
              {routines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))}
            </Select>
          )}
          <p className="text-xs text-ink-500">
            El plan usa siempre los ejercicios de esta rutina, en su mismo orden. Si después le agregás o sacás
            ejercicios a la rutina, el plan lo refleja solo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plan-start">Semana 0 arranca el</Label>
            <Input id="plan-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-end">Termina el</Label>
            <Input
              id="plan-end"
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            {editing && !editing.plan.endDate && (
              <p className="text-xs text-ember-400">Este plan es de antes y no tiene fecha de fin: completala para poder guardarlo.</p>
            )}
            {endDate && startDate && endDate <= startDate && (
              <p className="text-xs text-flare-400">Tiene que ser posterior a la fecha de inicio.</p>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Progresión por ejercicio</Label>
            <span className="rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[11px] font-bold text-ember-400">
              {rows.length}
            </span>
          </div>

          {!routineId ? (
            <p className="rounded-card border border-dashed border-ink-800 bg-ink-900/40 px-4 py-8 text-center text-sm text-ink-500">
              Elegí una rutina para configurar el peso inicial de cada ejercicio.
            </p>
          ) : rows.length === 0 ? (
            <p className="rounded-card border border-dashed border-ink-800 bg-ink-900/40 px-4 py-8 text-center text-sm text-ink-500">
              {isLoadingRoutine ? 'Cargando ejercicios de la rutina...' : 'Esta rutina todavía no tiene ejercicios.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((row, index) => {
                const defaultIncrement = getDefaultIncrement(row.equipmentType);

                return (
                  <li key={row.exerciseId} className="space-y-3 rounded-card border border-ink-800 bg-ink-900 p-4">
                    <h3 className="min-w-0 truncate font-semibold text-ink-100">{row.name}</h3>

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
        </section>

        <Button size="lg" className="w-full" disabled={isSaveDisabled} onClick={handleSave}>
          {editing ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>
    </Modal>
  );
}
