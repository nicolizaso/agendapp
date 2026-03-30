export type Effort = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  id?: string;
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
  endTime?: string; // Formato "HH:mm"
  isAllDay?: boolean;
  recurrenceId?: string;
  recurringGroupId?: string;
  tickets?: number;
  floor?: string;
  apartment?: string;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  costs: { categoryId: string; amount: number }[];
  icon?: string;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  costs: { categoryId: string; amount: number }[];
  claimedAt: string;
}

export interface UserStats {
  id?: number;
  currentGold: number;
  currentXp: number;
  level: number;
}

export interface Habit {
  id?: string;
  title: string;
  emoji: string;
  color: string;
  categoryId: string;
}

export interface HabitLog {
  id: string; // ${habitId}_${date}
  habitId: string;
  date: string; // ISO Date YYYY-MM-DD
}

export interface HabitClaim {
  id: string; // week_YYYY-MM-DD (Monday)
  weekStartDate: string;
  claimedAt: string;
  earnedTickets: { categoryId: string; amount: number }[];
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

export interface Location {
  id: string;
  name: string;
  address: string;
  floor?: string;
  apt?: string;
  notes?: string;
}
