import Dexie, { type Table } from 'dexie';
import { weekdayLabel } from './weekdays';
import type {
  ActiveWorkoutDraft,
  Exercise,
  PlanDay,
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
  planDays!: Table<PlanDay>;
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

    // Los planes suman fecha de fin: marca cuándo el plan se da por terminado.
    // Los planes existentes quedan sin ella hasta que se completen al editarlos.
    this.version(4).stores({
      exercises: '++id, apiId, name, muscleGroup, equipment',
      workouts: '++id, date, name, durationSeconds',
      sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
      routines: '++id, name, created_at',
      routineExercises: '++id, routineId, exerciseId, order',
      activeWorkoutDraft: '++id, workoutId',
      scheduledSessions: '++id, dayOfWeek, routineId, planId',
      trainingPlans: '++id, name, startDate, endDate',
      planExercises: '++id, planId, exerciseId, order',
    });

    // El plan deja de tener su propia lista de ejercicios: pasa a usar siempre la de una
    // rutina (routineId), en el mismo orden. Los planes viejos no apuntaban a ninguna
    // rutina, así que a cada uno se le crea una rutina nueva con los ejercicios que ya
    // tenía cargados, para no perder nada.
    this.version(5)
      .stores({
        exercises: '++id, apiId, name, muscleGroup, equipment',
        workouts: '++id, date, name, durationSeconds',
        sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
        routines: '++id, name, created_at',
        routineExercises: '++id, routineId, exerciseId, order',
        activeWorkoutDraft: '++id, workoutId',
        scheduledSessions: '++id, dayOfWeek, routineId, planId',
        trainingPlans: '++id, name, routineId, startDate, endDate',
        planExercises: '++id, planId, exerciseId',
      })
      .upgrade(async (tx) => {
        const plans = await tx.table('trainingPlans').toArray();

        for (const plan of plans) {
          const planExercises = await tx
            .table('planExercises')
            .where('planId')
            .equals(plan.id)
            .sortBy('order');

          const routineId = await tx.table('routines').add({
            name: `${plan.name} (rutina)`,
            created_at: new Date(),
          });

          if (planExercises.length > 0) {
            await tx.table('routineExercises').bulkAdd(
              planExercises.map((exercise, index) => ({
                routineId,
                exerciseId: exercise.exerciseId,
                order: index,
                targetSets: 4,
                targetReps: '8-12',
                targetWeight: String(exercise.initialWeight),
              }))
            );
          }

          await tx.table('trainingPlans').update(plan.id, { routineId });
        }

        await tx
          .table('planExercises')
          .toCollection()
          .modify((exercise) => {
            delete exercise.order;
          });
      });

    // El plan pasa a poder tener varios "días" (Día A/B/C), cada uno con su propia rutina
    // y progresión, en vez de una única rutina por plan. Cada plan existente (1 rutina) se
    // convierte en un plan con un solo día, que hereda su rutina y sus ejercicios; los
    // turnos agendados que ya apuntaban a ese plan pasan a apuntar también a ese día.
    this.version(6)
      .stores({
        exercises: '++id, apiId, name, muscleGroup, equipment',
        workouts: '++id, date, name, durationSeconds',
        sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
        routines: '++id, name, created_at',
        routineExercises: '++id, routineId, exerciseId, order',
        activeWorkoutDraft: '++id, workoutId',
        scheduledSessions: '++id, dayOfWeek, routineId, planId, planDayId',
        trainingPlans: '++id, name, startDate, endDate',
        planDays: '++id, planId, routineId, order',
        planExercises: '++id, planDayId, exerciseId',
      })
      .upgrade(async (tx) => {
        const plans = await tx.table('trainingPlans').toArray();

        for (const plan of plans) {
          if (typeof plan.routineId !== 'number') continue;

          const planDayId = await tx.table('planDays').add({
            planId: plan.id,
            routineId: plan.routineId,
            label: 'Día único',
            order: 0,
          });

          // `planId` deja de estar indexado en el esquema nuevo de `planExercises` (pasa a
          // `planDayId`), así que se recorre la tabla entera en vez de usar `.where()`.
          await tx
            .table('planExercises')
            .toCollection()
            .filter((exercise) => exercise.planId === plan.id)
            .modify((exercise) => {
              exercise.planDayId = planDayId;
              delete exercise.planId;
            });

          await tx
            .table('scheduledSessions')
            .where('planId')
            .equals(plan.id)
            .modify((session) => {
              session.planDayId = planDayId;
            });
        }

        await tx
          .table('trainingPlans')
          .toCollection()
          .modify((plan) => {
            delete plan.routineId;
          });
      });

    // Cada día del plan pasa a ser un día de la semana concreto (con su horario) en vez de
    // una etiqueta libre tipo "Día A": con eso el plan arma su propia agenda sin que haya
    // que agendar los turnos a mano. A los días que ya existían se les toma el día y la
    // hora del turno que ya los agendaba; si no tenían ninguno, se reparten a partir del
    // lunes. Cada día del plan queda con exactamente un turno agendado.
    this.version(7)
      .stores({
        exercises: '++id, apiId, name, muscleGroup, equipment',
        workouts: '++id, date, name, durationSeconds',
        sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
        routines: '++id, name, created_at',
        routineExercises: '++id, routineId, exerciseId, order',
        activeWorkoutDraft: '++id, workoutId',
        scheduledSessions: '++id, dayOfWeek, routineId, planId, planDayId',
        trainingPlans: '++id, name, startDate, endDate',
        planDays: '++id, planId, routineId, order, dayOfWeek',
        planExercises: '++id, planDayId, exerciseId',
      })
      .upgrade(async (tx) => {
        const planDays = await tx.table('planDays').toArray();
        const sessions = await tx.table('scheduledSessions').toArray();

        // Orden de reparto para los días que no tenían turno: lunes, martes, ...
        const FALLBACK_ORDER = [1, 2, 3, 4, 5, 6, 0];
        const usedByPlan = new Map<number, Set<number>>();

        for (const day of planDays) {
          const daySessions = sessions.filter((session) => session.planDayId === day.id);
          const used = usedByPlan.get(day.planId) ?? new Set<number>();

          const fromSession = daySessions[0];
          const dayOfWeek =
            fromSession?.dayOfWeek ??
            FALLBACK_ORDER.find((candidate) => !used.has(candidate)) ??
            1;
          const time = fromSession?.time ?? '18:00';

          used.add(dayOfWeek);
          usedByPlan.set(day.planId, used);

          await tx.table('planDays').update(day.id, { dayOfWeek, time, label: weekdayLabel(dayOfWeek) });

          // Un solo turno por día del plan: los repetidos se descartan y, si no había
          // ninguno, se crea el que corresponde para que el plan quede agendado.
          for (const extra of daySessions.slice(1)) {
            await tx.table('scheduledSessions').delete(extra.id);
          }

          if (daySessions.length === 0) {
            await tx.table('scheduledSessions').add({
              dayOfWeek,
              time,
              planId: day.planId,
              planDayId: day.id,
              createdAt: new Date(),
            });
          }
        }
      });

    // Cada entrenamiento recuerda de qué día del plan salió y qué semana de progresión se
    // entrenó: con eso el plan sabe qué sesiones ya se hicieron y cuáles quedaron pendientes.
    // Las sesiones anteriores quedan sin plan (no hay forma de saber a cuál pertenecían).
    this.version(8).stores({
      exercises: '++id, apiId, name, muscleGroup, equipment',
      workouts: '++id, date, name, durationSeconds, planId, planDayId, [planDayId+weekIndex]',
      sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
      routines: '++id, name, created_at',
      routineExercises: '++id, routineId, exerciseId, order',
      activeWorkoutDraft: '++id, workoutId',
      scheduledSessions: '++id, dayOfWeek, routineId, planId, planDayId',
      trainingPlans: '++id, name, startDate, endDate',
      planDays: '++id, planId, routineId, order, dayOfWeek',
      planExercises: '++id, planDayId, exerciseId',
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
