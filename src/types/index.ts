export type Effort = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  id?: number;
  title: string;
  durationMinutes?: number;
  effort?: Effort;
  status: TaskStatus;
  goldReward: number;
  createdAt: Date;
  scheduledDate: Date | null;
  category?: string;
  location?: string;
  notes?: string;
  isAllDay?: boolean;
  recurrenceId?: string;
}

export interface Reward {
  id?: number;
  title: string;
  cost: number;
  icon: string;
}

export interface UserStats {
  id?: number;
  currentGold: number;
  currentXp: number;
  level: number;
}

export interface Habit {
  id?: number;
  title: string;
  emoji: string;
  color: string;
}

export interface HabitLog {
  id?: number;
  habitId: number;
  date: string; // ISO Date YYYY-MM-DD
}

export interface DailyNote {
  date: string; // YYYY-MM-DD (PK)
  content: string;
}

export interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
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
  date: Date; // For efficient indexing [exerciseId+date]
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
  targetReps: string; // string to pre-fill inputs directly
  targetWeight?: string; // string to pre-fill inputs directly
}

export interface Category {
  id: string; // e.g. "trabajo"
  label: string; // e.g. "Trabajo"
  icon: string; // e.g. "Briefcase"
  color: string;
  bg: string;
  border: string;
  ring: string;
}
