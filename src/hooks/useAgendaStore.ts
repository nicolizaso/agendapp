import { create } from 'zustand';
import { db } from '../lib/db';
import type { EquipmentType, PlanDay, PlanExercise, ScheduledSession, TrainingPlan } from '../types';

export interface PlanExercisePayload {
  exerciseId: number;
  equipmentType: EquipmentType;
  initialWeight: number;
  incrementOverride?: number;
}

/** Un día del plan tal como lo edita el formulario: `id` sólo está presente si ya
 *  existía (permite conservar su identidad al guardar, para no romper los turnos de
 *  agenda que ya lo referencian). */
export interface PlanDayPayload {
  id?: number;
  label: string;
  routineId: number;
  exercises: PlanExercisePayload[];
}

export interface SchedulePayload {
  dayOfWeek: number;
  time: string;
  routineId?: number;
  planId?: number;
  planDayId?: number;
  notes?: string;
}

interface AgendaState {
  sessions: ScheduledSession[];
  plans: TrainingPlan[];
  /** Días de todos los planes, planos: alcanza para armar la agenda y las cards de plan sin ida y vuelta. */
  planDays: PlanDay[];
  planExercisesByPlanDay: Record<number, PlanExercise[]>;

  getSessions: () => Promise<void>;
  createSession: (payload: SchedulePayload) => Promise<void>;
  updateSession: (id: number, payload: SchedulePayload) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;

  getPlans: () => Promise<void>;
  getPlanDays: (planId: number) => Promise<PlanDay[]>;
  getPlanExercises: (planDayId: number) => Promise<PlanExercise[]>;
  createPlan: (
    name: string,
    startDate: Date,
    endDate: Date,
    days: PlanDayPayload[]
  ) => Promise<number | null>;
  updatePlan: (id: number, name: string, startDate: Date, endDate: Date, days: PlanDayPayload[]) => Promise<void>;
  deletePlan: (id: number) => Promise<void>;
}

async function deletePlanDayCascade(planDayId: number): Promise<void> {
  await db.planExercises.where('planDayId').equals(planDayId).delete();
  await db.scheduledSessions.where('planDayId').equals(planDayId).delete();
  await db.planDays.delete(planDayId);
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  sessions: [],
  plans: [],
  planDays: [],
  planExercisesByPlanDay: {},

  getSessions: async () => {
    try {
      const sessions = await db.scheduledSessions.orderBy('dayOfWeek').toArray();
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
      const [plans, planDays] = await Promise.all([
        db.trainingPlans.orderBy('startDate').toArray(),
        db.planDays.orderBy('order').toArray(),
      ]);
      set({ plans, planDays });
    } catch (err) {
      console.error('No se pudieron leer los planes de entrenamiento', err);
    }
  },

  getPlanDays: async (planId) => {
    try {
      const days = await db.planDays.where('planId').equals(planId).sortBy('order');
      set((state) => ({ planDays: [...state.planDays.filter((day) => day.planId !== planId), ...days] }));
      return days;
    } catch (err) {
      console.error('No se pudieron leer los días del plan', err);
      return [];
    }
  },

  getPlanExercises: async (planDayId) => {
    try {
      const exercises = await db.planExercises.where('planDayId').equals(planDayId).toArray();
      set((state) => ({
        planExercisesByPlanDay: { ...state.planExercisesByPlanDay, [planDayId]: exercises },
      }));
      return exercises;
    } catch (err) {
      console.error('No se pudieron leer los ejercicios del día', err);
      return [];
    }
  },

  createPlan: async (name, startDate, endDate, days) => {
    try {
      let planId: number | null = null;

      await db.transaction('rw', db.trainingPlans, db.planDays, db.planExercises, async () => {
        const id = (await db.trainingPlans.add({ name, startDate, endDate, createdAt: new Date() })) as number;
        planId = id;

        for (const [index, day] of days.entries()) {
          const planDayId = (await db.planDays.add({
            planId: id,
            routineId: day.routineId,
            label: day.label,
            order: index,
          })) as number;

          await db.planExercises.bulkAdd(
            day.exercises.map((exercise) => ({
              planDayId,
              exerciseId: exercise.exerciseId,
              equipmentType: exercise.equipmentType,
              initialWeight: exercise.initialWeight,
              incrementOverride: exercise.incrementOverride,
            }))
          );
        }
      });

      await get().getPlans();
      return planId;
    } catch (err) {
      console.error('No se pudo crear el plan de entrenamiento', err);
      return null;
    }
  },

  // Los días que ya existían (traen `id`) se actualizan en el lugar, así los turnos de
  // agenda que los referencian por `planDayId` siguen siendo válidos. Los que se sacaron
  // del formulario se borran en cascada (con sus turnos agendados); los nuevos se crean.
  updatePlan: async (id, name, startDate, endDate, days) => {
    try {
      await db.transaction(
        'rw',
        db.trainingPlans,
        db.planDays,
        db.planExercises,
        db.scheduledSessions,
        async () => {
          await db.trainingPlans.update(id, { name, startDate, endDate });

          const existingDays = await db.planDays.where('planId').equals(id).toArray();
          const keptIds = new Set(days.map((day) => day.id).filter((dayId): dayId is number => typeof dayId === 'number'));

          for (const existingDay of existingDays) {
            if (typeof existingDay.id === 'number' && !keptIds.has(existingDay.id)) {
              await deletePlanDayCascade(existingDay.id);
            }
          }

          for (const [index, day] of days.entries()) {
            const planDayId =
              day.id ??
              ((await db.planDays.add({ planId: id, routineId: day.routineId, label: day.label, order: index })) as number);

            if (day.id) {
              await db.planDays.update(day.id, { routineId: day.routineId, label: day.label, order: index });
            }

            await db.planExercises.where('planDayId').equals(planDayId).delete();
            await db.planExercises.bulkAdd(
              day.exercises.map((exercise) => ({
                planDayId,
                exerciseId: exercise.exerciseId,
                equipmentType: exercise.equipmentType,
                initialWeight: exercise.initialWeight,
                incrementOverride: exercise.incrementOverride,
              }))
            );
          }
        }
      );

      await get().getPlans();
    } catch (err) {
      console.error('No se pudo actualizar el plan de entrenamiento', err);
    }
  },

  deletePlan: async (id) => {
    try {
      await db.transaction('rw', db.trainingPlans, db.planDays, db.planExercises, db.scheduledSessions, async () => {
        const planDays = await db.planDays.where('planId').equals(id).toArray();
        for (const day of planDays) {
          if (typeof day.id === 'number') await deletePlanDayCascade(day.id);
        }
        await db.trainingPlans.delete(id);
      });

      set((state) => ({
        planDays: state.planDays.filter((day) => day.planId !== id),
      }));

      await get().getPlans();
      await get().getSessions();
    } catch (err) {
      console.error('No se pudo eliminar el plan de entrenamiento', err);
    }
  },
}));
