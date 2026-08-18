/**
 * Exportación/importación de los datos de la persona usuaria en un único JSON.
 *
 * El archivo es autocontenido: las rutinas, planes y entrenamientos exportados llevan
 * embebida la definición de los ejercicios que referencian (`referencedExercises`), así
 * el archivo se puede importar en otro dispositivo aunque su catálogo de ejercicios
 * todavía no tenga esos ejercicios cargados.
 */
import { db } from './db';
import type { Exercise, PlanExercise, RoutineExercise, WorkoutSet } from '../types';

export const BUNDLE_APP_ID = 'carga';
export const BUNDLE_VERSION = 1;

export interface ExportedRoutine {
  id: number;
  name: string;
  created_at: string;
  exercises: Omit<RoutineExercise, 'id' | 'routineId'>[];
}

export interface ExportedPlan {
  id: number;
  name: string;
  startDate: string;
  createdAt: string;
  exercises: Omit<PlanExercise, 'id' | 'planId'>[];
}

export interface ExportedWorkoutSet {
  exerciseId: number;
  weight: number;
  reps: number;
  rpe?: number;
  date: string;
}

export interface ExportedWorkout {
  id: number;
  date: string;
  name: string;
  durationSeconds: number;
  sets: ExportedWorkoutSet[];
}

export interface ExportedAgendaSession {
  dayOfWeek: number;
  time: string;
  notes?: string;
  /** Id original de la rutina/plan en el dispositivo de origen, para poder remapearlo al importar. */
  originalRoutineId?: number;
  originalPlanId?: number;
}

export interface DataBundle {
  app: typeof BUNDLE_APP_ID;
  version: typeof BUNDLE_VERSION;
  exportedAt: string;
  routines?: ExportedRoutine[];
  customExercises?: Exercise[];
  plans?: ExportedPlan[];
  workouts?: ExportedWorkout[];
  agenda?: ExportedAgendaSession[];
  /** Ejercicios referenciados por rutinas/planes/entrenamientos, embebidos para que el archivo sea autónomo. */
  referencedExercises?: Exercise[];
}

export interface ExportSelection {
  routineIds: number[];
  customExercises: boolean;
  planIds: number[];
  workouts: boolean;
  agenda: boolean;
}

export interface ExportSummary {
  routineNames: string[];
  planNames: string[];
  customExerciseCount: number;
  workoutCount: number;
  agendaCount: number;
}

/** Catálogo completo, indexado por id, para resolver referencias sin ida y vuelta a la base. */
async function loadExerciseCatalog(): Promise<Map<number, Exercise>> {
  const all = await db.exercises.toArray();
  return new Map(all.map((exercise) => [exercise.id as number, exercise]));
}

export async function buildExportBundle(selection: ExportSelection): Promise<DataBundle> {
  const catalog = await loadExerciseCatalog();
  const referenced = new Map<number, Exercise>();
  const collectReference = (exerciseId: number) => {
    const exercise = catalog.get(exerciseId);
    if (exercise) referenced.set(exerciseId, exercise);
  };

  const bundle: DataBundle = {
    app: BUNDLE_APP_ID,
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
  };

  if (selection.routineIds.length > 0) {
    const routines = await db.routines.bulkGet(selection.routineIds);
    const exportedRoutines: ExportedRoutine[] = [];

    for (const routine of routines) {
      if (!routine || typeof routine.id !== 'number') continue;

      const exercises = await db.routineExercises.where('routineId').equals(routine.id).sortBy('order');
      exercises.forEach((exercise) => collectReference(exercise.exerciseId));

      exportedRoutines.push({
        id: routine.id,
        name: routine.name,
        created_at: new Date(routine.created_at).toISOString(),
        exercises: exercises.map(({ exerciseId, order, targetSets, targetReps, targetWeight }) => ({
          exerciseId,
          order,
          targetSets,
          targetReps,
          targetWeight,
        })),
      });
    }

    bundle.routines = exportedRoutines;
  }

  if (selection.customExercises) {
    bundle.customExercises = Array.from(catalog.values()).filter((exercise) => exercise.isCustom);
  }

  if (selection.planIds.length > 0) {
    const plans = await db.trainingPlans.bulkGet(selection.planIds);
    const exportedPlans: ExportedPlan[] = [];

    for (const plan of plans) {
      if (!plan || typeof plan.id !== 'number') continue;

      const exercises = await db.planExercises.where('planId').equals(plan.id).sortBy('order');
      exercises.forEach((exercise) => collectReference(exercise.exerciseId));

      exportedPlans.push({
        id: plan.id,
        name: plan.name,
        startDate: new Date(plan.startDate).toISOString(),
        createdAt: new Date(plan.createdAt).toISOString(),
        exercises: exercises.map(({ exerciseId, order, equipmentType, initialWeight, incrementOverride }) => ({
          exerciseId,
          order,
          equipmentType,
          initialWeight,
          incrementOverride,
        })),
      });
    }

    bundle.plans = exportedPlans;
  }

  if (selection.workouts) {
    const workouts = await db.workouts.toArray();
    const exportedWorkouts: ExportedWorkout[] = [];

    for (const workout of workouts) {
      if (typeof workout.id !== 'number') continue;

      const sets = await db.sets.where('workoutId').equals(workout.id).toArray();
      sets.forEach((set) => collectReference(set.exerciseId));

      exportedWorkouts.push({
        id: workout.id,
        date: new Date(workout.date).toISOString(),
        name: workout.name,
        durationSeconds: workout.durationSeconds,
        sets: sets.map(({ exerciseId, weight, reps, rpe, date }) => ({
          exerciseId,
          weight,
          reps,
          rpe,
          date: new Date(date).toISOString(),
        })),
      });
    }

    bundle.workouts = exportedWorkouts;
  }

  if (selection.agenda) {
    const sessions = await db.scheduledSessions.toArray();

    bundle.agenda = sessions.map((session) => ({
      dayOfWeek: session.dayOfWeek,
      time: session.time,
      notes: session.notes,
      originalRoutineId: session.routineId,
      originalPlanId: session.planId,
    }));
  }

  if (referenced.size > 0) {
    bundle.referencedExercises = Array.from(referenced.values());
  }

  return bundle;
}

