/* Modelo de dominio de Carga. */

export interface Exercise {
  id?: number;
  apiId?: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  /** Notas de puesta a punto de la máquina: "asiento en 3", "agarre ancho"... */
  fitNotes?: string;
  gifUrl?: string;
  instructions?: string[];
  /** true para los ejercicios creados por la persona usuaria. */
  isCustom?: boolean;
}

export interface Workout {
  id?: number;
  date: Date;
  name: string;
  durationSeconds: number;
}

export interface WorkoutSet {
  id?: number;
  workoutId: number;
  exerciseId: number;
  weight: number;
  reps: number;
  rpe?: number;
  date: Date;
}

export interface Routine {
  id?: number;
  name: string;
  created_at: Date;
}

export interface RoutineExercise {
  id?: number;
  routineId: number;
  exerciseId: number;
  order: number;
  targetSets: number;
  targetReps: string;
  targetWeight?: string;
}

export interface ActiveSetInput {
  weight: string;
  reps: string;
  completed: boolean;
  /** id de la fila persistida en `db.sets`; permite deshacer una serie. */
  logId?: number;
}

export interface ActiveExerciseData {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  sets: ActiveSetInput[];
  /** Referencia de la sesión anterior, para saber con cuánto venías. */
  previous?: { weight: number; reps: number }[];
}

export interface ActiveWorkoutDraft {
  id?: number;
  workoutId: number;
  name: string;
  startTime: Date;
  activeExercises: ActiveExerciseData[];
  currentExerciseIndex: number;
  restTimerTarget: number | null;
  restTimerDuration: number;
}

export interface WorkoutSummary {
  name: string;
  durationSeconds: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  exerciseCount: number;
}
