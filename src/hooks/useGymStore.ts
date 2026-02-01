import { create } from 'zustand';
import Dexie from 'dexie';
import { db, seedDefaultExercises } from '../lib/db';
import type { Exercise, WorkoutSet, Routine } from '../types';

interface ActiveSetInput {
  weight: string; // Keep as string for inputs
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
  // Global State
  isLoading: boolean;
  exercises: Exercise[];
  routines: Routine[];

  // Active Workout State
  isWorkoutActive: boolean;
  activeWorkoutId: number | null;
  activeWorkoutStartTime: Date | null;
  activeExercises: ActiveExerciseData[];

  // Rest Timer State
  restTimerTarget: number | null; // Timestamp when rest ends
  restTimerDuration: number; // Duration in seconds

  // Actions
  init: () => Promise<void>;
  startWorkout: () => Promise<void>;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;

  // Routine Actions
  createRoutine: (name: string, exercises: { exerciseId: number; targetSets: number; targetReps: string; targetWeight?: string }[]) => Promise<void>;
  getRoutines: () => Promise<void>;
  loadRoutineIntoWorkout: (routineId: number) => Promise<void>;

  addExercise: (exercise: Exercise) => void;
  updateSet: (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => Promise<void>;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;

  // Helpers
  getHistory: (exerciseId: number) => Promise<WorkoutSet[]>;
  calculate1RM: (weight: number, reps: number) => number;

  // Timer Actions
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

  init: async () => {
    set({ isLoading: true });
    try {
      await seedDefaultExercises();
      const exercises = await db.exercises.toArray();
      const routines = await db.routines.toArray();

      set({ exercises, routines, isLoading: false });
    } catch (error) {
      console.error('Failed to init gym store', error);
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
            name: routine.name, // Use Routine Name
            durationSeconds: 0,
        });

        const activeExercises: ActiveExerciseData[] = routineExercises.map(rex => {
            const exerciseDef = exercises.find(e => e.id === rex.exerciseId);
            if (!exerciseDef) return null;

            // Generate rows based on targetSets
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
      await db.workouts.update(activeWorkoutId, {
        durationSeconds
      });

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
        // Also delete sets associated?
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

  addExercise: (exercise: Exercise) => {
    const { activeExercises } = get();
    set({
      activeExercises: [
        ...activeExercises,
        {
          exerciseId: exercise.id!,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: [{ weight: '', reps: '', completed: false }] // Start with 1 empty set
        }
      ]
    });
  },

  addSet: (exerciseIndex: number) => {
    const { activeExercises } = get();
    const newExercises = [...activeExercises];
    // Copy previous set values for convenience if exists
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

    // Toggle state locally
    const isCompleting = !setItem.completed;

    const newExercises = [...activeExercises];
    newExercises[exerciseIndex].sets[setIndex].completed = isCompleting;
    set({ activeExercises: newExercises });

    if (isCompleting && activeWorkoutId) {
       // Validate inputs
       const weight = parseFloat(setItem.weight);
       const reps = parseFloat(setItem.reps);

       if (!isNaN(weight) && !isNaN(reps)) {
         try {
           // Save to DB
           await db.sets.add({
             workoutId: activeWorkoutId,
             exerciseId: exercise.exerciseId,
             weight,
             reps,
             date: new Date()
           });

           // Trigger Auto Timer
           startRestTimer(90); // Default 90s
         } catch (err) {
           console.error('Failed to log set', err);
         }
       }
    } else if (!isCompleting) {
        // Optional: Remove from DB if un-checked?
        // For now, simpler to just append logs. Unchecking is visual only in this simple version,
        // or we need to track the `setId` created in DB to delete it.
        // Let's keep it simple: "Checking" saves a record. Unchecking just resets UI state
        // but doesn't delete the record (or we'd need to store the DB ID in the set object).
    }
  },

  getHistory: async (exerciseId: number) => {
    // Get last 5 sets for this exercise, ordered by date desc
    return await db.sets
      .where('[exerciseId+date]')
      .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
      .reverse()
      .limit(5)
      .toArray();
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
