import { create } from 'zustand';
import Dexie from 'dexie';
import { db } from '../lib/db';
import { fetchExercises } from '../lib/exerciseApi';
import type { Exercise, WorkoutSet, Routine } from '../types';

interface ActiveSetInput {
  weight: string;
  reps: string;
  completed: boolean;
}

interface ActiveExerciseData {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  sets: ActiveSetInput[];
}

interface GymState {
  isLoading: boolean;
  exercises: Exercise[];
  routines: Routine[];

  isWorkoutActive: boolean;
  activeWorkoutId: number | null;
  activeWorkoutStartTime: Date | null;
  activeExercises: ActiveExerciseData[];

  restTimerTarget: number | null;
  restTimerDuration: number;

  init: () => Promise<void>;
  startWorkout: () => Promise<void>;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;

  createRoutine: (name: string, exercises: { exerciseId: number; targetSets: number; targetReps: string; targetWeight?: string }[]) => Promise<void>;
  updateRoutine: (id: number, name: string, exercises: { exerciseId: number; targetSets: number; targetReps: string; targetWeight?: string }[]) => Promise<void>;
  deleteRoutine: (id: number) => Promise<void>;
  getRoutines: () => Promise<void>;
  loadRoutineIntoWorkout: (routineId: number) => Promise<void>;

