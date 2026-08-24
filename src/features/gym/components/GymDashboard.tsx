import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  History,
  Moon,
  Play,
} from 'lucide-react';
import { useGymStore, type PlanCompletion } from '../../../hooks/useGymStore';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { Button } from '../../../components/Button';
import { db } from '../../../lib/db';
import { entriesForDate, type DayEntry } from '../../../lib/agendaDays';
import { formatDurationLong } from '../../../lib/format';
import { atMidnight } from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import type { Routine, Workout } from '../../../types';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const NO_PLAN_MESSAGE =
  'No tenés entrenamientos planificados para hoy. Podés descansar o hacer una rutina de entrenamiento libre.';
/** Dentro del menú abierto la lista de rutinas ya está a la vista, así que alcanza con el aviso corto. */
const NO_PLAN_MENU_MESSAGE = 'Hoy el plan no tiene nada. Podés descansar o elegir algo de acá abajo.';

/** Qué se va a entrenar al tocar "Empezar": lo que toca según el plan, una rutina suelta o nada. */
type Choice =
  | { kind: 'planned'; key: string }
  | { kind: 'routine'; routineId: number }
  | { kind: 'free' };

type Selection =
  | { kind: 'planned'; entry: DayEntry }
  | { kind: 'routine'; routine: Routine }
  | { kind: 'free' };

