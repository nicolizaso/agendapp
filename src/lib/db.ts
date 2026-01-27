import Dexie, { type Table } from 'dexie';
import type { Task, Reward, UserStats } from '../types';

export class VectorLifeDB extends Dexie {
  tasks!: Table<Task>;
  rewards!: Table<Reward>;
  userStats!: Table<UserStats>;

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
  }
}

export const db = new VectorLifeDB();
