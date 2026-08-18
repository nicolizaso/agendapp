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
  /** Se agenda una rutina fija o un día de un plan de entrenamiento (uno de los dos).
   *  `planDayId` es obligatorio cuando se agenda un plan: dice cuál de sus días toca ese
   *  turno. La semana de progresión que corresponde se calcula en el momento a partir de
   *  la fecha real, no se guarda. */
  routineId?: number;
  planId?: number;
  planDayId?: number;
  notes?: string;
  createdAt: Date;
}

/**
 * Plan de entrenamiento: un programa con fecha de inicio y fin, armado con uno o más
 * "días" (`PlanDay`) — por ejemplo Día A / Día B / Día C de un split. El plan en sí no
 * tiene ejercicios ni rutina propia: esas viven en cada `PlanDay`.
 */
export interface TrainingPlan {
  id?: number;
  name: string;
  startDate: Date;
  /** Fecha en la que termina el plan; a partir de ahí se considera finalizado.
   *  Opcional sólo por planes creados antes de que este campo existiera: hay que
   *  completarla para poder seguir editando o agendando turnos con el plan. */
  endDate?: Date;
  createdAt: Date;
}

/**
 * Un día de entrenamiento dentro de un plan: un día de la semana fijo con la rutina que
 * toca entrenar ese día. Usa siempre los ejercicios de `routineId`, en el mismo orden; si
 * la rutina cambia, el día lo refleja al toque. Cada día progresa de forma independiente:
 * su semana se cuenta por cuántas veces ya cayó su día de la semana desde que arrancó el
 * plan, así que si el plan tiene lunes y jueves, cada uno avanza por su cuenta.
 */
export interface PlanDay {
  id?: number;
  planId: number;
  routineId: number;
  /** Día de la semana en que se entrena, 0 = domingo ... 6 = sábado (igual que `Date.getDay()`). */
  dayOfWeek: number;
  /** "HH:MM", 24 horas. */
  time: string;
  /** Nombre visible del día; se deriva del día de la semana ("Lunes"). */
  label: string;
  /** Orden de presentación dentro del plan. */
  order: number;
}

/** Progresión configurada para un ejercicio del día del plan (qué ejercicio es lo define la rutina del día). */
export interface PlanExercise {
  id?: number;
  planDayId: number;
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
