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

/** Sesión agendada: un día de la semana y horario fijos para ir a entrenar, que se repiten cada semana. */
export interface ScheduledSession {
  id?: number;
  /** Día de la semana, 0 = domingo ... 6 = sábado (igual que `Date.getDay()`). */
  dayOfWeek: number;
  /** "HH:MM", 24 horas. */
  time: string;
  /** Se agenda una rutina fija o un plan de entrenamiento (uno de los dos). La semana del plan que toca
   *  se calcula en el momento a partir de la fecha real, no se guarda. */
  routineId?: number;
  planId?: number;
  notes?: string;
  createdAt: Date;
}

/**
 * Plan de entrenamiento: progresión de peso semana a semana sobre los ejercicios de una
 * rutina. El plan no tiene su propia lista de ejercicios: usa siempre la de `routineId`,
 * en el mismo orden. Si la rutina cambia (se agrega, saca o reordena un ejercicio), el
 * plan lo refleja al toque.
 */
export interface TrainingPlan {
  id?: number;
  name: string;
  routineId: number;
  startDate: Date;
  /** Fecha en la que termina el plan; a partir de ahí se considera finalizado.
   *  Opcional sólo por planes creados antes de que este campo existiera: hay que
   *  completarla para poder seguir editando o agendando turnos con el plan. */
  endDate?: Date;
  createdAt: Date;
}

/** Progresión configurada para un ejercicio de la rutina del plan (qué ejercicio es lo define la rutina). */
export interface PlanExercise {
  id?: number;
  planId: number;
  exerciseId: number;
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