/** Nombre de archivo sugerido, con la fecha para no pisar exportaciones anteriores. */
export function suggestedFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `carga-datos-${stamp}.json`;
}

export function downloadBundle(bundle: DataBundle, fileName = suggestedFileName()): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function summarizeBundle(bundle: DataBundle): ExportSummary {
  return {
    routineNames: bundle.routines?.map((routine) => routine.name) ?? [],
    planNames: bundle.plans?.map((plan) => plan.name) ?? [],
    customExerciseCount: bundle.customExercises?.length ?? 0,
    workoutCount: bundle.workouts?.length ?? 0,
    agendaCount: bundle.agenda?.length ?? 0,
  };
}

export function isDataBundle(value: unknown): value is DataBundle {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.app === BUNDLE_APP_ID && typeof candidate.version === 'number';
}

export interface ImportSelection {
  routines: boolean;
  customExercises: boolean;
  plans: boolean;
  workouts: boolean;
  agenda: boolean;
}

export interface ImportResult {
  routinesImported: number;
  exercisesImported: number;
  plansImported: number;
  workoutsImported: number;
  setsImported: number;
  agendaImported: number;
  agendaSkipped: number;
}

/**
 * Busca un ejercicio ya existente equivalente (mismo `apiId`, o mismo nombre si es
 * casero) para no duplicar el catálogo importando dos veces lo mismo.
 */
function findMatchingExercise(candidate: Exercise, existing: Exercise[]): Exercise | undefined {
  if (candidate.apiId) {
    const byApiId = existing.find((exercise) => exercise.apiId === candidate.apiId);
    if (byApiId) return byApiId;
  }

  return existing.find((exercise) => exercise.name.toLowerCase() === candidate.name.toLowerCase());
}

/**
 * Resuelve todos los ejercicios embebidos en el bundle (los de la sección elegida y los
 * referenciados por rutinas/planes/entrenamientos) contra el catálogo local, creando los
 * que falten, y devuelve el mapa de id-de-origen -> id-local para remapear referencias.
 */
