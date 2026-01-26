export type Effort = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  id?: number;
  title: string;
  durationMinutes: number;
  effort: Effort;
  status: TaskStatus;
  goldReward: number;
  createdAt: Date;
  scheduledDate: Date;
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
