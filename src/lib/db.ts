import Dexie, { type Table } from 'dexie';
import type { Task, Reward, UserStats, Habit, HabitLog, DailyNote } from '../types';

export class VectorLifeDB extends Dexie {
  tasks!: Table<Task>;
  rewards!: Table<Reward>;
  userStats!: Table<UserStats>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  dailyNotes!: Table<DailyNote>;

  constructor() {
    super('VectorLifeDB');
    this.version(1).stores({
      tasks: '++id, status',
      rewards: '++id',
      userStats: '++id'
    });

    this.version(2).stores({
      tasks: '++id, scheduledDate, status, recurrenceId, [status+scheduledDate]'
    });

    this.version(3).stores({
      habits: '++id, title, emoji, color',
      habitLogs: '++id, habitId, date, [habitId+date]'
    });

    this.version(4).stores({
      dailyNotes: 'date, content'
    });
  }
}

export const db = new VectorLifeDB();