  addActiveExercise: (exercise: Exercise) => void;
  swapActiveExercise: (exerciseIndex: number, newExercise: Exercise) => void;
  addExercise: (name: string, muscleGroup: string, equipment?: string, fitNotes?: string, gifUrl?: string, instructions?: string[]) => Promise<Exercise | null>;
  updateExerciseFitNotes: (exerciseId: number, fitNotes: string) => Promise<void>;
  updateSet: (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => Promise<void>;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;

  getHistory: (exerciseId: number) => Promise<WorkoutSet[]>;
  getWorkoutsForMonth: (year: number, month: number) => Promise<number[]>;
  calculate1RM: (weight: number, reps: number) => number;

  startRestTimer: (durationSeconds?: number) => void;
  stopRestTimer: () => void;
}

export const useGymStore = create<GymState>((set, get) => ({
  isLoading: false,
  exercises: [],
  routines: [],

  isWorkoutActive: false,
  activeWorkoutId: null,
  activeWorkoutStartTime: null,
  activeExercises: [],

  restTimerTarget: null,
  restTimerDuration: 90,

  /**
   * Inicialización:
   * 1. Elimina cualquier ejercicio en IndexedDB que no tenga apiId (hardcodeados / creados localmente).
   * 2. Si no hay datos de API almacenados, consulta la API remota.
   * 3. Garantiza que solo los datos provenientes de la API queden en el estado del store.
   */
  init: async () => {
    set({ isLoading: true });
    try {
      try {
        await db.open();
      } catch (e) {
        console.warn("Esperando DB en useGymStore...");
        return;
      }

      // 1. PURGA: Elimina cualquier ejercicio que no provenga de la API (sin apiId)
      const currentExercises = await db.exercises.toArray();
      const nonApiExerciseIds = currentExercises
        .filter((ex) => !ex.apiId)
        .map((ex) => ex.id!)
        .filter(Boolean);

      if (nonApiExerciseIds.length > 0) {
        await db.exercises.bulkDelete(nonApiExerciseIds);
      }

      // 2. CARGA/FETCH: Si no hay ejercicios de la API guardados, consultamos la API remota
      let apiExercises = await db.exercises.toArray();
      
      if (apiExercises.length === 0) {
        const remoteExercises = await fetchExercises();

        if (remoteExercises.length > 0) {
          await db.transaction('rw', db.exercises, async () => {
            // Deduplicación por apiId antes de guardar
            const uniqueMap = new Map<string, Exercise>();
            for (const remote of remoteExercises) {
              if (remote.apiId && !uniqueMap.has(remote.apiId)) {
                uniqueMap.set(remote.apiId, remote);
              }
            }
            await db.exercises.bulkAdd(Array.from(uniqueMap.values()));
          });

          apiExercises = await db.exercises.toArray();
        }
      }

      // 3. FILTRADO ESTRICTO: Solo enviamos al estado los ejercicios que tienen apiId
      const cleanApiExercises = apiExercises.filter((ex) => Boolean(ex.apiId));
      const routines = await db.routines.toArray();

      set({ exercises: cleanApiExercises, routines, isLoading: false });
    } catch (error) {
      console.error('Error al inicializar GymStore:', error);
      set({ isLoading: false });
    }
  },

  startWorkout: async () => {
    const startTime = new Date();
    try {
      const id = await db.workouts.add({
        date: startTime,
        name: 'Entrenamiento Libre',
        durationSeconds: 0,
      });

      set({
        isWorkoutActive: true,
        activeWorkoutId: id as number,
        activeWorkoutStartTime: startTime,
        activeExercises: []
      });
    } catch (err) {
      console.error('Failed to start workout', err);
    }
  },

  createRoutine: async (name, exercises) => {
    try {
      await db.transaction('rw', db.routines, db.routineExercises, async () => {
        const routineId = await db.routines.add({
          name,
          created_at: new Date()
        });

        const routineExercises = exercises.map((ex, index) => ({
          routineId: routineId as number,
          exerciseId: ex.exerciseId,
          order: index,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeight: ex.targetWeight
        }));

        await db.routineExercises.bulkAdd(routineExercises);
      });
      get().getRoutines();
    } catch (err) {
      console.error('Failed to create routine', err);
    }
  },

  updateRoutine: async (id, name, exercises) => {
    try {
      await db.transaction('rw', db.routines, db.routineExercises, async () => {
        await db.routines.update(id, { name });
        await db.routineExercises.where('routineId').equals(id).delete();

        const routineExercises = exercises.map((ex, index) => ({
          routineId: id,
          exerciseId: ex.exerciseId,
          order: index,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeight: ex.targetWeight
        }));

        await db.routineExercises.bulkAdd(routineExercises);
      });
      get().getRoutines();
    } catch (err) {
      console.error('Failed to update routine', err);
    }
  },

  deleteRoutine: async (id) => {
    try {
      await db.transaction('rw', db.routines, db.routineExercises, async () => {
        await db.routines.delete(id);
        await db.routineExercises.where('routineId').equals(id).delete();
      });
      get().getRoutines();
    } catch (err) {
      console.error('Failed to delete routine', err);
    }
  },

  getRoutines: async () => {
    try {
      const routines = await db.routines.toArray();
      set({ routines });
    } catch (err) {
      console.error('Failed to fetch routines', err);
    }
  },

  loadRoutineIntoWorkout: async (routineId) => {
    const { exercises } = get();
    try {
      const routine = await db.routines.get(routineId);
      if (!routine) return;

      const routineExercises = await db.routineExercises
        .where('routineId')
        .equals(routineId)
        .sortBy('order');

      const startTime = new Date();
      const workoutId = await db.workouts.add({
        date: startTime,
        name: routine.name,
        durationSeconds: 0,
      });

      const activeExercises: ActiveExerciseData[] = routineExercises.map(rex => {
        const exerciseDef = exercises.find(e => e.id === rex.exerciseId);
        if (!exerciseDef) return null;

        const sets: ActiveSetInput[] = Array.from({ length: rex.targetSets }).map(() => ({
          weight: rex.targetWeight || '',
          reps: rex.targetReps || '',
          completed: false
        }));

        return {
          exerciseId: rex.exerciseId,
          name: exerciseDef.name,
          muscleGroup: exerciseDef.muscleGroup,
          sets
        };
      }).filter((e): e is ActiveExerciseData => e !== null);

      set({
        isWorkoutActive: true,
        activeWorkoutId: workoutId as number,
        activeWorkoutStartTime: startTime,
        activeExercises
      });

    } catch (err) {
      console.error('Failed to load routine', err);
    }
  },

  finishWorkout: async () => {
    const { activeWorkoutId, activeWorkoutStartTime } = get();
    if (!activeWorkoutId || !activeWorkoutStartTime) return;

    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - activeWorkoutStartTime.getTime()) / 1000);

    try {
      await db.workouts.update(activeWorkoutId, { durationSeconds });

      set({
        isWorkoutActive: false,
        activeWorkoutId: null,
        activeWorkoutStartTime: null,
        activeExercises: [],
        restTimerTarget: null
      });
    } catch (err) {
      console.error('Failed to finish workout', err);
    }
  },

  cancelWorkout: async () => {
    const { activeWorkoutId } = get();
    if (activeWorkoutId) {
      try {
        await db.workouts.delete(activeWorkoutId);
        const setsToDelete = await db.sets.where('workoutId').equals(activeWorkoutId).toArray();
        await db.sets.bulkDelete(setsToDelete.map(s => s.id!));
      } catch (err) {
        console.error('Failed to delete workout', err);
      }
    }
    set({
      isWorkoutActive: false,
      activeWorkoutId: null,
      activeWorkoutStartTime: null,
      activeExercises: [],
      restTimerTarget: null
    });
  },

  addActiveExercise: (exercise: Exercise) => {
    const { activeExercises } = get();
    set({
      activeExercises: [
        ...activeExercises,
        {
          exerciseId: exercise.id!,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: [{ weight: '', reps: '', completed: false }]
        }
      ]
    });
  },

  swapActiveExercise: (exerciseIndex: number, newExercise: Exercise) => {
    const { activeExercises } = get();
    const newExercises = [...activeExercises];
    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      exerciseId: newExercise.id!,
      name: newExercise.name,
      muscleGroup: newExercise.muscleGroup,
    };
    set({ activeExercises: newExercises });
  },

