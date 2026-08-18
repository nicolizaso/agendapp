import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Select } from '../../../components/Select';
import { useAgendaStore, type SchedulePayload } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { weekIndexForDate } from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import type { ScheduledSession } from '../../../types';

/** "2026-08-18" a partir de un Date, sin corrimientos de huso horario. */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: ScheduledSession | null;
  /** Prefill al agendar desde el detalle de un plan. */
  prefill?: { planId: number; weekIndex: number; date?: Date };
}

export function ScheduleSessionModal({ isOpen, onClose, editing, prefill }: ScheduleSessionModalProps) {
  const routines = useGymStore((state) => state.routines);
  const plans = useAgendaStore((state) => state.plans);
  const createSession = useAgendaStore((state) => state.createSession);
  const updateSession = useAgendaStore((state) => state.updateSession);

  const initialSource: 'routine' | 'plan' = editing?.planId
    ? 'plan'
    : prefill
      ? 'plan'
      : 'routine';

  const [source, setSource] = useState<'routine' | 'plan'>(initialSource);
  const [date, setDate] = useState(
    toDateInputValue(editing?.date ?? prefill?.date ?? new Date())
  );
  const [time, setTime] = useState(editing?.time ?? '18:00');
  const [routineId, setRoutineId] = useState<string>(
    editing?.routineId ? String(editing.routineId) : String(routines[0]?.id ?? '')
  );
  const [planId, setPlanId] = useState<string>(
    editing?.planId ? String(editing.planId) : prefill ? String(prefill.planId) : String(plans[0]?.id ?? '')
  );
  const [weekIndex, setWeekIndex] = useState<string>(
    editing?.weekIndex !== undefined
      ? String(editing.weekIndex)
      : prefill
        ? String(prefill.weekIndex)
        : '0'
  );
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const selectedPlan = plans.find((plan) => plan.id === Number(planId));

  const handlePlanChange = (id: string) => {
    setPlanId(id);
    const plan = plans.find((item) => item.id === Number(id));
    if (plan && date) {
      setWeekIndex(String(weekIndexForDate(new Date(plan.startDate), new Date(`${date}T00:00`))));
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    if (source === 'plan' && selectedPlan) {
      setWeekIndex(String(weekIndexForDate(new Date(selectedPlan.startDate), new Date(`${value}T00:00`))));
    }
  };

  const isSaveDisabled =
    !date ||
    !time ||
    (source === 'routine' && !routineId) ||
    (source === 'plan' && (!planId || weekIndex === '')) ||
    isSaving;

  const handleSave = async () => {
    if (isSaveDisabled) return;
    setIsSaving(true);

    const payload: SchedulePayload = {
      date: new Date(`${date}T00:00`),
      time,
      notes: notes.trim() || undefined,
      ...(source === 'routine'
        ? { routineId: Number(routineId) }
        : { planId: Number(planId), weekIndex: Math.max(0, parseInt(weekIndex, 10) || 0) }),
    };

    if (editing?.id) {
      await updateSession(editing.id, payload);
      toast.success('Turno actualizado');
    } else {
      await createSession(payload);
      toast.success('Turno agendado');
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Editar turno' : 'Agendar turno'}
      description="Elegí día, horario y qué vas a entrenar."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Día</Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-time">Horario</Label>
            <Input id="schedule-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Qué vas a entrenar</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSource('routine')}
              className={cn(
                'h-11 rounded-xl border text-sm font-semibold transition-colors',
                source === 'routine'
                  ? 'border-ember-500 bg-ember-500/10 text-ember-300'
                  : 'border-ink-800 bg-ink-900 text-ink-400 hover:text-ink-100'
              )}
            >
              Rutina
            </button>
            <button
              type="button"
              onClick={() => setSource('plan')}
              disabled={plans.length === 0}
              className={cn(
                'h-11 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-40',
                source === 'plan'
                  ? 'border-ember-500 bg-ember-500/10 text-ember-300'
                  : 'border-ink-800 bg-ink-900 text-ink-400 hover:text-ink-100'
              )}
            >
              Plan de entrenamiento
            </button>
          </div>
        </div>

        {source === 'routine' ? (
          <div className="space-y-2">
            <Label htmlFor="schedule-routine">Rutina</Label>
            {routines.length === 0 ? (
              <p className="text-sm text-ink-500">Todavía no tenés rutinas creadas.</p>
            ) : (
              <Select id="schedule-routine" value={routineId} onChange={(event) => setRoutineId(event.target.value)}>
                {routines.map((routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="schedule-plan">Plan</Label>
              <Select id="schedule-plan" value={planId} onChange={(event) => handlePlanChange(event.target.value)}>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-week">Semana</Label>
              <Input
                id="schedule-week"
                type="number"
                min={0}
                value={weekIndex}
                onChange={(event) => setWeekIndex(event.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="schedule-notes">Notas (opcional)</Label>
          <Input
            id="schedule-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej. llevar toalla, ir antes a calentar..."
          />
        </div>

        <Button size="lg" className="w-full" disabled={isSaveDisabled} onClick={handleSave}>
          {editing ? 'Guardar cambios' : 'Agendar turno'}
        </Button>
      </div>
    </Modal>
  );
}
