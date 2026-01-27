import { create } from 'zustand';
import { db } from '../lib/db';
import type { Habit } from '../types';
import { format } from 'date-fns';

interface HabitsState {
  habits: Habit[];
  todayLogs: Set<number>;
  isLoading: boolean;

  fetchHabits: () => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id'>) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  toggleHabit: (habitId: number) => Promise<void>;
}

export const useHabits = create<HabitsState>((set, get) => ({
  habits: [],
  todayLogs: new Set(),
  isLoading: true,

  fetchHabits: async () => {
    const habits = await db.habits.toArray();
    const today = format(new Date(), 'yyyy-MM-dd');
    const logs = await db.habitLogs.where('date').equals(today).toArray();
    const todayLogs = new Set(logs.map(log => log.habitId));
    set({ habits, todayLogs, isLoading: false });
  },

  createHabit: async (habitData) => {
    const id = await db.habits.add(habitData);
    const newHabit = { ...habitData, id };
    set(state => ({ habits: [...state.habits, newHabit] }));
  },

  deleteHabit: async (id) => {
    await db.transaction('rw', db.habits, db.habitLogs, async () => {
        await db.habits.delete(id);
        await db.habitLogs.where('habitId').equals(id).delete();
    });
    set(state => ({
        habits: state.habits.filter(h => h.id !== id),
        todayLogs: new Set([...state.todayLogs].filter(logId => logId !== id))
    }));
  },

  toggleHabit: async (habitId) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const state = get();
    const isCompleted = state.todayLogs.has(habitId);

    // Optimistic Update
    const newLogs = new Set(state.todayLogs);
    if (isCompleted) {
        newLogs.delete(habitId);
    } else {
        newLogs.add(habitId);
    }
    set({ todayLogs: newLogs });

    try {
        if (isCompleted) {
            // Find the log and delete it
            const logs = await db.habitLogs
                .where('[habitId+date]')
                .equals([habitId, today])
                .toArray();

            if (logs.length > 0 && logs[0].id) {
                await db.habitLogs.delete(logs[0].id);
            }
        } else {
            await db.habitLogs.add({ habitId, date: today });
        }
    } catch (error) {
        // Revert on error
        console.error("Failed to toggle habit", error);
        set({ todayLogs: state.todayLogs });
    }
  }
}));
