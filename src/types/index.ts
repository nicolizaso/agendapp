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

/** Cómo se carga el peso en el aparato: define de a cuánto se puede subir. */
export type EquipmentType = 'Mancuerna' | 'Barra' | 'Máquina' | 'Polea' | 'Peso Corporal' | 'Otro';

/** Sesión agendada: un día y horario para ir a entrenar. */
export interface ScheduledSession {
  id?: number;
  /** Fecha del turno, a las 00:00 (la hora vive aparte, en `time`). */
  date: Date;
  /** "HH:MM", 24 horas. */
  time: string;
  /** Se agenda una rutina fija o una semana de un plan de entrenamiento (uno de los dos). */
  routineId?: number;
  planId?: number;
  weekIndex?: number;
  notes?: string;
  createdAt: Date;
}

/** Plan de entrenamiento: progresión de peso semana a semana para un grupo de ejercicios. */
export interface TrainingPlan {
  id?: number;
  name: string;
  startDate: Date;
  createdAt: Date;
}

export interface PlanExercise {
  id?: number;
  planId: number;
  exerciseId: number;
  order: number;
  equipmentType: EquipmentType;
  /** Peso inicial de la semana 0, en kg. */
  initialWeight: number;
  /** Si se define, reemplaza el incremento por defecto del tipo de equipamiento. */
  incrementOverride?: number;
}

/** Objetivo calculado de un ejercicio del plan para una semana puntual. */
export interface PlanWeekTarget {
  weekIndex: number;
  sets: number;
  reps: number;
  weight: number;
  /** true en la primera semana de cada bloque de 3, cuando el peso subió respecto del bloque anterior. */
  isWeightIncrease: boolean;
}
