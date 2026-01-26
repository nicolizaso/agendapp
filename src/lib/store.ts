import { create } from 'zustand';
import { db } from './db';
import type { Task, Reward, UserStats, Effort, TaskStatus } from '../types';
import { calculateGoldReward, calculateXpReward, calculateLevel } from './economy';

interface AppState {
  tasks: Task[];
  rewards: Reward[];
  userStats: UserStats;
  isLoading: boolean;

  // Actions
  init: () => Promise<void>;
  addTask: (taskData: { title: string; durationMinutes: number; effort: Effort; scheduledDate?: Date }) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
  addReward: (rewardData: { title: string; cost: number; icon: string }) => Promise<void>;
  buyReward: (rewardId: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  rewards: [],
  userStats: { currentGold: 0, currentXp: 0, level: 1 },
  isLoading: true,

  init: async () => {
    const statsCount = await db.userStats.count();
    if (statsCount === 0) {
      await db.userStats.add({ currentGold: 0, currentXp: 0, level: 1 });
    }

    const tasks = await db.tasks.toArray();
    const rewards = await db.rewards.toArray();
    const userStatsArray = await db.userStats.toArray();
    const userStats = userStatsArray[0];

    if (rewards.length === 0) {
      const defaults: Reward[] = [
        { title: 'Coffee Break', cost: 50, icon: 'Coffee' },
        { title: 'Episode of TV', cost: 100, icon: 'Tv' },
        { title: 'Gaming Session', cost: 200, icon: 'Gamepad2' }
      ];
      await db.rewards.bulkAdd(defaults);
      const newRewards = await db.rewards.toArray();
       set({ tasks, rewards: newRewards, userStats, isLoading: false });
    } else {
      set({ tasks, rewards, userStats, isLoading: false });
    }
  },

  addTask: async (taskData) => {
    const goldReward = calculateGoldReward(taskData.durationMinutes, taskData.effort);
    const newTask: Task = {
      ...taskData,
      scheduledDate: taskData.scheduledDate ?? new Date(),
      status: 'PENDING',
      goldReward,
      createdAt: new Date(),
    };

    const id = await db.tasks.add(newTask);
    set((state) => ({ tasks: [...state.tasks, { ...newTask, id } as Task] }));
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  completeTask: async (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);

    if (!task || task.status === 'COMPLETED') return;

    const xpReward = calculateXpReward(task.goldReward);

    const newGold = state.userStats.currentGold + task.goldReward;
    const newXp = state.userStats.currentXp + xpReward;
    const newLevel = calculateLevel(newXp);

    const newStats = { ...state.userStats, currentGold: newGold, currentXp: newXp, level: newLevel };

    const updatedTask = { ...task, status: 'COMPLETED' as TaskStatus };

    await db.transaction('rw', db.tasks, db.userStats, async () => {
      await db.tasks.update(taskId, { status: 'COMPLETED' });
      if (state.userStats.id) {
          await db.userStats.update(state.userStats.id, newStats);
      }
    });

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      userStats: newStats
    }));
  },

  addReward: async (rewardData) => {
    const id = await db.rewards.add(rewardData);
    set((state) => ({ rewards: [...state.rewards, { ...rewardData, id } as Reward] }));
  },

  buyReward: async (rewardId) => {
    const state = get();
    const reward = state.rewards.find((r) => r.id === rewardId);

    if (!reward) return;
    if (state.userStats.currentGold < reward.cost) {
      alert("No tienes suficiente oro!");
      return;
    }

    const newGold = state.userStats.currentGold - reward.cost;
    const newStats = { ...state.userStats, currentGold: newGold };

    if (state.userStats.id) {
        await db.userStats.update(state.userStats.id, newStats);
    }

    set({ userStats: newStats });
  }
}));