/** "agosto de 2026" -> "Agosto 2026" (sin el "de" que ensucia el título). */
function monthLabel(date: Date) {
  const month = date.toLocaleString('es-AR', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Buenas noches';
  if (hour < 13) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Renglón que acompaña a cada entrenamiento planificado: de qué plan sale y en qué semana va. */
function entryHint(entry: DayEntry): string {
  if (entry.kind !== 'plan') return `${entry.time} · Turno suelto`;
  return `${entry.time} · ${entry.planName} · Semana ${(entry.weekIndex ?? 0) + 1} de ${entry.totalWeeks}`;
}

export function GymDashboard() {
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const startWorkout = useGymStore((state) => state.startWorkout);
  const loadRoutineIntoWorkout = useGymStore((state) => state.loadRoutineIntoWorkout);
  const loadPlanDayIntoWorkout = useGymStore((state) => state.loadPlanDayIntoWorkout);
  const getWorkoutsForMonth = useGymStore((state) => state.getWorkoutsForMonth);
  const getPlanCompletions = useGymStore((state) => state.getPlanCompletions);
  const isWorkoutActive = useGymStore((state) => state.isWorkoutActive);

  const plans = useAgendaStore((state) => state.plans);
  const planDays = useAgendaStore((state) => state.planDays);
  const sessions = useAgendaStore((state) => state.sessions);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const getSessions = useAgendaStore((state) => state.getSessions);

  // `null` = todavía no eligió nada en esta sesión; ahí manda lo que dice el plan.
  const [choice, setChoice] = useState<Choice | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerRect, setPickerRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const pickerButtonRef = useRef<HTMLButtonElement>(null);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [monthWorkouts, setMonthWorkouts] = useState<{ day: number; workoutId: number }[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<PlanCompletion[]>([]);
  const [openWorkoutId, setOpenWorkoutId] = useState<number | null>(null);
  const [today] = useState(() => atMidnight(new Date()));

  useEffect(() => {
    getRoutines();
    getPlans();
    getSessions();
  }, [getRoutines, getPlans, getSessions]);

  // Días entrenados del mes visible. Se relee al cerrar una sesión para que el día recién
  // entrenado aparezca sin recargar.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const days = await getWorkoutsForMonth(monthCursor.getFullYear(), monthCursor.getMonth());
      if (!cancelled) setMonthWorkouts(days);
    })();

    return () => {
      cancelled = true;
    };
  }, [getWorkoutsForMonth, monthCursor, isWorkoutActive]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const workouts = await db.workouts.orderBy('date').reverse().limit(5).toArray();
        if (!cancelled) setRecentWorkouts(workouts);
      } catch {
        if (!cancelled) setRecentWorkouts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isWorkoutActive]);

  // Qué días del plan ya se entrenaron: es lo que marca como hecho el entrenamiento de hoy.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const done = await getPlanCompletions();
      if (!cancelled) setCompletions(done);
    })();

    return () => {
      cancelled = true;
    };
  }, [getPlanCompletions, isWorkoutActive]);

  // El menú del picker se renderiza en un portal (ver más abajo) para poder superponerse
  // a toda la pantalla; mientras está abierto seguimos la posición del botón que lo abre.
  useEffect(() => {
    if (!isPickerOpen) return;

    const updateRect = () => {
      const rect = pickerButtonRef.current?.getBoundingClientRect();
      if (rect) setPickerRect({ top: rect.bottom, left: rect.left, width: rect.width });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isPickerOpen]);

  // Lo que el plan de entrenamiento tiene puesto para hoy: los días de plan que caen hoy
  // más los turnos sueltos de ese día, en orden de horario.
  const plannedToday = useMemo(
    () => entriesForDate(today, { plans, planDays, sessions, routines }),
    [today, plans, planDays, sessions, routines]
  );

  const isEntryDone = (entry: DayEntry) =>
    typeof entry.planDayId === 'number' &&
    typeof entry.weekIndex === 'number' &&
    completions.some(
      (item) => item.planDayId === entry.planDayId && item.weekIndex === entry.weekIndex
    );

  /**
   * Sin elección explícita manda el plan: se propone el primer entrenamiento planificado
   * de hoy que todavía no se hizo (o el primero, si ya se hicieron todos). Si hoy no hay
   * nada planificado no se propone ninguna rutina: es día de descanso.
   */
  const selection: Selection | null = useMemo(() => {
    if (choice?.kind === 'free') return { kind: 'free' };

    if (choice?.kind === 'routine') {
      const routine = routines.find((item) => item.id === choice.routineId);
      if (routine) return { kind: 'routine', routine };
    }

    if (choice?.kind === 'planned') {
      const entry = plannedToday.find((item) => item.key === choice.key);
      if (entry) return { kind: 'planned', entry };
    }

    const usable = plannedToday.filter((entry) => entry.routineExists);
    const suggested = usable.find((entry) => !isEntryDone(entry)) ?? usable[0];
    return suggested ? { kind: 'planned', entry: suggested } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, routines, plannedToday, completions]);

  const selectedDone = selection?.kind === 'planned' && isEntryDone(selection.entry);

  const stats = useMemo(() => {
    const now = new Date();
    const isCurrentMonth =
      monthCursor.getFullYear() === now.getFullYear() && monthCursor.getMonth() === now.getMonth();

    const uniqueDays = new Set(monthWorkouts.map((item) => item.day));

    return {
      sessions: uniqueDays.size,
      isCurrentMonth,
      lastSession: recentWorkouts[0] ?? null,
    };
  }, [monthWorkouts, monthCursor, recentWorkouts]);

  const handleStart = () => {
    if (!selection || selection.kind === 'free') {
      startWorkout();
      return;
    }

    if (selection.kind === 'routine') {
      if (typeof selection.routine.id === 'number') loadRoutineIntoWorkout(selection.routine.id);
      return;
    }

    const { entry } = selection;
    if (!entry.routineExists) return;

    // El entrenamiento del plan arranca con la progresión de la semana que toca hoy, y queda
    // imputado a ese día del plan: es lo que después marca la semana como entrenada.
    if (typeof entry.planDayId === 'number' && typeof entry.weekIndex === 'number') {
      loadPlanDayIntoWorkout(entry.planDayId, entry.weekIndex);
    } else {
      loadRoutineIntoWorkout(entry.routineId);
    }
  };

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const leading = firstWeekday === 0 ? 6 : firstWeekday - 1;

    const trainedDays = new Map(monthWorkouts.map((item) => [item.day, item.workoutId]));
    const now = new Date();

    return [
      ...Array.from({ length: leading }, (_, index) => ({ key: `empty-${index}`, day: null } as const)),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
          key: `day-${day}`,
          day,
          workoutId: trainedDays.get(day) ?? null,
          isToday:
            day === now.getDate() &&
            month === now.getMonth() &&
            year === now.getFullYear(),
        };
      }),
    ];
  }, [monthCursor, monthWorkouts]);

  const selectionTitle =
    selection === null
      ? 'Día de descanso'
      : selection.kind === 'free'
        ? 'Entrenamiento libre'
        : selection.kind === 'routine'
          ? selection.routine.name
          : selection.entry.routineName;

  const selectionHint =
    selection === null
      ? NO_PLAN_MESSAGE
      : selection.kind === 'free'
        ? 'Agregás los ejercicios sobre la marcha'
        : selection.kind === 'routine'
          ? 'Rutina suelta, fuera del plan'
          : entryHint(selection.entry);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      {/* Punto de partida de la sesión: lo que el plan de entrenamiento tiene puesto para hoy */}
      <section className="relative overflow-hidden rounded-card border border-ink-800 bg-ink-900 p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ember-500/12 blur-3xl" />

        <div className="relative space-y-4">
          <p className="text-sm text-ink-400">
            {greeting()}. {plannedToday.length > 0 ? '¿Arrancamos?' : '¿Qué entrenás hoy?'}
          </p>

          <div className="relative">
            <button
              ref={pickerButtonRef}
              type="button"
              onClick={() => setIsPickerOpen((previous) => !previous)}
              aria-expanded={isPickerOpen}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3 text-left transition-colors hover:border-ember-500/40"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">
                  {selection?.kind === 'planned' ? 'Plan de hoy' : 'Hoy'}
                  {selectedDone && (
                    <span className="flex items-center gap-1 rounded-full border border-mint-500/30 bg-mint-500/10 px-1.5 py-0.5 text-mint-300">
                      <Check className="h-3 w-3" /> Entrenado
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex items-center gap-2 font-heading text-lg font-bold',
                    selection === null ? 'text-ink-300' : 'text-ink-100'
                  )}
                >
                  {selection === null && <Moon className="h-4 w-4 shrink-0 text-ink-500" />}
                  <span className="min-w-0 truncate">{selectionTitle}</span>
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-xs',
                    selection === null ? 'text-ink-400' : 'truncate text-ink-500'
                  )}
                >
                  {selectionHint}
                </span>
              </span>
              <ChevronDown
                className={cn('h-5 w-5 shrink-0 text-ink-400 transition-transform', isPickerOpen && 'rotate-180')}
              />
            </button>

            {/* En un portal: la sección tiene overflow-hidden por el degradé de fondo, así que
                si el menú quedara adentro del flujo normal se recortaría contra ese borde en vez
                de sobreponerse a toda la pantalla. */}
            {isPickerOpen &&
              pickerRect &&
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[9100]"
                    onClick={() => setIsPickerOpen(false)}
                    role="presentation"
                  />
                  <div
                    style={{ top: pickerRect.top + 8, left: pickerRect.left, width: pickerRect.width }}
                    className="fixed z-[9101] max-h-72 overflow-y-auto rounded-2xl border border-ink-700 bg-ink-850 shadow-lift animate-in fade-in zoom-in-95 duration-150"
                  >
                    <PickerGroup label="Planificado para hoy" />
                    {plannedToday.length === 0 ? (
                      <p className="border-b border-ink-800 p-4 text-xs leading-relaxed text-ink-400">
                        {NO_PLAN_MENU_MESSAGE}
                      </p>
                    ) : (
                      plannedToday.map((entry) => (
                        <PickerRow
                          key={entry.key}
                          label={entry.routineName}
                          hint={entryHint(entry)}
                          isDone={isEntryDone(entry)}
                          isDisabled={!entry.routineExists}
                          isSelected={selection?.kind === 'planned' && selection.entry.key === entry.key}
                          onClick={() => {
                            setChoice({ kind: 'planned', key: entry.key });
                            setIsPickerOpen(false);
                          }}
                        />
                      ))
                    )}

                    <PickerGroup label="Fuera del plan" />
                    <PickerRow
                      label="Entrenamiento libre"
                      hint="Agregás los ejercicios sobre la marcha"
                      isSelected={selection?.kind === 'free'}
                      onClick={() => {
                        setChoice({ kind: 'free' });
                        setIsPickerOpen(false);
                      }}
                    />
                    {routines.map((routine) => (
                      <PickerRow
                        key={routine.id}
                        label={routine.name}
                        isSelected={selection?.kind === 'routine' && selection.routine.id === routine.id}
                        onClick={() => {
                          setChoice({ kind: 'routine', routineId: routine.id ?? -1 });
                          setIsPickerOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </>,
                document.body
              )}
          </div>

          {selection?.kind === 'planned' && !selection.entry.routineExists ? (
            <p className="text-sm text-flare-400">
              La rutina de este día del plan fue eliminada. Editá el plan para volver a asignarle una.
            </p>
          ) : null}

          {/* En un día sin nada planificado el descanso es la propuesta: el botón deja de ser
              el llamado principal y entrenar igual queda como la opción secundaria. */}
          <Button
            size="xl"
            variant={selection === null ? 'secondary' : 'primary'}
            className="w-full text-base"
            disabled={selection?.kind === 'planned' && !selection.entry.routineExists}
            onClick={handleStart}
          >
            <Play className="h-5 w-5 fill-current" />
            {selection === null
              ? 'Entrenar igual, sin plan'
              : selectedDone
                ? 'Volver a entrenar'
                : 'Empezar a entrenar'}
          </Button>

          {plannedToday.length > 1 && (
            <p className="text-xs text-ink-500">
              Hoy tenés {plannedToday.length} entrenamientos planificados: elegí cuál arrancás.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label={stats.isCurrentMonth ? 'Este mes' : 'Ese mes'}
          value={`${stats.sessions}`}
          hint={stats.sessions === 1 ? 'sesión' : 'sesiones'}
        />
        <StatCard
          icon={History}
          label="Última sesión"
          value={stats.lastSession ? formatDurationLong(stats.lastSession.durationSeconds) : '—'}
          hint={
            stats.lastSession
              ? new Date(stats.lastSession.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
              : 'Sin registros'
          }
        />
      </section>

      {/* Asistencia */}
      <section className="rounded-card border border-ink-800 bg-ink-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink-100">
            <CalendarDays className="h-4 w-4 text-ember-400" />
            Asistencia
          </h2>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() =>
                setMonthCursor((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink-300">
              {monthLabel(monthCursor)}
            </span>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() =>
                setMonthCursor((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((weekday, index) => (
            <span key={index} className="text-[10px] font-bold uppercase text-ink-600">
              {weekday}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 justify-items-center gap-y-1.5">
          {calendarCells.map((cell) =>
            cell.day === null ? (
              <span key={cell.key} className="h-9 w-9" />
            ) : (
              <button
                key={cell.key}
                type="button"
                disabled={!cell.workoutId}
                onClick={() => cell.workoutId && setOpenWorkoutId(cell.workoutId)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  cell.workoutId
                    ? 'bg-ember-500 text-ink-950 hover:bg-ember-400'
                    : cell.isToday
                      ? 'border border-ink-600 text-ink-200'
                      : 'text-ink-600'
                )}
              >
                {cell.day}
              </button>
            )
          )}
        </div>
      </section>

      {recentWorkouts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-bold text-ink-100">Últimas sesiones</h2>
          <ul className="space-y-2">
            {recentWorkouts.map((workout) => (
              <li key={workout.id}>
                <button
                  type="button"
                  onClick={() => workout.id && setOpenWorkoutId(workout.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-800 bg-ink-900 p-4 text-left transition-colors hover:border-ink-700"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink-100">{workout.name}</span>
                    <span className="mt-0.5 block text-xs capitalize text-ink-500">
                      {new Date(workout.date).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-400">
                    {formatDurationLong(workout.durationSeconds)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {openWorkoutId !== null && (
        <WorkoutDetailModal workoutId={openWorkoutId} onClose={() => setOpenWorkoutId(null)} />
      )}
    </div>
  );
}

function PickerGroup({ label }: { label: string }) {
  return (
    <p className="border-b border-ink-800 bg-ink-900/60 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">
      {label}
    </p>
  );
}

function PickerRow({
  label,
  hint,
  isSelected,
  isDone,
  isDisabled,
  onClick,
}: {
  label: string;
  hint?: string;
  isSelected: boolean;
  isDone?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b border-ink-800 p-4 text-left transition-colors last:border-0 hover:bg-ink-800 disabled:pointer-events-none disabled:opacity-50',
        isSelected ? 'text-ember-300' : 'text-ink-200'
      )}
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-xs text-ink-500">{hint}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {isDone && <Check className="h-4 w-4 text-mint-400" aria-label="Ya entrenado" />}
        {isSelected && <Check className="h-4 w-4" />}
      </span>
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-card border border-ink-800 bg-ink-900 p-4">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-500">
        <Icon className="h-3.5 w-3.5 text-ember-400" />
        {label}
      </span>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-ink-100">{value}</p>
      <p className="text-xs text-ink-500">{hint}</p>
    </div>
  );
}
