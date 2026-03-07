import { useMemo } from 'react';
import type { Task, Category, RewardClaim } from '../types';

export interface CategoryBalance {
  category: Category;
  earned: number;
  spent: number;
  available: number;
}

export function useTicketWallet(tasks: Task[], rewardClaims: RewardClaim[], categories: Category[]): CategoryBalance[] {
  return useMemo(() => {
    return categories.map(category => {
      // 1. Calculate Earned Tickets for this category
      const earned = tasks.reduce((total, task) => {
        const catId = task.category || 'otros';
        if (catId === category.id && task.status === 'COMPLETED') {
          return total + (task.tickets ?? 1);
        }
        return total;
      }, 0);

      // 2. Calculate Spent Tickets for this category
      const spent = rewardClaims.reduce((total, claim) => {
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
