import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { entriesForDate, type DayEntry } from '../../../lib/agendaDays';
import { atMidnight } from '../../../lib/progression';
import { cn } from '../../../lib/utils';
import { WEEKDAYS } from '../../../lib/weekdays';
import { DayDetailModal } from './DayDetailModal';

/** "agosto de 2026" -> "Agosto 2026" (sin el "de" que ensucia el título). */
function monthLabel(date: Date): string {
  const month = date.toLocaleString('es-AR', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

interface CalendarCell {
  key: string;
  date: Date | null;
  entries: DayEntry[];
  isToday: boolean;
  isPast: boolean;
}

export function AgendaCalendar() {
  const sessions = useAgendaStore((state) => state.sessions);
  const plans = useAgendaStore((state) => state.plans);
  const planDays = useAgendaStore((state) => state.planDays);
  const getSessions = useAgendaStore((state) => state.getSessions);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);

  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [openDate, setOpenDate] = useState<Date | null>(null);

  useEffect(() => {
    getSessions();
    getPlans();
    getRoutines();
  }, [getSessions, getPlans, getRoutines]);

  const agendaData = useMemo(() => ({ plans, planDays, sessions, routines }), [plans, planDays, sessions, routines]);

  const cells: CalendarCell[] = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    // La grilla arranca el lunes, así que el domingo (0) empuja 6 celdas vacías.
    const leading = firstWeekday === 0 ? 6 : firstWeekday - 1;
    const today = atMidnight(new Date());

    return [
      ...Array.from({ length: leading }, (_, index) => ({
        key: `empty-${index}`,
        date: null,
        entries: [],
        isToday: false,
        isPast: false,
      })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        return {
          key: `day-${index + 1}`,
          date,
          entries: entriesForDate(date, agendaData),
          isToday: date.getTime() === today.getTime(),
          isPast: date < today,
        };
      }),
    ];
  }, [monthCursor, agendaData]);

  const upcoming = useMemo(() => {
    const today = atMidnight(new Date());

    return Array.from({ length: 14 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return { date, entries: entriesForDate(date, agendaData) };
    })
      .filter((day) => day.entries.length > 0)
      .slice(0, 4);
  }, [agendaData]);

  const monthSessions = cells.reduce((total, cell) => total + cell.entries.length, 0);
  const openEntries = openDate ? entriesForDate(openDate, agendaData) : [];

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-ink-800 bg-ink-900 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink-100">
              <CalendarDays className="h-4 w-4 text-ember-400" />
              {monthLabel(monthCursor)}
            </h2>
            <p className="text-xs text-ink-500">
              {monthSessions === 0
                ? 'Sin entrenamientos agendados'
                : `${monthSessions} entrenamiento${monthSessions > 1 ? 's' : ''} este mes`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setMonthCursor((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800 text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => setMonthCursor((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800 text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day.value} className="text-[10px] font-bold uppercase text-ink-600">
              {day.letter}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) =>
            cell.date === null ? (
              <span key={cell.key} className="aspect-square" />
            ) : (
              <button
                key={cell.key}
                type="button"
                disabled={cell.entries.length === 0}
                onClick={() => setOpenDate(cell.date)}
                aria-label={`${cell.date.getDate()} · ${
                  cell.entries.length === 0 ? 'sin entrenamiento' : cell.entries.map((entry) => entry.routineName).join(', ')
                }`}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition-colors',
                  cell.entries.some((entry) => entry.kind === 'plan')
                    ? 'border-ember-500/40 bg-ember-500/15 text-ember-200 hover:bg-ember-500/25'
                    : cell.entries.length > 0
                      ? 'border-ink-700 bg-ink-850 text-ink-200 hover:border-ink-600'
                      : 'border-transparent text-ink-600',
                  cell.isToday && 'ring-2 ring-ember-500 ring-offset-2 ring-offset-ink-900',
                  cell.isPast && cell.entries.length > 0 && 'opacity-55'
                )}
              >
                <span className="tabular-nums">{cell.date.getDate()}</span>
                {cell.entries.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {cell.entries.slice(0, 3).map((entry) => (
                      <span
                        key={entry.key}
                        className={cn(
                          'h-1 w-1 rounded-full',
                          entry.kind === 'plan' ? 'bg-ember-400' : 'bg-ink-400'
                        )}
                      />
                    ))}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink-800 pt-3 text-[11px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ember-500/60" /> Día de un plan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-600" /> Turno suelto
          </span>
          <span>Tocá un número para ver la rutina y los pesos.</span>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-heading text-base font-bold text-ink-100">Lo que viene</h2>
          <ul className="space-y-2">
            {upcoming.map(({ date, entries }) => (
              <li key={date.toISOString()}>
                <button
                  type="button"
                  onClick={() => setOpenDate(date)}
                  className="flex w-full items-center gap-3 rounded-card border border-ink-800 bg-ink-900 p-3 text-left transition-colors hover:border-ink-700"
                >
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-ink-800 bg-ink-950">
                    <span className="text-[10px] font-bold uppercase text-ember-400">
                      {date.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="text-base font-bold leading-none tabular-nums text-ink-100">{date.getDate()}</span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-100">
                      {entries.map((entry) => entry.routineName).join(' · ')}
                    </span>
                    <span className="block truncate text-xs text-ink-500">
                      {entries
                        .map((entry) =>
                          entry.kind === 'plan'
                            ? `${entry.time} · ${entry.planName} · Semana ${(entry.weekIndex ?? 0) + 1}`
                            : `${entry.time} · turno suelto`
                        )
                        .join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {openDate && openEntries.length > 0 && (
        <DayDetailModal date={openDate} entries={openEntries} onClose={() => setOpenDate(null)} />
      )}
    </div>
  );
}
