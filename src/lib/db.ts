import Dexie, { type Table } from 'dexie';
import type {
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

  constructor() {
    super('VectorLifeDB');

    // Esquema Maestro Definitivo (Versión 20 para forzar el upgrade en cualquier cliente local)
    // Se han aplanado todas las versiones anteriores para evitar conflictos de upgrade paths.
    this.version(20).stores({
      tasks: 'id, category, scheduledDate, status, recurringGroupId',
      categories: 'id, label, icon, color, bg, border, ring',
      locations: 'id, name',
      rewards: 'id',
      rewardClaims: 'id, categoryId',
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

// Función de rescate manual/programática
export const resetDatabase = async () => {
    console.warn("⚠️ Purgando base de datos corrupta...");
    await db.delete();
    window.location.reload();
};

// Mecanismo de AUTO-SANACIÓN (Self-Healing)
// Si la base de datos local está corrupta o tiene un conflicto de Clave Primaria, la borra y reinicia.
db.open().catch(async (err) => {
    console.error("🔥 Error crítico al abrir la Base de Datos:", err);
    const isUpgradeError = err.name === 'UpgradeError' || err.name === 'DatabaseClosedError';
    const hasPrimaryKeyConflict = err.message?.toLowerCase().includes('primary key');

    if (isUpgradeError || hasPrimaryKeyConflict) {
        await resetDatabase();
    }
});

// Seed de datos por defecto (Seguro)
export const seedDefaultExercises = async () => {
  try {
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
  } catch (error) {
    console.error("Error al inyectar ejercicios por defecto:", error);
  }
};