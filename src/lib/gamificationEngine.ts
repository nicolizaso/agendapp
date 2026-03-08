import { useMemo } from 'react';
import { isSameWeek } from 'date-fns';
import type { Task, Category, RewardClaim } from '../types';

export interface CategoryBalance {
  category: Category;
  earned: number;
  spent: number;
  available: number;
}

export function useTicketWallet(tasks: Task[], rewardClaims: RewardClaim[], categories: Category[]): CategoryBalance[] {
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

    return categories.map(category => {
      // 1. Calculate Earned Tickets for this category
      const earned = currentWeekTasks.reduce((total, task) => {
        const catId = task.category || 'otros';
        if (catId === category.id) {
          return total + (task.tickets ?? 1);
        }
        return total;
      }, 0);

      // 2. Calculate Spent Tickets for this category
      const spent = currentWeekClaims.reduce((total, claim) => {
        if (claim.categoryId === category.id) {
          return total + claim.cost;
        }
        return total;
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
  }, [tasks, rewardClaims, categories]);
}
