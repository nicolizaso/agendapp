import Dexie, { type Table } from 'dexie';
import type {
  ActiveWorkoutDraft,
  Exercise,
  PlanExercise,
  Routine,
  RoutineExercise,
  ScheduledSession,
  TrainingPlan,
  Workout,
  WorkoutSet,
} from '../types';

const LEGACY_DB_NAME = 'VectorLifeDB';

/**
 * Tablas que se conservan al migrar; el resto era de la agenda anterior.
 * El borrador de sesión en curso no se migra a propósito: su formato cambió y
 * las series ya marcadas viven en `sets`, así que no se pierde nada.
 */
const MIGRATED_TABLES = [
  'exercises',
  'workouts',
  'sets',
  'routines',
  'routineExercises',
] as const;

/** Base local de Carga (IndexedDB vía Dexie). Sólo datos de entrenamiento. */
export class CargaDB extends Dexie {
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  sets!: Table<WorkoutSet>;
  routines!: Table<Routine>;
  routineExercises!: Table<RoutineExercise>;
  activeWorkoutDraft!: Table<ActiveWorkoutDraft>;
  scheduledSessions!: Table<ScheduledSession>;
  trainingPlans!: Table<TrainingPlan>;
  planExercises!: Table<PlanExercise>;

  constructor() {
    super('CargaDB');

    this.version(1).stores({
      exercises: '++id, apiId, name, muscleGroup, equipment',
      workouts: '++id, date, name, durationSeconds',
      sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
      routines: '++id, name, created_at',
      routineExercises: '++id, routineId, exerciseId, order',
      activeWorkoutDraft: '++id, workoutId',
    });

    // Agenda de entrenamiento (turnos) y planes de progresión de peso.
    this.version(2).stores({
      exercises: '++id, apiId, name, muscleGroup, equipment',
      workouts: '++id, date, name, durationSeconds',
      sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
      routines: '++id, name, created_at',
      routineExercises: '++id, routineId, exerciseId, order',
      activeWorkoutDraft: '++id, workoutId',
      scheduledSessions: '++id, date, routineId, planId',
      trainingPlans: '++id, name, startDate',
      planExercises: '++id, planId, exerciseId, order',
    });

    // La agenda pasa de turnos con fecha fija a un horario semanal recurrente:
    // día de la semana + hora, sin fecha puntual ni semana de plan guardada.
    this.version(3)
      .stores({
        exercises: '++id, apiId, name, muscleGroup, equipment',
        workouts: '++id, date, name, durationSeconds',
        sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
        routines: '++id, name, created_at',
        routineExercises: '++id, routineId, exerciseId, order',
        activeWorkoutDraft: '++id, workoutId',
        scheduledSessions: '++id, dayOfWeek, routineId, planId',
        trainingPlans: '++id, name, startDate',
        planExercises: '++id, planId, exerciseId, order',
      })
      .upgrade(async (tx) => {
        await tx
          .table('scheduledSessions')
          .toCollection()
          .modify((session) => {
            const previousDate = session.date instanceof Date ? session.date : new Date(session.date);
            session.dayOfWeek = previousDate.getDay();
            delete session.date;
            delete session.weekIndex;
          });
      });
  }
}

export const db = new CargaDB();

/**
 * Migración única desde la base de la agenda que precedió a Carga.
 *
 * Se copia el historial de entrenamiento conservando los ids —las series
 * referencian workouts y ejercicios por id— y recién después se borra la base
 * vieja con todo lo que no era de entrenamiento. Si algo falla, la base
 * original queda intacta y se reintenta en el próximo arranque.
 */
async function migrateFromLegacyDatabase(): Promise<void> {
  // La existencia de la base vieja es la única señal que hace falta: cuando la
  // migración termina, se borra y este chequeo no vuelve a dar positivo.
  if (!(await Dexie.exists(LEGACY_DB_NAME))) return;

  const legacy = new Dexie(LEGACY_DB_NAME);

  try {
    // Sin declarar versión, Dexie abre la base con el esquema que ya tiene.
    await legacy.open();
    const available = new Set(legacy.tables.map((table) => table.name));

    for (const name of MIGRATED_TABLES) {
      if (!available.has(name)) continue;

      const rows = await legacy.table(name).toArray();
      if (rows.length > 0) await db.table(name).bulkPut(rows);
    }

    legacy.close();
    await Dexie.delete(LEGACY_DB_NAME);
  } catch (err) {
    console.error('No se pudo migrar la base anterior; se reintentará más adelante.', err);
    legacy.close();
  }
}

let openPromise: Promise<void> | null = null;

/** Abre la base y ejecuta la migración pendiente una sola vez por sesión. */
export function openDatabase(): Promise<void> {
  openPromise ??= (async () => {
    await db.open();
    await migrateFromLegacyDatabase();
  })().catch((err) => {
    openPromise = null;
    throw err;
  });

  return openPromise;
}
