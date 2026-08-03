import Dexie, { type Table } from 'dexie';
import type {
  ActiveWorkoutDraft,
  Task, Reward, RewardClaim, UserStats, Habit, HabitLog,
  HabitClaim, DailyNote, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, Category, Location
} from '../types';

export class VectorLifeDB extends Dexie {
  tasks!: Table<Task>;
  rewards!: Table<Reward>;
  rewardClaims!: Table<RewardClaim>;
  userStats!: Table<UserStats>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  habitClaims!: Table<HabitClaim>;
  dailyNotes!: Table<DailyNote>;
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  sets!: Table<WorkoutSet>;
  routines!: Table<Routine>;
  routineExercises!: Table<RoutineExercise>;
  categories!: Table<Category>;
  locations!: Table<Location>;
  activeWorkoutDraft!: Table<ActiveWorkoutDraft>;

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
  }
}

export const db = new VectorLifeDB();

export const resetDatabase = async () => {
  console.warn("⚠️ Purgando base de datos...");
  await db.delete();
  window.location.reload();
};

db.open().catch((err) => {
  console.error("🔥 Error crítico al abrir la Base de Datos:", err);
});

/**
 * Seed desactivado: No inyectamos ningún ejercicio hardcodeado local.
 */
export const seedDefaultExercises = async () => {
  // Intencionalmente vacío para garantizar que solo existan datos de la API.
};