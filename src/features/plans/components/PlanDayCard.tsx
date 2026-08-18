import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { Select } from '../../../components/Select';
import { db } from '../../../lib/db';
import { cn } from '../../../lib/utils';
import { WEEKDAYS, weekdayLabel } from '../../../lib/weekdays';
import type { PlanDayPayload, PlanExercisePayload } from '../../../hooks/useAgendaStore';
import { EQUIPMENT_OPTIONS } from '../../gym/taxonomy';
import { getDefaultIncrement } from '../../../lib/progression';
import type { EquipmentType, Exercise, Routine } from '../../../types';

interface PlanExerciseRow extends PlanExercisePayload {
  name: string;
}

export interface PlanDayInitial {
  id?: number;
  routineId: string;
  /** Progresión ya cargada de este día, por exerciseId (sólo se usa la primera vez que se
   *  resuelve cada rutina; si el usuario cambia de rutina y vuelve, se vuelve a aplicar). */
  exerciseConfig: Record<number, PlanExercisePayload>;
}

export interface PlanDayCardHandle {
  /** `null` si el día no está completo (sin rutina, sin ejercicios, o con algún peso inválido). */
  getPayload: () => PlanDayPayload | null;
}

interface PlanDayCardProps {
  initial: PlanDayInitial;
  /** Día de la semana y horario los maneja el formulario, que es quien evita repetidos. */
  dayOfWeek: number;
  time: string;
  onDayOfWeekChange: (dayOfWeek: number) => void;
  onTimeChange: (time: string) => void;
  /** Días de la semana ya usados por los otros días del plan. */
  takenDays: number[];
  routines: Routine[];
  catalog: Exercise[];
  onRemove: () => void;
  onValidityChange: (isValid: boolean) => void;
  canRemove: boolean;
}

export const PlanDayCard = forwardRef<PlanDayCardHandle, PlanDayCardProps>(function PlanDayCard(
  {
    initial,
    dayOfWeek,
    time,
    onDayOfWeekChange,
    onTimeChange,
    takenDays,
    routines,
    catalog,
    onRemove,
    onValidityChange,
    canRemove,
  },
  ref
) {
  const [routineId, setRoutineId] = useState(initial.routineId);
  const [rows, setRows] = useState<PlanExerciseRow[]>([]);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);

  // Los ejercicios del día son siempre los de la rutina elegida, en su mismo orden: al
  // cambiar de rutina se releen sus ejercicios y se conserva la progresión ya cargada
  // para los que coinciden por exerciseId.
  useEffect(() => {
    if (!routineId) {
      setRows([]);
      return;
    }

    let cancelled = false;
    setIsLoadingRoutine(true);

    (async () => {
      const routineExercises = await db.routineExercises.where('routineId').equals(Number(routineId)).sortBy('order');
      if (cancelled) return;

      const nextRows: PlanExerciseRow[] = routineExercises.map((routineExercise) => {
        const definition = catalog.find((exercise) => exercise.id === routineExercise.exerciseId);
        const previousConfig = initial.exerciseConfig[routineExercise.exerciseId];
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

  const isValid =
    Boolean(routineId) &&
    Boolean(time) &&
    rows.length > 0 &&
    !isLoadingRoutine &&
    rows.every((row) => row.initialWeight >= 0);

  useEffect(() => {
    onValidityChange(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useImperativeHandle(ref, () => ({
    getPayload: () => {
      if (!isValid) return null;
      return {
        id: initial.id,
        dayOfWeek,
        time,
        routineId: Number(routineId),
        exercises: rows.map((row) => ({
          exerciseId: row.exerciseId,
          equipmentType: row.equipmentType,
          initialWeight: row.initialWeight,
          incrementOverride: row.incrementOverride,
        })),
      };
    },
  }));

  const updateRow = (index: number, patch: Partial<PlanExerciseRow>) => {
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <li className="space-y-4 rounded-card border border-ink-800 bg-ink-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-base font-bold text-ink-100">{weekdayLabel(dayOfWeek)}</p>
          <p className="text-xs text-ink-500">Se repite todas las semanas del plan</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Quitar día"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-flare-500/15 hover:text-flare-400 disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Label>Día de la semana</Label>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((day) => {
            const isTaken = takenDays.includes(day.value) && day.value !== dayOfWeek;
            const isSelected = day.value === dayOfWeek;

            return (
              <button
                key={day.value}
                type="button"
                disabled={isTaken}
                aria-pressed={isSelected}
                aria-label={day.label}
                onClick={() => onDayOfWeekChange(day.value)}
                className={cn(
                  'flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition-colors',
                  isSelected
                    ? 'border-ember-500 bg-ember-500 text-ink-950'
                    : isTaken
                      ? 'border-ink-850 bg-ink-900 text-ink-700'
                      : 'border-ink-800 bg-ink-900 text-ink-400 hover:border-ink-700 hover:text-ink-100'
                )}
              >
                {day.letter}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
        <div className="space-y-2">
          <Label>Rutina de este día</Label>
          {routines.length === 0 ? (
            <p className="text-sm text-ink-500">Todavía no tenés rutinas creadas.</p>
          ) : (
            <Select value={routineId} onChange={(event) => setRoutineId(event.target.value)}>
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
        </div>
        <div className="space-y-2">
          <Label>Horario</Label>
          <Input type="time" value={time} onChange={(event) => onTimeChange(event.target.value)} />
        </div>
      </div>

      {!routineId ? (
        <p className="rounded-card border border-dashed border-ink-800 bg-ink-900/40 px-4 py-6 text-center text-sm text-ink-500">
          Elegí una rutina para configurar el peso inicial de cada ejercicio.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink-800 bg-ink-900/40 px-4 py-6 text-center text-sm text-ink-500">
          {isLoadingRoutine ? 'Cargando ejercicios de la rutina...' : 'Esta rutina todavía no tiene ejercicios.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const defaultIncrement = getDefaultIncrement(row.equipmentType);

            return (
              <li key={row.exerciseId} className="space-y-3 rounded-xl border border-ink-800 bg-ink-850/60 p-3">
                <h4 className="min-w-0 truncate text-sm font-semibold text-ink-100">{row.name}</h4>

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
                      onChange={(event) => updateRow(index, { incrementOverride: parseFloat(event.target.value) || 0 })}
                      className="h-11 text-sm"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
});
