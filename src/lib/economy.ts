import type { Effort } from '../types';

export const EFFORT_MULTIPLIERS: Record<Effort, number> = {
  'LOW': 1.0,
  'MEDIUM': 1.5,
  'HIGH': 2.5,
};

export function calculateGoldReward(durationMinutes: number, effort: Effort): number {
  const blocks = Math.ceil(durationMinutes / 15);
  const baseReward = blocks * 10;
  const multiplier = EFFORT_MULTIPLIERS[effort];

  return Math.round(baseReward * multiplier);
}

export function calculateXpReward(goldReward: number): number {
  return goldReward * 10;
}

export function calculateLevel(xp: number): number {
  return 1 + Math.floor(xp / 1000);
}
