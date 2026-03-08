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
    this.version(1).stores({
      tasks: '++id, status',
      rewards: '++id',
      userStats: '++id'
    });

    this.version(2).stores({
      tasks: '++id, scheduledDate, status, recurrenceId, [status+scheduledDate]'
    });

    this.version(3).stores({
      habits: '++id, title, emoji, color',
      habitLogs: '++id, habitId, date, [habitId+date]'
    });

    this.version(4).stores({
      dailyNotes: 'date, content'
    });

    this.version(5).stores({
      exercises: '++id, name, muscleGroup',
      workouts: '++id, date, name, durationSeconds',
      sets: '++id, workoutId, exerciseId, [exerciseId+date]'
    });

    this.version(6).stores({
      routines: '++id, name, created_at',
      routineExercises: '++id, routineId, exerciseId, order'
    });

    this.version(7).stores({
      categories: 'id, label, icon, color, bg, border, ring'
    });

    this.version(8).stores({
      locations: 'id, name'
    });

    this.version(9).stores({
      rewards: null // Drop old table
    });

    this.version(10).stores({
      rewards: 'id, pointsThreshold',
      gamificationSettings: 'id'
    });

    this.version(11).stores({
      rewards: 'id, categoryId, cost',
      rewardClaims: 'id, categoryId',
      gamificationSettings: null // Drop old table
    });

    this.version(12).stores({
      rewards: 'id', // Reestructurado para costs array
      rewardClaims: 'id' // Reestructurado para costs array
    });

    this.version(13).stores({
      habitLogs: 'id, habitId, date',
      habitClaims: 'id'
    });
  }
}

export const db = new VectorLifeDB();

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
