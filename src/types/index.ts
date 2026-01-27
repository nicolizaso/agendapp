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
