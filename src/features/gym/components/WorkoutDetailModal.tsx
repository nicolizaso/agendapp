import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { db } from '../../../lib/db';
import type { Workout, WorkoutSet, Exercise } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Dumbbell, Activity } from 'lucide-react';

interface WorkoutDetailModalProps {
  workoutId: number;
  onClose: () => void;
}

export function WorkoutDetailModal({ workoutId, onClose }: WorkoutDetailModalProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<{ exercise: Exercise, sets: WorkoutSet[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const w = await db.workouts.get(workoutId);
        if (w) {
          setWorkout(w);

          const sets = await db.sets.where('workoutId').equals(workoutId).toArray();

          // Group sets by exerciseId
          const grouped: Record<number, WorkoutSet[]> = {};
          sets.forEach(set => {
              if (!grouped[set.exerciseId]) grouped[set.exerciseId] = [];
              grouped[set.exerciseId].push(set);
          });

          const exList = [];
          for (const exId of Object.keys(grouped)) {
              const ex = await db.exercises.get(parseInt(exId));
              if (ex) {
                  exList.push({ exercise: ex, sets: grouped[parseInt(exId)] });
              }
          }
          setExercises(exList);
        }
      } catch (err) {
        console.error("Failed to fetch workout details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [workoutId]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Detalle de Sesión">
      {loading ? (
        <div className="flex justify-center p-8">
            <span className="text-lime-500 font-bold">Cargando...</span>
        </div>
      ) : workout ? (
        <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-white font-heading">{workout.name}</h3>
                <p className="text-sm text-neutral-400 capitalize">
                    {format(workout.date, "EEEE d 'de' MMMM yyyy", { locale: es })}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-neutral-950 p-3 rounded-lg flex flex-col gap-1">
                        <span className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-lime-500" /> Duración
                        </span>
                        <span className="text-lg font-bold text-neutral-200">
                            {Math.round(workout.durationSeconds / 60)} min
                        </span>
                    </div>
                    <div className="bg-neutral-950 p-3 rounded-lg flex flex-col gap-1">
                        <span className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1">
                            <Dumbbell className="w-3 h-3 text-lime-500" /> Ejercicios
                        </span>
                        <span className="text-lg font-bold text-neutral-200">
                            {exercises.length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-neutral-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-lime-500" /> Marcas Alcanzadas
                </h4>

                <div className="space-y-3">
                    {exercises.map((item, idx) => (
                        <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-2">
                                <span className="font-medium text-neutral-200">{item.exercise.name}</span>
                                <span className="text-[10px] bg-neutral-950 px-2 py-1 rounded text-neutral-400">
                                    {item.exercise.muscleGroup}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                <span className="font-bold text-neutral-600">Serie</span>
                                <span className="font-bold text-neutral-600">KG</span>
                                <span className="font-bold text-neutral-600">Reps</span>
                                <span className="font-bold text-neutral-600">1RM</span>

                                {item.sets.map((set, sIdx) => {
                                    const oneRM = Math.round(set.weight * (1 + set.reps / 30));
                                    return (
                                        <div key={sIdx} className="contents text-neutral-300">
                                            <span className="font-medium text-neutral-500">{sIdx + 1}</span>
                                            <span>{set.weight}</span>
                                            <span>{set.reps}</span>
                                            <span className="text-lime-500 font-medium">{oneRM}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      ) : (
          <div className="text-center p-8 text-neutral-500">
              No se encontró la sesión.
          </div>
      )}
    </Modal>
  );
}
