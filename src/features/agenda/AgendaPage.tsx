import { useEffect, useState } from 'react';
import { CalendarClock, CalendarPlus, Pencil, Play, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAgendaStore } from '../../hooks/useAgendaStore';
import { useGymStore } from '../../hooks/useGymStore';
import { useUIStore } from '../../hooks/useUIStore';
import { isPlanFinished, weekIndexForPlan } from '../../lib/progression';
import { cn } from '../../lib/utils';
import { WEEKDAYS } from '../../lib/weekdays';
import { ScheduleSessionModal } from './components/ScheduleSessionModal';
import { PlansPage } from '../plans/PlansPage';
import type { ScheduledSession } from '../../types';

type SubTab = 'sessions' | 'plans';

export function AgendaPage() {
  const [subTab, setSubTab] = useState<SubTab>('sessions');

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">Agenda</h1>
        <p className="mt-1 text-sm text-ink-400">
          Elegí qué día de la semana entrenás cada rutina o plan, y planificá la progresión.
        </p>
      </header>

      <div className="flex w-fit items-center gap-1 rounded-2xl border border-ink-800 bg-ink-900 p-1">
        <SubTabButton active={subTab === 'sessions'} onClick={() => setSubTab('sessions')}>
          Turnos
        </SubTabButton>
        <SubTabButton active={subTab === 'plans'} onClick={() => setSubTab('plans')}>
          Planes
        </SubTabButton>
      </div>

      {subTab === 'sessions' ? <SessionsView /> : <PlansPage />}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-xl px-4 text-sm font-semibold transition-colors',
        active ? 'bg-ember-500 text-ink-950' : 'text-ink-400 hover:text-ink-100'
      )}
    >
      {children}
    </button>
  );
}

function SessionsView() {
  const sessions = useAgendaStore((state) => state.sessions);
  const getSessions = useAgendaStore((state) => state.getSessions);
  const deleteSession = useAgendaStore((state) => state.deleteSession);
  const plans = useAgendaStore((state) => state.plans);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const loadRoutineIntoWorkout = useGymStore((state) => state.loadRoutineIntoWorkout);
  const loadPlanWeekIntoWorkout = useGymStore((state) => state.loadPlanWeekIntoWorkout);
  const openConfirmDialog = useUIStore((state) => state.openConfirmDialog);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledSession | null>(null);

  useEffect(() => {
    getSessions();
    getRoutines();
    getPlans();
  }, [getSessions, getRoutines, getPlans]);

  const today = new Date().getDay();

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const handleDelete = (session: ScheduledSession) => {
    if (typeof session.id !== 'number') return;

    openConfirmDialog({
      title: '¿Eliminar el turno?',
      message: 'El turno agendado se borra de forma permanente.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: () => deleteSession(session.id as number),
    });
  };

  const handleStart = (session: ScheduledSession) => {
    if (session.routineId) {
      loadRoutineIntoWorkout(session.routineId);
    } else if (session.planId) {
      const plan = plans.find((item) => item.id === session.planId);
      if (!plan || isPlanFinished(plan)) return;
      // La semana de progresión que toca se planifica sola: se calcula contando los
      // turnos agendados de este plan que ya transcurrieron, no hace falta guardarla.
      const weekIndex = weekIndexForPlan(plan, sessions);
      loadPlanWeekIntoWorkout(session.planId, weekIndex);
    }
  };

  const describe = (session: ScheduledSession) => {
    if (session.routineId) {
      const routine = routines.find((item) => item.id === session.routineId);
      return { label: routine?.name ?? 'Rutina eliminada', canStart: Boolean(routine) };
    }
    if (session.planId) {
      const plan = plans.find((item) => item.id === session.planId);
      if (!plan) return { label: 'Plan eliminado', canStart: false };

      const finished = isPlanFinished(plan);
      const weekIndex = weekIndexForPlan(plan, sessions);
      return {
        label: finished ? `${plan.name} · Finalizado` : `${plan.name} · Semana ${weekIndex + 1}`,
        canStart: !finished,
      };
    }
    return { label: 'Entrenamiento libre', canStart: false };
  };

  const hasSessions = sessions.length > 0;

  return (
    <div className="space-y-6">
      <Button size="lg" className="w-full sm:w-auto" onClick={openCreate}>
        <CalendarPlus className="h-4 w-4" /> Agendar turno
      </Button>

      {!hasSessions ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-ink-800 bg-ink-900/40 px-6 py-16 text-center">
          <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-ink-800 bg-ink-900 text-ember-400">
            <CalendarClock className="h-9 w-9" />
          </span>
          <h2 className="font-heading text-xl font-bold text-ink-100">No tenés turnos agendados</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-400">
            Elegí un día de la semana, un horario y qué rutina o plan vas a entrenar.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {WEEKDAYS.map((day) => {
            const daySessions = sessions
              .filter((session) => session.dayOfWeek === day.value)
              .sort((a, b) => a.time.localeCompare(b.time));

            if (daySessions.length === 0) return null;

            const isToday = day.value === today;

            return (
              <li key={day.value} className="space-y-2">
                <h2
                  className={cn(
                    'flex items-center gap-2 text-sm font-bold uppercase tracking-wider',
                    isToday ? 'text-ember-400' : 'text-ink-500'
                  )}
                >
                  {day.label}
                  {isToday && (
                    <span className="rounded-full border border-ember-500/40 bg-ember-500/10 px-2 py-0.5 text-[10px] font-bold">
                      Hoy
                    </span>
                  )}
                </h2>

                <ul className="space-y-3">
                  {daySessions.map((session) => {
                    const info = describe(session);

                    return (
                      <li
                        key={session.id}
                        className="flex items-center gap-3 rounded-card border border-ink-800 bg-ink-900 p-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-ink-800 bg-ink-950 text-ink-200">
                          <span className="text-[10px] font-bold uppercase text-ember-400">{day.short}</span>
                          <span className="text-sm font-bold leading-none tabular-nums">{session.time}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate font-semibold text-ink-100">
                            {info.label}
                            {session.planId && <TrendingUp className="h-3.5 w-3.5 shrink-0 text-ember-400" />}
                          </p>
                          <p className="text-xs text-ink-500">
                            {session.time}
                            {session.notes ? ` · ${session.notes}` : ''}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={!info.canStart}
                            onClick={() => handleStart(session)}
                            aria-label="Empezar"
                          >
                            <Play className="h-4 w-4 fill-current" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditing(session);
                              setIsFormOpen(true);
                            }}
                            aria-label="Editar turno"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(session)}
                            aria-label="Eliminar turno"
                            className="hover:border-flare-500/40 hover:text-flare-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {isFormOpen && (
        <ScheduleSessionModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} editing={editing} />
      )}
    </div>
  );
}
