import { useMemo } from 'react';
import { isSameWeek } from 'date-fns';
import type { Task, Category, RewardClaim, HabitClaim } from '../types';

export interface CategoryBalance {
  category: Category;
  earned: number;
  spent: number;
  available: number;
}

export function useTicketWallet(tasks: Task[], rewardClaims: RewardClaim[], habitClaims: HabitClaim[], categories: Category[]): CategoryBalance[] {
  return useMemo(() => {
    const currentWeekTasks = tasks.filter(task =>
      task.status === 'COMPLETED' &&
      task.scheduledDate &&
      isSameWeek(new Date(task.scheduledDate), new Date(), { weekStartsOn: 1 })
    );

    const currentWeekClaims = rewardClaims.filter(claim =>
      claim.claimedAt &&
      isSameWeek(new Date(claim.claimedAt), new Date(), { weekStartsOn: 1 })
    );

    const currentWeekHabitClaims = habitClaims.filter(claim =>
      claim.claimedAt &&
      isSameWeek(new Date(claim.claimedAt), new Date(), { weekStartsOn: 1 })
    );

    return categories.map(category => {
      // 1. Calculate Earned Tickets for this category
      let earned = currentWeekTasks.reduce((total, task) => {
        const catId = task.category || 'otros';
        if (catId === category.id) {
          return total + (task.tickets ?? 1);
        }
        return total;
      }, 0);

      // Add earned tickets from Habit Claims
      earned += currentWeekHabitClaims.reduce((total, claim) => {
        const categoryEarned = claim.earnedTickets?.find(c => c.categoryId === category.id)?.amount || 0;
        return total + categoryEarned;
      }, 0);

      // 2. Calculate Spent Tickets for this category
      const spent = currentWeekClaims.reduce((total, claim) => {
        const categorySpent = claim.costs?.find(c => c.categoryId === category.id)?.amount || 0;
        return total + categorySpent;
      }, 0);

      // 3. Calculate Available
      const available = Math.max(0, earned - spent);

      return {
        category,
        earned,
        spent,
        available
      };
    });
  }, [tasks, rewardClaims, habitClaims, categories]);
}
