import { create } from 'zustand';
import { db } from '../lib/db';
import type { EquipmentType, PlanExercise, ScheduledSession, TrainingPlan } from '../types';

export interface PlanExercisePayload {
  exerciseId: number;
  equipmentType: EquipmentType;
  initialWeight: number;
  incrementOverride?: number;
}

export interface SchedulePayload {
  date: Date;
  time: string;
  routineId?: number;
  planId?: number;
  weekIndex?: number;
  notes?: string;
}

interface AgendaState {
  sessions: ScheduledSession[];
  plans: TrainingPlan[];
  planExercisesByPlan: Record<number, PlanExercise[]>;

  getSessions: () => Promise<void>;
  createSession: (payload: SchedulePayload) => Promise<void>;
  updateSession: (id: number, payload: SchedulePayload) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;

  getPlans: () => Promise<void>;
  getPlanExercises: (planId: number) => Promise<PlanExercise[]>;
  createPlan: (name: string, startDate: Date, exercises: PlanExercisePayload[]) => Promise<number | null>;
  updatePlan: (id: number, name: string, startDate: Date, exercises: PlanExercisePayload[]) => Promise<void>;
  deletePlan: (id: number) => Promise<void>;
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  sessions: [],
  plans: [],
  planExercisesByPlan: {},

  getSessions: async () => {
    try {
      const sessions = await db.scheduledSessions.orderBy('date').toArray();
      set({ sessions });
    } catch (err) {
      console.error('No se pudieron leer los turnos agendados', err);
    }
  },

  createSession: async (payload) => {
    try {
      await db.scheduledSessions.add({ ...payload, createdAt: new Date() });
      await get().getSessions();
    } catch (err) {
      console.error('No se pudo agendar el turno', err);
    }
  },

  updateSession: async (id, payload) => {
    try {
      await db.scheduledSessions.update(id, payload);
      await get().getSessions();
    } catch (err) {
      console.error('No se pudo actualizar el turno', err);
    }
  },

  deleteSession: async (id) => {
    try {
      await db.scheduledSessions.delete(id);
      await get().getSessions();
    } catch (err) {
      console.error('No se pudo eliminar el turno', err);
    }
  },

  getPlans: async () => {
    try {
      const plans = await db.trainingPlans.orderBy('startDate').toArray();
      set({ plans });
    } catch (err) {
      console.error('No se pudieron leer los planes de entrenamiento', err);
    }
  },

  getPlanExercises: async (planId) => {
    try {
      const exercises = await db.planExercises.where('planId').equals(planId).sortBy('order');
      set((state) => ({ planExercisesByPlan: { ...state.planExercisesByPlan, [planId]: exercises } }));
      return exercises;
    } catch (err) {
      console.error('No se pudieron leer los ejercicios del plan', err);
      return [];
    }
  },

  createPlan: async (name, startDate, exercises) => {
    try {
      let planId: number | null = null;

      await db.transaction('rw', db.trainingPlans, db.planExercises, async () => {
        const id = (await db.trainingPlans.add({ name, startDate, createdAt: new Date() })) as number;
        planId = id;

        await db.planExercises.bulkAdd(
          exercises.map((exercise, index) => ({
            planId: id,
            exerciseId: exercise.exerciseId,
            order: index,
            equipmentType: exercise.equipmentType,
            initialWeight: exercise.initialWeight,
            incrementOverride: exercise.incrementOverride,
          }))
        );
      });

      await get().getPlans();
      return planId;
    } catch (err) {
      console.error('No se pudo crear el plan de entrenamiento', err);
      return null;
    }
  },

  updatePlan: async (id, name, startDate, exercises) => {
    try {
      await db.transaction('rw', db.trainingPlans, db.planExercises, async () => {
        await db.trainingPlans.update(id, { name, startDate });
        await db.planExercises.where('planId').equals(id).delete();

        await db.planExercises.bulkAdd(
          exercises.map((exercise, index) => ({
            planId: id,
            exerciseId: exercise.exerciseId,
            order: index,
            equipmentType: exercise.equipmentType,
            initialWeight: exercise.initialWeight,
            incrementOverride: exercise.incrementOverride,
          }))
        );
      });

      await get().getPlans();
      await get().getPlanExercises(id);
    } catch (err) {
      console.error('No se pudo actualizar el plan de entrenamiento', err);
    }
  },

  deletePlan: async (id) => {
    try {
      await db.transaction('rw', db.trainingPlans, db.planExercises, db.scheduledSessions, async () => {
        await db.trainingPlans.delete(id);
        await db.planExercises.where('planId').equals(id).delete();
        await db.scheduledSessions.where('planId').equals(id).delete();
      });

      set((state) => {
        const next = { ...state.planExercisesByPlan };
        delete next[id];
        return { planExercisesByPlan: next };
      });

      await get().getPlans();
      await get().getSessions();
    } catch (err) {
      console.error('No se pudo eliminar el plan de entrenamiento', err);
    }
  },
}));
