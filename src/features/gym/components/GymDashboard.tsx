import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  History,
  Play,
} from 'lucide-react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { db } from '../../../lib/db';
import { formatDurationLong } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import type { Routine, Workout } from '../../../types';

const LAST_ROUTINE_KEY = 'carga:last-routine';
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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

export function GymDashboard() {
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const startWorkout = useGymStore((state) => state.startWorkout);
  const loadRoutineIntoWorkout = useGymStore((state) => state.loadRoutineIntoWorkout);
  const getWorkoutsForMonth = useGymStore((state) => state.getWorkoutsForMonth);

  // `null` = todavía no eligió nada en esta sesión; ahí manda la última usada.
  const [choice, setChoice] = useState<{ routineId: number | null } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [monthWorkouts, setMonthWorkouts] = useState<{ day: number; workoutId: number }[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [openWorkoutId, setOpenWorkoutId] = useState<number | null>(null);

  useEffect(() => {
    getRoutines();
  }, [getRoutines]);

  // Días entrenados del mes visible.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const days = await getWorkoutsForMonth(monthCursor.getFullYear(), monthCursor.getMonth());
      if (!cancelled) setMonthWorkouts(days);
    })();

    return () => {
      cancelled = true;
    };
  }, [getWorkoutsForMonth, monthCursor]);

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
  }, []);

  // La rutina propuesta es la última que entrenaste, no una al azar.
  const selectedRoutine: Routine | null = useMemo(() => {
    if (choice) return routines.find((routine) => routine.id === choice.routineId) ?? null;

    const stored = Number(window.localStorage.getItem(LAST_ROUTINE_KEY));
    return routines.find((routine) => routine.id === stored) ?? routines[0] ?? null;
  }, [choice, routines]);

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
    if (selectedRoutine?.id) {
      window.localStorage.setItem(LAST_ROUTINE_KEY, String(selectedRoutine.id));
      loadRoutineIntoWorkout(selectedRoutine.id);
    } else {
      window.localStorage.removeItem(LAST_ROUTINE_KEY);
      startWorkout();
    }
  };

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const leading = firstWeekday === 0 ? 6 : firstWeekday - 1;

    const trainedDays = new Map(monthWorkouts.map((item) => [item.day, item.workoutId]));
    const today = new Date();

    return [
      ...Array.from({ length: leading }, (_, index) => ({ key: `empty-${index}`, day: null } as const)),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
          key: `day-${day}`,
          day,
          workoutId: trainedDays.get(day) ?? null,
          isToday:
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear(),
        };
      }),
    ];
  }, [monthCursor, monthWorkouts]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      {/* Punto de partida de la sesión */}
      <section className="relative overflow-hidden rounded-card border border-ink-800 bg-ink-900 p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ember-500/12 blur-3xl" />

        <div className="relative space-y-4">
          <p className="text-sm text-ink-400">{greeting()}. ¿Qué entrenás hoy?</p>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPickerOpen((previous) => !previous)}
              aria-expanded={isPickerOpen}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3 text-left transition-colors hover:border-ember-500/40"
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-ink-500">
                  Plan de hoy
                </span>
                <span className="mt-0.5 block truncate font-heading text-lg font-bold text-ink-100">
                  {selectedRoutine ? selectedRoutine.name : 'Entrenamiento libre'}
                </span>
              </span>
              <ChevronDown
                className={cn('h-5 w-5 shrink-0 text-ink-400 transition-transform', isPickerOpen && 'rotate-180')}
              />
            </button>

            {isPickerOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPickerOpen(false)} role="presentation" />
                <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-ink-700 bg-ink-850 shadow-lift animate-in fade-in zoom-in-95 duration-150">
                  <PickerRow
                    label="Entrenamiento libre"
                    hint="Agregás los ejercicios sobre la marcha"
                    isSelected={!selectedRoutine}
                    onClick={() => {
                      setChoice({ routineId: null });
                      setIsPickerOpen(false);
                    }}
                  />
                  {routines.map((routine) => (
                    <PickerRow
                      key={routine.id}
                      label={routine.name}
                      isSelected={selectedRoutine?.id === routine.id}
                      onClick={() => {
                        setChoice({ routineId: routine.id ?? null });
                        setIsPickerOpen(false);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <Button size="xl" className="w-full text-base" onClick={handleStart}>
            <Play className="h-5 w-5 fill-current" /> Empezar a entrenar
          </Button>
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

function PickerRow({
  label,
  hint,
  isSelected,
  onClick,
}: {
  label: string;
  hint?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b border-ink-800 p-4 text-left transition-colors last:border-0 hover:bg-ink-800',
        isSelected ? 'text-ember-300' : 'text-ink-200'
      )}
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>}
      </span>
      {isSelected && <Check className="h-4 w-4 shrink-0" />}
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
