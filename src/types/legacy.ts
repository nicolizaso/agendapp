/* ---------------------------------------------------------------------------
   Tipos heredados de la agenda que precedió a Carga.
   La app ya no los usa: sólo existen para que las tablas antiguas de la base
   de datos conserven su tipado y los datos previos no se pierdan.
--------------------------------------------------------------------------- */

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
