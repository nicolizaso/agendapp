import Dexie, { type Table } from 'dexie';
import type { Task, Reward, RewardClaim, UserStats, Habit, HabitLog, HabitClaim, DailyNote, Exercise, Workout, WorkoutSet, Routine, RoutineExercise, Category, Location } from '../types';

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

  constructor() {
    super('VectorLifeDB');

    // Versión 1: Base original
    this.version(1).stores({
      tasks: 'id, category, scheduledDate, status, recurringGroupId',
      categories: 'id'
    });

    // Versión 15: Esquema Maestro Definitivo
    // Al omitir las versiones intermedias, Dexie calculará el "diff" 
    // automáticamente desde la versión local del usuario hasta esta versión, 
    // creando las tablas e índices faltantes sin destruir datos.
    this.version(15).stores({
      tasks: 'id, category, scheduledDate, status, recurringGroupId',
      categories: 'id, label, icon, color, bg, border, ring',
      locations: 'id, name',
      rewards: 'id',
      rewardClaims: 'id',
      habits: 'id, categoryId',
      habitLogs: 'id, habitId, date',
      habitClaims: 'id',
      dailyNotes: 'date, content',
      exercises: '++id, name, muscleGroup',
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
    await db.delete();
    window.location.reload();
};

export const seedDefaultExercises = async () => {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkAdd([
      { name: 'Banco Plano', muscleGroup: 'Pecho' },
      { name: 'Sentadilla', muscleGroup: 'Piernas' },
      { name: 'Peso Muerto', muscleGroup: 'Espalda/Piernas' },
      { name: 'Dominadas', muscleGroup: 'Espalda' },
      { name: 'Press Militar', muscleGroup: 'Hombros' },
      { name: 'Remo con Barra', muscleGroup: 'Espalda' },
      { name: 'Curl de Bíceps', muscleGroup: 'Bíceps' },
      { name: 'Tríceps en Polea', muscleGroup: 'Tríceps' },
      { name: 'Estocadas', muscleGroup: 'Piernas' },
      { name: 'Elevaciones Laterales', muscleGroup: 'Hombros' },
      { name: 'Fondos en Paralelas', muscleGroup: 'Pecho/Tríceps' },
      { name: 'Prensa de Piernas', muscleGroup: 'Piernas' },
    ]);
  }
};