async function resolveExercises(bundle: DataBundle, selection: ImportSelection): Promise<Map<number, number>> {
  const toResolve = new Map<number, Exercise>();

  if (selection.customExercises) {
    for (const exercise of bundle.customExercises ?? []) {
      if (typeof exercise.id === 'number') toResolve.set(exercise.id, exercise);
    }
  }

  const needsReferences = selection.routines || selection.plans || selection.workouts;
  if (needsReferences) {
    for (const exercise of bundle.referencedExercises ?? []) {
      if (typeof exercise.id === 'number' && !toResolve.has(exercise.id)) {
        toResolve.set(exercise.id, exercise);
      }
    }
  }

  const map = new Map<number, number>();
  if (toResolve.size === 0) return map;

  let existing = await db.exercises.toArray();

  for (const [originalId, candidate] of toResolve) {
    const match = findMatchingExercise(candidate, existing);
    if (match && typeof match.id === 'number') {
      map.set(originalId, match.id);
      continue;
    }

    const newId = (await db.exercises.add({
      name: candidate.name,
      muscleGroup: candidate.muscleGroup,
      equipment: candidate.equipment,
      fitNotes: candidate.fitNotes,
      gifUrl: candidate.gifUrl,
      instructions: candidate.instructions,
      apiId: candidate.apiId,
      isCustom: candidate.isCustom ?? true,
    })) as number;

    const created: Exercise = { ...candidate, id: newId };
    existing = [...existing, created];
    map.set(originalId, newId);
  }

  return map;
}

export async function importBundle(bundle: DataBundle, selection: ImportSelection): Promise<ImportResult> {
  const result: ImportResult = {
    routinesImported: 0,
    exercisesImported: 0,
    plansImported: 0,
    workoutsImported: 0,
    setsImported: 0,
    agendaImported: 0,
    agendaSkipped: 0,
  };

  const exerciseMap = await resolveExercises(bundle, selection);
  result.exercisesImported = exerciseMap.size;

  const routineIdMap = new Map<number, number>();
  const planIdMap = new Map<number, number>();

  if (selection.routines) {
    for (const routine of bundle.routines ?? []) {
      const newRoutineId = (await db.routines.add({
        name: routine.name,
        created_at: new Date(routine.created_at),
      })) as number;

      routineIdMap.set(routine.id, newRoutineId);

      const exercises = routine.exercises
        .map((exercise) => {
          const exerciseId = exerciseMap.get(exercise.exerciseId);
          return exerciseId ? { ...exercise, exerciseId, routineId: newRoutineId } : null;
        })
        .filter((exercise): exercise is RoutineExercise & { routineId: number } => exercise !== null);

      if (exercises.length > 0) await db.routineExercises.bulkAdd(exercises);
      result.routinesImported += 1;
    }
  }

  if (selection.plans) {
    for (const plan of bundle.plans ?? []) {
      const newPlanId = (await db.trainingPlans.add({
        name: plan.name,
        startDate: new Date(plan.startDate),
        createdAt: new Date(plan.createdAt),
      })) as number;

      planIdMap.set(plan.id, newPlanId);

      const exercises = plan.exercises
        .map((exercise) => {
          const exerciseId = exerciseMap.get(exercise.exerciseId);
          return exerciseId ? { ...exercise, exerciseId, planId: newPlanId } : null;
        })
        .filter((exercise): exercise is PlanExercise & { planId: number } => exercise !== null);

      if (exercises.length > 0) await db.planExercises.bulkAdd(exercises);
      result.plansImported += 1;
    }
  }

  if (selection.workouts) {
    for (const workout of bundle.workouts ?? []) {
      const newWorkoutId = (await db.workouts.add({
        date: new Date(workout.date),
        name: workout.name,
        durationSeconds: workout.durationSeconds,
      })) as number;

      const sets = workout.sets
        .map((set) => {
          const exerciseId = exerciseMap.get(set.exerciseId);
          return exerciseId
            ? { ...set, exerciseId, workoutId: newWorkoutId, date: new Date(set.date) }
            : null;
        })
        .filter((set): set is WorkoutSet & { workoutId: number } => set !== null);

      if (sets.length > 0) await db.sets.bulkAdd(sets);
      result.workoutsImported += 1;
      result.setsImported += sets.length;
    }
  }

  if (selection.agenda) {
    for (const session of bundle.agenda ?? []) {
      const routineId = session.originalRoutineId ? routineIdMap.get(session.originalRoutineId) : undefined;
      const planId = session.originalPlanId ? planIdMap.get(session.originalPlanId) : undefined;

      // El turno agendaba una rutina o un plan que no se importó junto: sin ese dato no
      // hay nada válido a lo que apuntar, así que se omite en vez de dejarlo colgado.
      if ((session.originalRoutineId && !routineId) || (session.originalPlanId && !planId)) {
        result.agendaSkipped += 1;
        continue;
      }

      await db.scheduledSessions.add({
        dayOfWeek: session.dayOfWeek,
        time: session.time,
        notes: session.notes,
        routineId,
        planId,
        createdAt: new Date(),
      });
      result.agendaImported += 1;
    }
  }

  return result;
}
