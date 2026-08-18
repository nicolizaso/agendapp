import { useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { useAgendaStore, type PlanDayPayload, type PlanExercisePayload } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { PlanDayCard, type PlanDayCardHandle, type PlanDayInitial } from './PlanDayCard';
import type { TrainingPlan } from '../../../types';

const DAY_LETTERS = 'ABCDEFGHIJ';

/** "2026-08-18" a partir de un Date, sin corrimientos de huso horario. */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextDayLabel(count: number): string {
  const letter = DAY_LETTERS[count % DAY_LETTERS.length] ?? String(count + 1);
  return `Día ${letter}`;
}

let keySeed = 0;
function newKey(): string {
  keySeed += 1;
  return `new-${keySeed}`;
}

export interface PlanFormDayInitial {
  id?: number;
  label: string;
  routineId: number;
  exerciseConfig: Record<number, PlanExercisePayload>;
}

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: { plan: TrainingPlan; days: PlanFormDayInitial[] } | null;
}

export function PlanFormModal({ isOpen, onClose, editing }: PlanFormModalProps) {
  const createPlan = useAgendaStore((state) => state.createPlan);
  const updatePlan = useAgendaStore((state) => state.updatePlan);
  const routines = useGymStore((state) => state.routines);
  const catalog = useGymStore((state) => state.exercises);

  const [name, setName] = useState(editing?.plan.name ?? '');
  const [startDate, setStartDate] = useState(toDateInputValue(editing?.plan.startDate ?? new Date()));
  const [endDate, setEndDate] = useState(editing?.plan.endDate ? toDateInputValue(editing.plan.endDate) : '');
  const [isSaving, setIsSaving] = useState(false);

  const [days, setDays] = useState<{ key: string; initial: PlanDayInitial }[]>(() => {
    if (editing && editing.days.length > 0) {
      return editing.days.map((day) => ({
        key: day.id ? `existing-${day.id}` : newKey(),
        initial: {
          id: day.id,
          label: day.label,
          routineId: String(day.routineId),
          exerciseConfig: day.exerciseConfig,
        },
      }));
    }

    return [{ key: newKey(), initial: { label: nextDayLabel(0), routineId: '', exerciseConfig: {} } }];
  });

  const [validity, setValidity] = useState<Record<string, boolean>>({});
  const handlesRef = useRef<Record<string, PlanDayCardHandle | null>>({});

  const addDay = () => {
    setDays((previous) => [
      ...previous,
      { key: newKey(), initial: { label: nextDayLabel(previous.length), routineId: '', exerciseConfig: {} } },
    ]);
  };

  const removeDay = (key: string) => {
    setDays((previous) => previous.filter((day) => day.key !== key));
    setValidity((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    delete handlesRef.current[key];
  };

  const isDateRangeValid = Boolean(startDate) && Boolean(endDate) && endDate > startDate;
  const allDaysValid = days.length > 0 && days.every((day) => validity[day.key]);
  const isSaveDisabled = !name.trim() || !isDateRangeValid || !allDaysValid || isSaving;

  const handleSave = async () => {
    if (isSaveDisabled) return;
    setIsSaving(true);

    const payload: PlanDayPayload[] = [];
    for (const day of days) {
      const dayPayload = handlesRef.current[day.key]?.getPayload();
      if (!dayPayload) {
        setIsSaving(false);
        return;
      }
      payload.push(dayPayload);
    }

    const parsedStartDate = new Date(`${startDate}T00:00`);
    const parsedEndDate = new Date(`${endDate}T00:00`);

    if (editing?.plan.id) {
      await updatePlan(editing.plan.id, name.trim(), parsedStartDate, parsedEndDate, payload);
      toast.success('Plan actualizado');
    } else {
      await createPlan(name.trim(), parsedStartDate, parsedEndDate, payload);
      toast.success('Plan creado');
    }

    setIsSaving(false);
    onClose();
  };

  const routinesSorted = useMemo(() => routines, [routines]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Editar plan' : 'Nuevo plan de entrenamiento'}
      description="Armá uno o más días (Día A, Día B...), cada uno con su rutina: Carga les sube el peso solo, cada 3 turnos entrenados de ese día."
      size="lg"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="plan-name">Nombre del plan</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Mesociclo de fuerza"
            autoFocus={!editing}
          />
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label>Días del plan</Label>
              <span className="rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[11px] font-bold text-ember-400">
                {days.length}
              </span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addDay}>
              <Plus className="h-4 w-4" /> Agregar día
            </Button>
          </div>

          <ul className="space-y-3">
            {days.map((day) => (
              <PlanDayCard
                key={day.key}
                ref={(handle) => {
                  handlesRef.current[day.key] = handle;
                }}
                initial={day.initial}
                routines={routinesSorted}
                catalog={catalog}
                canRemove={days.length > 1}
                onRemove={() => removeDay(day.key)}
                onValidityChange={(isValid) => setValidity((previous) => ({ ...previous, [day.key]: isValid }))}
              />
            ))}
          </ul>
        </section>

        <Button size="lg" className="w-full" disabled={isSaveDisabled} onClick={handleSave}>
          {editing ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>
    </Modal>
  );
}
