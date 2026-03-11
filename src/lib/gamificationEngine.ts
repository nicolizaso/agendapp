import { useMemo } from 'react';
import type { Task, Category, RewardClaim, HabitClaim } from '../types';

export interface CategoryBalance {
  category: Category;
  earned: number;
  spent: number;
  available: number;
}

export function useTicketWallet(tasks: Task[], rewardClaims: RewardClaim[], habitClaims: HabitClaim[], categories: Category[]): CategoryBalance[] {
  return useMemo(() => {
    const earned: Record<string, number> = {};
    const spent: Record<string, number> = {};

    // Para tareas:
    tasks.forEach(task => {
      if (task.status === 'COMPLETED') {
        const tickets = task.tickets ?? 1;
        if (tickets > 0) {
          const catId = task.category || 'otros';
          earned[catId] = (earned[catId] || 0) + tickets;
        }
      }
    });

    // Para hábitos (habitClaims):
    habitClaims.forEach(claim => {
      if (claim.earnedTickets) {
        claim.earnedTickets.forEach(ticket => {
          earned[ticket.categoryId] = (earned[ticket.categoryId] || 0) + ticket.amount;
        });
      }
    });

    // Para premios (rewardClaims):
    rewardClaims.forEach(claim => {
      if (claim.costs) {
        claim.costs.forEach(cost => {
          spent[cost.categoryId] = (spent[cost.categoryId] || 0) + cost.amount;
        });
      }
    });

    return categories.map(category => {
      // 1. Calculate Earned Tickets for this category
      const catEarned = earned[category.id] || 0;

      // 2. Calculate Spent Tickets for this category
      const catSpent = spent[category.id] || 0;

      // 3. Calculate Available
      const available = Math.max(0, catEarned - catSpent);

      return {
        category,
        earned: catEarned,
        spent: catSpent,
        available
      };
    });
  }, [tasks, rewardClaims, habitClaims, categories]);
}
