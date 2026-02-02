import Dexie, { type Table } from 'dexie';
import type { Task, Reward, UserStats, Habit, HabitLog, DailyNote, Exercise, Workout, WorkoutSet, Routine, RoutineExercise } from '../types';

export class VectorLifeDB extends Dexie {
  tasks!: Table<Task>;
  rewards!: Table<Reward>;
  userStats!: Table<UserStats>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  dailyNotes!: Table<DailyNote>;
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  sets!: Table<WorkoutSet>;
  routines!: Table<Routine>;
  routineExercises!: Table<RoutineExercise>;

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