  updateExerciseFitNotes: async (exerciseId: number, fitNotes: string) => {
    try {
      await db.exercises.update(exerciseId, { fitNotes });
      const updatedExercises = await db.exercises.toArray();
      set({ exercises: updatedExercises });
    } catch (err) {
      console.error('Failed to update exercise fitNotes', err);
    }
  },

  addExercise: async (name: string, muscleGroup: string, equipment?: string, fitNotes?: string, gifUrl?: string, instructions?: string[]) => {
    try {
      const { exercises } = get();

      const existing = exercises.find(
        e => e.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existing) {
        return existing;
      }

      const id = await db.exercises.add({
        name: name.trim(),
        muscleGroup,
        equipment,
        fitNotes,
        gifUrl,
        instructions
      });

      const updatedExercises = await db.exercises.toArray();
      set({ exercises: updatedExercises });

      return updatedExercises.find(e => e.id === id) || null;

    } catch (err) {
      console.error('Failed to add exercise', err);
      return null;
    }
  },

  addSet: (exerciseIndex: number) => {
    const { activeExercises } = get();
    const newExercises = [...activeExercises];
    const prevSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];

    newExercises[exerciseIndex].sets.push({
      weight: prevSet ? prevSet.weight : '',
      reps: prevSet ? prevSet.reps : '',
      completed: false
    });
    set({ activeExercises: newExercises });
  },

  removeSet: (exerciseIndex: number, setIndex: number) => {
    const { activeExercises } = get();
    const newExercises = [...activeExercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
    set({ activeExercises: newExercises });
  },

  updateSet: (exerciseIndex, setIndex, field, value) => {
    const { activeExercises } = get();
    const newExercises = [...activeExercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    set({ activeExercises: newExercises });
  },

  toggleSetComplete: async (exerciseIndex, setIndex) => {
    const { activeExercises, activeWorkoutId, startRestTimer } = get();
    const exercise = activeExercises[exerciseIndex];
    const setItem = exercise.sets[setIndex];

    const isCompleting = !setItem.completed;

    const newExercises = [...activeExercises];
    newExercises[exerciseIndex].sets[setIndex].completed = isCompleting;
    set({ activeExercises: newExercises });

    if (isCompleting && activeWorkoutId) {
      const weight = parseFloat(setItem.weight);
      const reps = parseFloat(setItem.reps);

      if (!isNaN(weight) && !isNaN(reps)) {
        try {
          await db.sets.add({
            workoutId: activeWorkoutId,
            exerciseId: exercise.exerciseId,
            weight,
            reps,
            date: new Date()
          });

          startRestTimer(90);
        } catch (err) {
          console.error('Failed to log set', err);
        }
      }
    }
  },

  getHistory: async (exerciseId: number) => {
    return await db.sets
      .where('[exerciseId+date]')
      .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
      .reverse()
      .limit(5)
      .toArray();
  },

  getWorkoutsForMonth: async (year: number, month: number) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const workouts = await db.workouts
      .where('date')
      .between(start, end)
      .toArray();

    return workouts.map(w => w.date.getDate());
  },

  calculate1RM: (weight: number, reps: number) => {
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  },

  startRestTimer: (durationSeconds = 90) => {
    set({
      restTimerDuration: durationSeconds,
      restTimerTarget: Date.now() + durationSeconds * 1000
    });
  },

  stopRestTimer: () => {
    set({ restTimerTarget: null });
  }
}));