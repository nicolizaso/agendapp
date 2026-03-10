import { create } from 'zustand';
import { db } from '../lib/db';
import type { Habit } from '../types';
import { format } from 'date-fns';

interface HabitsState {
  habits: Habit[];
  todayLogs: Set<string>;
  isLoading: boolean;

  fetchHabits: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
}

export const useHabits = create<HabitsState>((set, get) => ({
  habits: [],
  todayLogs: new Set(),
  isLoading: true,

  fetchHabits: async () => {
    try {
      try {
          await db.open();
      } catch (e) {
          console.warn("Esperando auto-sanación de DB en useHabits...");
          return; // Stop if the DB failed, db.ts reload will handle it.
      }

      const habits = await db.habits.toArray();
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await db.habitLogs.where('date').equals(today).toArray();
      const todayLogs = new Set(logs.map(log => log.habitId));
      set({ habits, todayLogs });
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addHabit: async (habit) => {
    try {
      const newHabit = {
        ...habit,
        id: crypto.randomUUID(), // <-- CRÍTICO: Generación de ID explícita requerida por Dexie
        createdAt: new Date().toISOString(),
      };
      await db.habits.add(newHabit as Habit);
      const habits = await db.habits.toArray();
      set({ habits });
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
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
                .where({ habitId, date: today })
                .toArray();

            if (logs.length > 0 && logs[0].id) {
                await db.habitLogs.delete(logs[0].id);
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db.habitLogs.add({ id: `${habitId}_${today}`, habitId, date: today } as any);
        }
    } catch (error) {
        // Revert on error
        console.error("Failed to toggle habit", error);
        set({ todayLogs: state.todayLogs });
    }
  }
}));
