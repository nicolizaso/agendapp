import { useEffect, useState } from 'react';
import { Dumbbell, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAgendaStore } from '../../hooks/useAgendaStore';
import { useGymStore } from '../../hooks/useGymStore';
import { useUIStore } from '../../hooks/useUIStore';
import { PlanFormModal } from './components/PlanFormModal';
import { PlanDetailModal } from './components/PlanDetailModal';
import { isPlanFinished } from '../../lib/progression';
import type { EquipmentType, TrainingPlan } from '../../types';

export function PlansPage() {
  const plans = useAgendaStore((state) => state.plans);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const getSessions = useAgendaStore((state) => state.getSessions);
  const getPlanExercises = useAgendaStore((state) => state.getPlanExercises);
  const deletePlan = useAgendaStore((state) => state.deletePlan);
  const catalog = useGymStore((state) => state.exercises);
  const openConfirmDialog = useUIStore((state) => state.openConfirmDialog);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<{
    plan: TrainingPlan;
    exercises: { exerciseId: number; name: string; equipmentType: EquipmentType; initialWeight: number; incrementOverride?: number }[];
  } | null>(null);
  const [detailPlan, setDetailPlan] = useState<TrainingPlan | null>(null);
  const [exerciseCounts, setExerciseCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    getPlans();
    getSessions();
  }, [getPlans, getSessions]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const counts: Record<number, number> = {};
      for (const plan of plans) {
        if (typeof plan.id !== 'number') continue;
        const items = await getPlanExercises(plan.id);
        counts[plan.id] = items.length;
      }
      if (!cancelled) setExerciseCounts(counts);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = async (plan: TrainingPlan) => {
    if (typeof plan.id !== 'number') return;
    const items = await getPlanExercises(plan.id);

    setEditing({
      plan,
      exercises: items.map((item) => {
        const definition = catalog.find((exercise) => exercise.id === item.exerciseId);
        return {
          exerciseId: item.exerciseId,
          name: definition?.name ?? 'Ejercicio no disponible',
          equipmentType: item.equipmentType,
          initialWeight: item.initialWeight,
          incrementOverride: item.incrementOverride,
        };
      }),
    });
    setIsFormOpen(true);
  };

  const handleDelete = (plan: TrainingPlan) => {
    if (typeof plan.id !== 'number') return;

    openConfirmDialog({
      title: '¿Eliminar el plan?',
      message: `"${plan.name}" se borra junto con los turnos agendados que lo usan.`,
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
            Progresión automática: el peso sube cada 3 turnos entrenados, según el equipamiento.
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
            Elegí los ejercicios y el peso inicial: Carga calcula sola cuánto subir cada 3 semanas.
          </p>
          <Button size="lg" className="mt-6 w-full max-w-xs" onClick={openCreate}>
            Crear mi primer plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const finished = isPlanFinished(plan);
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
                <span className="mt-3 flex w-fit items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 px-2 py-1 text-xs font-medium text-ink-300">
                  <Dumbbell className="h-3.5 w-3.5 text-ink-500" />
                  {exerciseCounts[plan.id as number] ?? 0} ejercicios
                </span>
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
