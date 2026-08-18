import { useMemo, useRef, useState } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { useAgendaStore, type PlanDayPayload, type PlanExercisePayload } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { WEEKDAYS } from '../../../lib/weekdays';
import { PlanDayCard, type PlanDayCardHandle, type PlanDayInitial } from './PlanDayCard';
import type { TrainingPlan } from '../../../types';

const DEFAULT_TIME = '18:00';

/** "2026-08-18" a partir de un Date, sin corrimientos de huso horario. */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Primer día de la semana libre, arrancando el lunes. */
function firstFreeWeekday(taken: number[]): number {
  return WEEKDAYS.find((day) => !taken.includes(day.value))?.value ?? 1;
}

let keySeed = 0;
function newKey(): string {
  keySeed += 1;
  return `new-${keySeed}`;
}

export interface PlanFormDayInitial {
  id?: number;
  dayOfWeek: number;
  time: string;
  routineId: number;
  exerciseConfig: Record<number, PlanExercisePayload>;
}

interface FormDay {
  key: string;
  dayOfWeek: number;
  time: string;
  initial: PlanDayInitial;
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

  const [days, setDays] = useState<FormDay[]>(() => {
    if (editing && editing.days.length > 0) {
      return editing.days.map((day) => ({
        key: day.id ? `existing-${day.id}` : newKey(),
        dayOfWeek: day.dayOfWeek,
        time: day.time,
        initial: {
          id: day.id,
          routineId: String(day.routineId),
          exerciseConfig: day.exerciseConfig,
        },
      }));
    }

    return [{ key: newKey(), dayOfWeek: 1, time: DEFAULT_TIME, initial: { routineId: '', exerciseConfig: {} } }];
  });

  const [validity, setValidity] = useState<Record<string, boolean>>({});
  const handlesRef = useRef<Record<string, PlanDayCardHandle | null>>({});

  const takenDays = days.map((day) => day.dayOfWeek);

  const addDay = () => {
    setDays((previous) => [
      ...previous,
      {
        key: newKey(),
        dayOfWeek: firstFreeWeekday(previous.map((day) => day.dayOfWeek)),
        time: previous[previous.length - 1]?.time ?? DEFAULT_TIME,
        initial: { routineId: '', exerciseConfig: {} },
      },
    ]);
  };

  const patchDay = (key: string, patch: Partial<Pick<FormDay, 'dayOfWeek' | 'time'>>) => {
    setDays((previous) => previous.map((day) => (day.key === key ? { ...day, ...patch } : day)));
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
  const hasFreeWeekday = days.length < WEEKDAYS.length;
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
      toast.success('Plan actualizado y agenda al día');
    } else {
      await createPlan(name.trim(), parsedStartDate, parsedEndDate, payload);
      toast.success('Plan creado: ya quedó agendado en el calendario');
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
      description="Elegí qué días de la semana entrenás y con qué rutina: el calendario se llena solo entre la fecha de inicio y la de fin."
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
            <Label htmlFor="plan-start">Arranca el</Label>
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

        <p className="flex items-start gap-2 rounded-card border border-ember-500/25 bg-ember-500/5 px-4 py-3 text-xs leading-relaxed text-ember-200">
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-ember-400" />
          Cada día que agregues se repite todas las semanas entre esas dos fechas y queda cargado solo en el
          calendario, con el peso que corresponda a esa semana.
        </p>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label>Días de entrenamiento</Label>
              <span className="rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[11px] font-bold text-ember-400">
                {days.length}
              </span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addDay} disabled={!hasFreeWeekday}>
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
                dayOfWeek={day.dayOfWeek}
                time={day.time}
                takenDays={takenDays}
                onDayOfWeekChange={(dayOfWeek) => patchDay(day.key, { dayOfWeek })}
                onTimeChange={(time) => patchDay(day.key, { time })}
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
          {editing ? 'Guardar cambios' : 'Crear plan y agendar'}
        </Button>
      </div>
    </Modal>
  );
}
