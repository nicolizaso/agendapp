import Dexie, { type Table } from 'dexie';
import type {
  ActiveWorkoutDraft,
  Task, Reward, RewardClaim, UserStats, Habit, HabitLog,
  HabitClaim, DailyNote, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, Category, Location
} from '../types';

/**
 * Base local de Carga (IndexedDB vía Dexie).
 *
 * Las tablas `tasks`, `rewards`, `habits`, ... provienen de la agenda anterior.
 * Ya no se usan, pero se mantienen declaradas a propósito: eliminarlas de la
 * versión del esquema borraría los datos históricos de quien ya tenía la app
 * instalada.
 */
export class CargaDB extends Dexie {
  // Entrenamiento
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  sets!: Table<WorkoutSet>;
  routines!: Table<Routine>;
  routineExercises!: Table<RoutineExercise>;
  activeWorkoutDraft!: Table<ActiveWorkoutDraft>;

  // Heredadas (sin uso en la app actual)
  tasks!: Table<Task>;
  rewards!: Table<Reward>;
  rewardClaims!: Table<RewardClaim>;
  userStats!: Table<UserStats>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  habitClaims!: Table<HabitClaim>;
  dailyNotes!: Table<DailyNote>;
  categories!: Table<Category>;
  locations!: Table<Location>;

  constructor() {
    super('VectorLifeDB');

    this.version(23).stores({
      activeWorkoutDraft: '++id, workoutId',
      tasks: 'id, category, scheduledDate, status, recurringGroupId',
      categories: 'id, label, icon, color, bg, border, ring',
      locations: 'id, name',
      rewards: 'id',
      rewardClaims: 'id, categoryId',
      habits: 'id, categoryId',
      habitLogs: 'id, habitId, date',
      habitClaims: 'id',
      dailyNotes: 'date, content',
      exercises: '++id, apiId, name, muscleGroup, equipment',
      workouts: '++id, date, name, durationSeconds',
      sets: '++id, workoutId, exerciseId, [exerciseId+date]',
      routines: '++id, name, created_at',
      routineExercises: '++id, routineId, exerciseId, order',
      userStats: '++id'
    });

    // v24: índice por workout+ejercicio para resolver "lo que hiciste la vez
    // pasada" sin recorrer toda la tabla de series.
    this.version(24).stores({
      sets: '++id, workoutId, exerciseId, [exerciseId+date], [workoutId+exerciseId]',
    });
  }
}

export const db = new CargaDB();

export const resetDatabase = async () => {
  await db.delete();
  window.location.reload();
};

db.open().catch((err) => {
  console.error('No se pudo abrir la base de datos local:', err);
});
