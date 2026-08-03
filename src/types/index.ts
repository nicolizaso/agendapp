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
  endTime?: string;
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
  id: string;
  habitId: string;
  date: string;
}

export interface HabitClaim {
  id: string;
  weekStartDate: string;
  claimedAt: string;
  earnedTickets: { categoryId: string; amount: number }[];
}

export interface DailyNote {
  date: string;
  content: string;
}

export interface Exercise {
  id?: number;
  apiId?: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  fitNotes?: string;
  gifUrl?: string;
  instructions?: string[];
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

export interface Category {
  id: string;
  label: string;
  icon: string;
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
export interface ActiveSetInput {
  weight: string;
  reps: string;
  completed: boolean;
}

export interface ActiveExerciseData {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  sets: ActiveSetInput[];
}

export interface ActiveWorkoutDraft {
  id?: number;
  workoutId: number;
  startTime: Date;
  activeExercises: ActiveExerciseData[];
  restTimerTarget: number | null;
  restTimerDuration: number;
}
