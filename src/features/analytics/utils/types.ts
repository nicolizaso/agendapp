import type { LucideIcon } from 'lucide-react';

export type AchievementLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'FIRE' | 'PLATINUM';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  level: AchievementLevel;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  category?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}
