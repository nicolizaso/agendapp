import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Card';
import { CheckboxRow } from '../../../components/ui/CheckboxRow';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import { db } from '../../../lib/db';
import { buildExportBundle, downloadBundle, type ExportSelection } from '../../../lib/dataTransfer';

export function ExportView() {
  const routines = useGymStore((state) => state.routines);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const exercises = useGymStore((state) => state.exercises);
  const plans = useAgendaStore((state) => state.plans);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const sessions = useAgendaStore((state) => state.sessions);
  const getSessions = useAgendaStore((state) => state.getSessions);

  const [routineIds, setRoutineIds] = useState<Set<number>>(new Set());
  const [planIds, setPlanIds] = useState<Set<number>>(new Set());
  const [customExercises, setCustomExercises] = useState(false);
  const [workouts, setWorkouts] = useState(false);
  const [agenda, setAgenda] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    getRoutines();
    getPlans();
    getSessions();
    db.workouts
      .count()
      .then(setWorkoutCount)
      .catch(() => setWorkoutCount(0));
  }, [getRoutines, getPlans, getSessions]);

  const customExerciseCount = useMemo(() => exercises.filter((exercise) => exercise.isCustom).length, [exercises]);

  const toggleRoutine = (id: number, checked: boolean) => {
    setRoutineIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const togglePlan = (id: number, checked: boolean) => {
    setPlanIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const hasSelection =
    routineIds.size > 0 || planIds.size > 0 || customExercises || workouts || agenda;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const selection: ExportSelection = {
        routineIds: Array.from(routineIds),
        customExercises,
        planIds: Array.from(planIds),
        workouts,
        agenda,
      };

      const bundle = await buildExportBundle(selection);
      downloadBundle(bundle);
      toast.success('Listo, se descargó el archivo con tus datos');
    } catch (err) {
      console.error('No se pudo generar el archivo de exportación', err);
      toast.error('No se pudo generar el archivo');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <SelectableSection
        title="Rutinas"
        emptyLabel="Todavía no tenés rutinas creadas."
        items={routines.map((routine) => ({ id: routine.id as number, label: routine.name }))}
        selectedIds={routineIds}
        onToggle={toggleRoutine}
        onSelectAll={(ids) => setRoutineIds(new Set(ids))}
      />

      <SelectableSection
        title="Planes de entrenamiento"
        emptyLabel="Todavía no tenés planes de entrenamiento."
        items={plans.map((plan) => ({ id: plan.id as number, label: plan.name }))}
        selectedIds={planIds}
        onToggle={togglePlan}
        onSelectAll={(ids) => setPlanIds(new Set(ids))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Otros datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckboxRow
            checked={customExercises}
            onChange={setCustomExercises}
            label="Ejercicios creados a mano"
            hint={
              customExerciseCount > 0
                ? `${customExerciseCount} ejercicio${customExerciseCount === 1 ? '' : 's'} propio${customExerciseCount === 1 ? '' : 's'}`
                : 'No creaste ejercicios propios todavía'
            }
            disabled={customExerciseCount === 0}
          />
          <CheckboxRow
            checked={workouts}
            onChange={setWorkouts}
            label="Entrenamientos guardados"
            hint={
              workoutCount > 0
                ? `${workoutCount} sesión${workoutCount === 1 ? '' : 'es'} registrada${workoutCount === 1 ? '' : 's'}`
                : 'No tenés entrenamientos guardados todavía'
            }
            disabled={workoutCount === 0}
          />
          <CheckboxRow
            checked={agenda}
            onChange={setAgenda}
            label="Configuración de la agenda"
            hint={
              sessions.length > 0
                ? `${sessions.length} turno${sessions.length === 1 ? '' : 's'} agendado${sessions.length === 1 ? '' : 's'}`
                : 'No tenés turnos agendados todavía'
            }
            disabled={sessions.length === 0}
          />
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" disabled={!hasSelection || isExporting} onClick={handleExport}>
        <Download className="h-4 w-4" />
        {isExporting ? 'Generando…' : 'Generar y descargar JSON'}
      </Button>
    </div>
  );
}

function SelectableSection({
  title,
  emptyLabel,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
}: {
  title: string;
  emptyLabel: string;
  items: { id: number; label: string }[];
  selectedIds: Set<number>;
  onToggle: (id: number, checked: boolean) => void;
  onSelectAll: (ids: number[]) => void;
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectAll(allSelected ? [] : items.map((item) => item.id))}
            className="text-xs font-semibold text-ember-400 hover:text-ember-300"
          >
            {allSelected ? 'Ninguna' : 'Todas'}
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-ink-500">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <CheckboxRow
              key={item.id}
              checked={selectedIds.has(item.id)}
              onChange={(checked) => onToggle(item.id, checked)}
              label={item.label}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
