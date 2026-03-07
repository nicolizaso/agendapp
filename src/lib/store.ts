import { create } from 'zustand';
import { db } from './db';
import type { Task, Reward, RewardClaim, UserStats, TaskStatus, Effort, Category, Location } from '../types';
import { calculateGoldReward, calculateXpReward, calculateLevel } from './economy';
import { CATEGORIES as DEFAULT_CATEGORIES } from './constants';

interface AppState {
  tasks: Task[];
  rewards: Reward[];
  rewardClaims: RewardClaim[];
  userStats: UserStats;
  categories: Category[];
  locations: Location[];
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
    endTime?: string;
    isAllDay?: boolean;
    recurrenceId?: string;
    recurringGroupId?: string;
    tickets?: number;
  }) => Promise<void>;
  addTasks: (tasksData: {
    title: string;
    durationMinutes?: number;
    effort?: Effort;
    scheduledDate?: Date | null;
    category?: string;
    location?: string;
    notes?: string;
    endTime?: string;
    isAllDay?: boolean;
    recurrenceId?: string;
    recurringGroupId?: string;
    tickets?: number;
  }[]) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  updateRecurringTasks: (recurrenceId: string, updates: Partial<Task>, mode: 'this' | 'future' | 'single' | 'following' | 'all', referenceDate: Date) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  deleteRecurringTasks: (recurrenceId: string, mode: 'this' | 'future' | 'single' | 'following' | 'all', referenceDate: Date) => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
  addReward: (reward: Reward) => Promise<void>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  claimReward: (reward: Reward) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addLocation: (location: Location) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  deleteTasks: (ids: number[]) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  rewards: [],
  rewardClaims: [],
  userStats: { currentGold: 0, currentXp: 0, level: 1 },
  categories: [],
  locations: [],
  isLoading: true,

  init: async () => {
    const statsCount = await db.userStats.count();
    if (statsCount === 0) {
      await db.userStats.add({ currentGold: 0, currentXp: 0, level: 1 });
    }

    const tasks = await db.tasks.toArray();
    let rewards = await db.rewards.toArray();
    let rewardClaims = await db.rewardClaims.toArray();
    const userStatsArray = await db.userStats.toArray();
    const userStats = userStatsArray[0];
    let categories = await db.categories.toArray();
    const locations = await db.locations.toArray();

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

    await db.rewards.clear();
    await db.rewardClaims.clear();
    rewards = await db.rewards.toArray();
    rewardClaims = await db.rewardClaims.toArray();

    set({ tasks, rewards, rewardClaims, userStats, categories, locations, isLoading: false });
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
    await db.transaction('rw', db.tasks, async () => {
      let tasksToUpdate: Task[] = [];

      // Keep support for both 'recurrenceId' and 'recurringGroupId'
      // Find all tasks with same recurringGroupId or recurrenceId
      const allRelatedTasks = await db.tasks
        .filter((t) => t.recurringGroupId === recurrenceId || t.recurrenceId === recurrenceId)
        .toArray();

      if (mode === 'future' || mode === 'following') {
        tasksToUpdate = allRelatedTasks.filter((t) => !!t.scheduledDate && new Date(t.scheduledDate) >= referenceDate);
      } else if (mode === 'all') {
        tasksToUpdate = allRelatedTasks;
      } else if (mode === 'single' || mode === 'this') {
        // Find exactly the one matching the reference date (or closest)
        // Usually single is handled by updateTask directly, but for fallback:
        tasksToUpdate = allRelatedTasks.filter((t) =>
          t.scheduledDate && new Date(t.scheduledDate).getTime() === referenceDate.getTime()
        );
      }

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
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  deleteTasks: async (ids) => {
    await db.tasks.bulkDelete(ids);
    const updatedTasks = await db.tasks.toArray();
    set({ tasks: updatedTasks });
  },

  deleteRecurringTasks: async (recurrenceId, mode, referenceDate) => {
    let tasksToDeleteIds: number[] = [];

    const allRelatedTasks = await db.tasks
      .filter((t) => t.recurringGroupId === recurrenceId || t.recurrenceId === recurrenceId)
      .toArray();

    if (mode === 'future' || mode === 'following') {
      tasksToDeleteIds = allRelatedTasks
        .filter((t) => !!t.scheduledDate && new Date(t.scheduledDate) >= referenceDate)
        .map(t => t.id as number)
        .filter(id => id !== undefined);
    } else if (mode === 'all') {
      tasksToDeleteIds = allRelatedTasks
        .map(t => t.id as number)
        .filter(id => id !== undefined);
    } else if (mode === 'single' || mode === 'this') {
      tasksToDeleteIds = allRelatedTasks
        .filter((t) => t.scheduledDate && new Date(t.scheduledDate).getTime() === referenceDate.getTime())
        .map(t => t.id as number)
        .filter(id => id !== undefined);
    }

    if (tasksToDeleteIds.length > 0) {
      await db.tasks.bulkDelete(tasksToDeleteIds);
    }

    // Refresh
    const allTasks = await db.tasks.toArray();
    set({ tasks: allTasks });
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

  addReward: async (reward) => {
    await db.rewards.add(reward);
    set((state) => ({ rewards: [...state.rewards, reward] }));
  },

  updateReward: async (id, updates) => {
    await db.rewards.update(id, updates);
    set((state) => ({ rewards: state.rewards.map(r => r.id === id ? { ...r, ...updates } : r) }));
  },

  deleteReward: async (id) => {
    await db.rewards.delete(id);
    set((state) => ({ rewards: state.rewards.filter(r => r.id !== id) }));
  },

  claimReward: async (reward) => {
    const claim: RewardClaim = {
      id: crypto.randomUUID(),
      rewardId: reward.id,
      categoryId: reward.categoryId,
      cost: reward.cost,
      claimedAt: new Date().toISOString()
    };
    await db.rewardClaims.add(claim);
    set((state) => ({ rewardClaims: [...state.rewardClaims, claim] }));
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
  },

  addLocation: async (location) => {
    await db.locations.add(location);
    set((state) => ({ locations: [...state.locations, location] }));
  },

  updateLocation: async (id, updates) => {
    await db.locations.update(id, updates);
    set((state) => ({
      locations: state.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  deleteLocation: async (id) => {
    await db.locations.delete(id);
    set((state) => ({ locations: state.locations.filter((l) => l.id !== id) }));
  }
}));
