import { create } from 'zustand';
import { db } from './db';
import type { Task, Reward, UserStats, Effort, TaskStatus, Category } from '../types';
import { calculateGoldReward, calculateXpReward, calculateLevel } from './economy';
import { CATEGORIES as DEFAULT_CATEGORIES } from './constants';

interface AppState {
  tasks: Task[];
  rewards: Reward[];
  userStats: UserStats;
  categories: Category[];
  isLoading: boolean;

  // Actions
  init: () => Promise<void>;
  addTask: (taskData: {
    title: string;
    durationMinutes?: number;
    effort?: Effort;
    scheduledDate?: Date | null;
    category?: string;
    location?: string;
    notes?: string;
    isAllDay?: boolean;
    recurrenceId?: string;
  }) => Promise<void>;
  addTasks: (tasksData: {
    title: string;
    durationMinutes?: number;
    effort?: Effort;
    scheduledDate?: Date | null;
    category?: string;
    location?: string;
    notes?: string;
    isAllDay?: boolean;
    recurrenceId?: string;
  }[]) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  updateRecurringTasks: (recurrenceId: string, updates: Partial<Task>, mode: 'this' | 'future', referenceDate: Date) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  deleteRecurringTasks: (recurrenceId: string, mode: 'this' | 'future', referenceDate: Date) => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
  addReward: (rewardData: { title: string; cost: number; icon: string }) => Promise<void>;
  buyReward: (rewardId: number) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  rewards: [],
  userStats: { currentGold: 0, currentXp: 0, level: 1 },
  categories: [],
  isLoading: true,

  init: async () => {
    const statsCount = await db.userStats.count();
    if (statsCount === 0) {
      await db.userStats.add({ currentGold: 0, currentXp: 0, level: 1 });
    }

    const tasks = await db.tasks.toArray();
    let rewards = await db.rewards.toArray();
    const userStatsArray = await db.userStats.toArray();
    const userStats = userStatsArray[0];
    let categories = await db.categories.toArray();

    if (categories.length === 0) {
      const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(cat => ({
        id: cat.id,
        label: cat.label,
        icon: 'Circle', // Fallback, will be populated properly below
        color: cat.color,
        bg: cat.bg,
        border: cat.border,
        ring: cat.ring
      }));

      // A hardcoded map based on what we know is in constants
      const DEFAULT_ICON_NAMES: Record<string, string> = {
        'casa': 'Home',
        'gym': 'Dumbbell',
        'cultivo': 'Sprout',
        'trabajo': 'Briefcase',
        'facultad': 'GraduationCap',
        'salud': 'HeartPulse',
        'amigos': 'Users',
        'familia': 'Heart',
        'cumpleanos': 'Cake',
        'otros': 'MoreHorizontal'
      };

      for (const cat of defaultCategories) {
          cat.icon = DEFAULT_ICON_NAMES[cat.id] || 'Circle';
      }

      await db.categories.bulkAdd(defaultCategories);
      categories = await db.categories.toArray();
    }

    if (rewards.length === 0) {
      const defaults: Reward[] = [
        { title: 'Coffee Break', cost: 50, icon: 'Coffee' },
        { title: 'Episode of TV', cost: 100, icon: 'Tv' },
        { title: 'Gaming Session', cost: 200, icon: 'Gamepad2' }
      ];
      await db.rewards.bulkAdd(defaults);
      rewards = await db.rewards.toArray();
    }

    set({ tasks, rewards, userStats, categories, isLoading: false });
  },

  addTask: async (taskData) => {
    const duration = taskData.durationMinutes ?? 15;
    const effort = taskData.effort ?? 'LOW';
    const goldReward = calculateGoldReward(duration, effort);

    const newTask: Task = {
      ...taskData,
      durationMinutes: duration,
      effort: effort,
      scheduledDate: taskData.scheduledDate === undefined ? new Date() : taskData.scheduledDate,
      status: 'PENDING',
      goldReward,
      createdAt: new Date(),
    };

    const id = await db.tasks.add(newTask);
    set((state) => ({ tasks: [...state.tasks, { ...newTask, id } as Task] }));
  },

  addTasks: async (tasksData) => {
    const newTasks = tasksData.map((taskData) => {
      const duration = taskData.durationMinutes ?? 15;
      const effort = taskData.effort ?? 'LOW';
      const goldReward = calculateGoldReward(duration, effort);

      return {
        ...taskData,
        durationMinutes: duration,
        effort: effort,
        scheduledDate: taskData.scheduledDate === undefined ? new Date() : taskData.scheduledDate,
        status: 'PENDING' as TaskStatus,
        goldReward,
        createdAt: new Date(),
      };
    });

    await db.tasks.bulkAdd(newTasks);

    // Refresh tasks from DB to get IDs and ensure consistency
    const allTasks = await db.tasks.toArray();
    set({ tasks: allTasks });
  },

  updateTask: async (id, updates) => {
    await db.tasks.update(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  updateRecurringTasks: async (recurrenceId, updates, mode, referenceDate) => {
    if (mode === 'future') {
      await db.transaction('rw', db.tasks, async () => {
        const tasksToUpdate = await db.tasks
          .where('recurrenceId')
          .equals(recurrenceId)
          .filter((t) => !!t.scheduledDate && new Date(t.scheduledDate) >= referenceDate)
          .toArray();

        for (const task of tasksToUpdate) {
          const newValues = { ...updates };

          // Special handling for date/time: apply new time to original date
          if (newValues.scheduledDate && task.scheduledDate) {
            const newDate = new Date(newValues.scheduledDate);
            const originalDate = new Date(task.scheduledDate);

            originalDate.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
            newValues.scheduledDate = originalDate;
          }

          if (task.id) {
            await db.tasks.update(task.id, newValues);
          }
        }
      });

      // Refresh from DB to ensure consistency
      const allTasks = await db.tasks.toArray();
      set({ tasks: allTasks });
    }
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  deleteRecurringTasks: async (recurrenceId, mode, referenceDate) => {
    if (mode === 'future') {
      await db.tasks
        .where('recurrenceId')
        .equals(recurrenceId)
        .filter((t) => !!t.scheduledDate && new Date(t.scheduledDate) >= referenceDate)
        .delete();

      // Refresh
      const allTasks = await db.tasks.toArray();
      set({ tasks: allTasks });
    }
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
  },

  addCategory: async (category) => {
    await db.categories.add(category);
    set((state) => ({ categories: [...state.categories, category] }));
  },

  updateCategory: async (id, updates) => {
    await db.categories.update(id, updates);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteCategory: async (id) => {
    await db.categories.delete(id);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
  }
}));
