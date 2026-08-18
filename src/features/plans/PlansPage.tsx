import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAgendaStore, type PlanExercisePayload } from '../../hooks/useAgendaStore';
import { useGymStore } from '../../hooks/useGymStore';
import { useUIStore } from '../../hooks/useUIStore';
import { PlanFormModal, type PlanFormDayInitial } from './components/PlanFormModal';
import { PlanDetailModal } from './components/PlanDetailModal';
import { isPlanFinished } from '../../lib/progression';
import { weekdayLetter } from '../../lib/weekdays';
import type { TrainingPlan } from '../../types';

export function PlansPage() {
  const plans = useAgendaStore((state) => state.plans);
  const planDays = useAgendaStore((state) => state.planDays);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const getSessions = useAgendaStore((state) => state.getSessions);
  const getPlanExercises = useAgendaStore((state) => state.getPlanExercises);
  const deletePlan = useAgendaStore((state) => state.deletePlan);
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const openConfirmDialog = useUIStore((state) => state.openConfirmDialog);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ plan: TrainingPlan; days: PlanFormDayInitial[] } | null>(null);
  const [detailPlan, setDetailPlan] = useState<TrainingPlan | null>(null);

  useEffect(() => {
    getPlans();
    getSessions();
    getRoutines();
  }, [getPlans, getSessions, getRoutines]);

  const daysByPlan = (planId: number) => planDays.filter((day) => day.planId === planId);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = async (plan: TrainingPlan) => {
    if (typeof plan.id !== 'number') return;
    const days = daysByPlan(plan.id);

    const dayInitials: PlanFormDayInitial[] = [];
    for (const day of days) {
      if (typeof day.id !== 'number') continue;
      const items = await getPlanExercises(day.id);

      const exerciseConfig: Record<number, PlanExercisePayload> = {};
      for (const item of items) {
        exerciseConfig[item.exerciseId] = {
          exerciseId: item.exerciseId,
          equipmentType: item.equipmentType,
          initialWeight: item.initialWeight,
          incrementOverride: item.incrementOverride,
        };
      }

      dayInitials.push({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        time: day.time,
        routineId: day.routineId,
        exerciseConfig,
      });
    }

    setEditing({ plan, days: dayInitials });
    setIsFormOpen(true);
  };

  const handleDelete = (plan: TrainingPlan) => {
    if (typeof plan.id !== 'number') return;

    openConfirmDialog({
      title: '¿Eliminar el plan?',
      message: `"${plan.name}" se borra junto con los días que tenía agendados en el calendario.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: () => deletePlan(plan.id as number),
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-ink-100">Planes de entrenamiento</h2>
          <p className="mt-1 text-sm text-ink-400">
            Elegí los días de la semana y la rutina de cada uno: la agenda se arma sola y el peso sube cada 3 semanas.
          </p>
        </div>
        {plans.length > 0 && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        )}
      </header>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-ink-800 bg-ink-900/40 px-6 py-16 text-center">
          <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-ink-800 bg-ink-900 text-ember-400">
            <TrendingUp className="h-9 w-9" />
          </span>
          <h2 className="font-heading text-xl font-bold text-ink-100">Todavía no armaste ningún plan</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-400">
            Elegí los días de la semana que entrenás y su rutina: Carga carga la agenda sola y calcula cuánto subir cada 3 semanas.
          </p>
          <Button size="lg" className="mt-6 w-full max-w-xs" onClick={openCreate}>
            Crear mi primer plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const finished = isPlanFinished(plan);
            const days = typeof plan.id === 'number' ? daysByPlan(plan.id) : [];
            const missingRoutine = days.some((day) => !routines.some((routine) => routine.id === day.routineId));
            return (
            <article
              key={plan.id}
              className="flex flex-col justify-between gap-4 rounded-card border border-ink-800 bg-ink-900 p-5 transition-colors hover:border-ink-700"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-lg font-bold leading-snug text-ink-100">{plan.name}</h3>
                  {finished && (
                    <span className="shrink-0 rounded-full border border-ink-700 bg-ink-850 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-400">
                      Finalizado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {new Date(plan.startDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  {' → '}
                  {plan.endDate
                    ? new Date(plan.endDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                    : 'sin fecha de fin'}
                </p>
                {!plan.endDate && (
                  <p className="mt-1 text-xs text-ember-400">Completá la fecha de fin editando el plan.</p>
                )}
                {days.length === 0 ? (
                  <p className="mt-1 text-xs text-flare-400">Este plan todavía no tiene días configurados.</p>
                ) : missingRoutine ? (
                  <p className="mt-1 text-xs text-flare-400">Algún día de este plan quedó sin rutina (fue eliminada).</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {days.map((day) => {
                    const routine = routines.find((item) => item.id === day.routineId);
                    return (
                      <span
                        key={day.id}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 py-1 pl-1 pr-2 text-xs font-medium text-ink-300"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-ember-500/15 text-[11px] font-bold text-ember-300">
                          {weekdayLetter(day.dayOfWeek)}
                        </span>
                        {routine ? routine.name : 'Rutina eliminada'}
                        <span className="tabular-nums text-ink-500">{day.time}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-ink-800 pt-4">
                <Button size="lg" className="flex-1" onClick={() => setDetailPlan(plan)}>
                  <TrendingUp className="h-4 w-4" /> Ver progresión
                </Button>
                <Button variant="outline" size="icon" onClick={() => openEdit(plan)} aria-label="Editar plan">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(plan)}
                  aria-label="Eliminar plan"
                  className="hover:border-flare-500/40 hover:text-flare-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {isFormOpen && <PlanFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} editing={editing} />}
      {detailPlan && <PlanDetailModal isOpen onClose={() => setDetailPlan(null)} plan={detailPlan} />}
    </div>
  );
}
