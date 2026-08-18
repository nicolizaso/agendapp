import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Select } from '../../../components/Select';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { WEEKDAYS } from '../../../lib/weekdays';
import { cn } from '../../../lib/utils';
import type { ScheduledSession } from '../../../types';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: ScheduledSession | null;
}

/**
 * Turno suelto: una rutina que se entrena siempre el mismo día de la semana, sin plan
 * detrás. Los días de un plan no se agendan acá — los arma el propio plan al crearse.
 */
export function ScheduleSessionModal({ isOpen, onClose, editing }: ScheduleSessionModalProps) {
  const routines = useGymStore((state) => state.routines);
  const createSession = useAgendaStore((state) => state.createSession);
  const updateSession = useAgendaStore((state) => state.updateSession);

  const [dayOfWeek, setDayOfWeek] = useState<number>(editing?.dayOfWeek ?? new Date().getDay());
  const [time, setTime] = useState(editing?.time ?? '18:00');
  const [routineId, setRoutineId] = useState<string>(
    editing?.routineId ? String(editing.routineId) : String(routines[0]?.id ?? '')
  );
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const isSaveDisabled = !routineId || isSaving;

  const handleSave = async () => {
    if (isSaveDisabled) return;
    setIsSaving(true);

    const payload = {
      dayOfWeek,
      time,
      notes: notes.trim() || undefined,
      routineId: Number(routineId),
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
      title={editing ? 'Editar turno' : 'Agendar turno suelto'}
      description="Una rutina que entrenás siempre el mismo día de la semana, sin plan de progresión."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Día de la semana</Label>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                aria-pressed={dayOfWeek === day.value}
                aria-label={day.label}
                onClick={() => setDayOfWeek(day.value)}
                className={cn(
                  'flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition-colors',
                  dayOfWeek === day.value
                    ? 'border-ember-500 bg-ember-500 text-ink-950'
                    : 'border-ink-800 bg-ink-900 text-ink-400 hover:border-ink-700 hover:text-ink-100'
                )}
              >
                {day.letter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-time">Horario</Label>
          <Input id="schedule-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </div>

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
