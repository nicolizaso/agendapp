import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Select } from '../../../components/Select';
import { useAgendaStore, type SchedulePayload } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { isPlanFinished } from '../../../lib/progression';
import { WEEKDAYS } from '../../../lib/weekdays';
import { cn } from '../../../lib/utils';
import type { ScheduledSession } from '../../../types';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: ScheduledSession | null;
  /** Prefill al agendar desde el detalle de un plan. */
  prefill?: { planId: number; planDayId?: number };
}

export function ScheduleSessionModal({ isOpen, onClose, editing, prefill }: ScheduleSessionModalProps) {
  const routines = useGymStore((state) => state.routines);
  const plans = useAgendaStore((state) => state.plans);
  const planDays = useAgendaStore((state) => state.planDays);
  const getPlanDays = useAgendaStore((state) => state.getPlanDays);
  const createSession = useAgendaStore((state) => state.createSession);
  const updateSession = useAgendaStore((state) => state.updateSession);

  const initialSource: 'routine' | 'plan' = editing?.planId
    ? 'plan'
    : prefill
      ? 'plan'
      : 'routine';

  const [source, setSource] = useState<'routine' | 'plan'>(initialSource);
  const [dayOfWeek, setDayOfWeek] = useState<number>(editing?.dayOfWeek ?? new Date().getDay());
  const [time, setTime] = useState(editing?.time ?? '18:00');
  const [routineId, setRoutineId] = useState<string>(
    editing?.routineId ? String(editing.routineId) : String(routines[0]?.id ?? '')
  );
  const [planId, setPlanId] = useState<string>(
    editing?.planId
      ? String(editing.planId)
      : prefill
        ? String(prefill.planId)
        : String(plans.find((plan) => !isPlanFinished(plan))?.id ?? '')
  );
  const [planDayId, setPlanDayId] = useState<string>(
    editing?.planDayId ? String(editing.planDayId) : prefill?.planDayId ? String(prefill.planDayId) : ''
  );
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Los planes finalizados no se pueden agendar de nuevo, salvo que el turno que se está
  // editando ya los tuviera asignados (para no hacerlo desaparecer solo por editar el horario).
  const selectablePlans = plans.filter((plan) => !isPlanFinished(plan) || plan.id === editing?.planId);
  const daysOfSelectedPlan = planDays.filter((day) => day.planId === Number(planId));

  // Al elegir un plan hace falta conocer sus días para poder elegir uno.
  useEffect(() => {
    if (planId) getPlanDays(Number(planId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // Si el plan elegido cambia (o sus días todavía no cargaron), el día seleccionado se
  // ajusta solo al primero disponible para no dejar el formulario en un estado inválido.
  useEffect(() => {
    if (daysOfSelectedPlan.length === 0) return;
    if (!daysOfSelectedPlan.some((day) => String(day.id) === planDayId)) {
      setPlanDayId(String(daysOfSelectedPlan[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysOfSelectedPlan.map((day) => day.id).join(',')]);

  const isSaveDisabled =
    (source === 'routine' && !routineId) || (source === 'plan' && (!planId || !planDayId)) || isSaving;

  const handleSave = async () => {
    if (isSaveDisabled) return;
    setIsSaving(true);

    const payload: SchedulePayload = {
      dayOfWeek,
      time,
      notes: notes.trim() || undefined,
      ...(source === 'routine'
        ? { routineId: Number(routineId) }
        : { planId: Number(planId), planDayId: Number(planDayId) }),
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
      description="Elegí el día de la semana y el horario en que vas a entrenar, cada semana."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Día de la semana</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setDayOfWeek(day.value)}
                className={cn(
                  'h-11 rounded-xl border text-sm font-semibold transition-colors',
                  dayOfWeek === day.value
                    ? 'border-ember-500 bg-ember-500/10 text-ember-300'
                    : 'border-ink-800 bg-ink-900 text-ink-400 hover:text-ink-100'
                )}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-time">Horario</Label>
          <Input id="schedule-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
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
              disabled={selectablePlans.length === 0}
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
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="schedule-plan">Plan</Label>
              <Select id="schedule-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
                {selectablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                    {isPlanFinished(plan) ? ' (finalizado)' : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-plan-day">Día del plan</Label>
              {daysOfSelectedPlan.length === 0 ? (
                <p className="text-sm text-ink-500">Este plan todavía no tiene días configurados.</p>
              ) : (
                <Select id="schedule-plan-day" value={planDayId} onChange={(event) => setPlanDayId(event.target.value)}>
                  {daysOfSelectedPlan.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.label}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <p className="text-xs text-ink-500">
              La semana de progresión que toca se calcula sola según los turnos agendados de ese día que ya pasaron.
            </p>
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
