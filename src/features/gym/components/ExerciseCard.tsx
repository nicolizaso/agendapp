import { useState, useEffect } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { Trash2, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { WorkoutSet } from '../../../types';

interface ExerciseCardProps {
  exerciseIndex: number;
}

export function ExerciseCard({ exerciseIndex }: ExerciseCardProps) {
  const {
      activeExercises,
      updateSet,
      toggleSetComplete,
      addSet,
      removeSet,
      getHistory,
      calculate1RM
  } = useGymStore();

  const exercise = activeExercises[exerciseIndex];
  const [lastHistory, setLastHistory] = useState<WorkoutSet[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    getHistory(exercise.exerciseId).then(setLastHistory);
  }, [exercise.exerciseId, getHistory]);

  // "Ghost" info: Best/Last set from history
  const ghostText = lastHistory.length > 0
    ? `Última vez: ${lastHistory[0].weight}kg x ${lastHistory[0].reps}`
    : 'Primer registro';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between bg-neutral-800/50 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
            <h3 className="text-lg font-bold text-white font-heading">{exercise.name}</h3>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded">{exercise.muscleGroup}</span>
                <span>{ghostText}</span>
            </div>
        </div>
        <Button variant="ghost" size="icon" className="text-neutral-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-2">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 mb-2 px-2 text-xs font-bold text-neutral-500 text-center uppercase tracking-wider">
                <span className="w-6 text-left">#</span>
                <span>KG</span>
                <span>Reps</span>
                <span>1RM</span>
                <span className="w-10"></span>
            </div>

            <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => {
                    const oneRM = calculate1RM(parseFloat(set.weight) || 0, parseFloat(set.reps) || 0);

                    return (
                        <div
                            key={setIndex}
                            className={cn(
                                "grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center p-2 rounded-lg transition-colors",
                                set.completed ? "bg-green-900/10 border border-green-900/30" : "bg-neutral-950/50"
                            )}
                        >
                            <span className="w-6 text-sm font-bold text-neutral-500 text-left pl-1">
                                {setIndex + 1}
                            </span>

                            <div className="relative flex items-center bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden focus-within:border-lime-500">
                                <button
                                    onClick={() => updateSet(exerciseIndex, setIndex, 'weight', String(Math.max(0, (parseFloat(set.weight) || 0) - 2.5)))}
                                    disabled={set.completed}
                                    className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50 text-xl hover:bg-neutral-800"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={set.weight}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                    disabled={set.completed}
                                    className="w-full bg-transparent py-3 text-center text-lg font-bold text-white focus:outline-none disabled:opacity-50"
                                    inputMode="decimal"
                                />
                                <button
                                    onClick={() => updateSet(exerciseIndex, setIndex, 'weight', String((parseFloat(set.weight) || 0) + 2.5))}
                                    disabled={set.completed}
                                    className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50 text-xl hover:bg-neutral-800"
                                >
                                    +
                                </button>
                            </div>

                            <div className="relative flex items-center bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden focus-within:border-lime-500">
                                <button
                                    onClick={() => updateSet(exerciseIndex, setIndex, 'reps', String(Math.max(0, (parseFloat(set.reps) || 0) - 1)))}
                                    disabled={set.completed}
                                    className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50 text-xl hover:bg-neutral-800"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={set.reps}
                                    onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                    disabled={set.completed}
                                    className="w-full bg-transparent py-3 text-center text-lg font-bold text-white focus:outline-none disabled:opacity-50"
                                    inputMode="numeric"
                                />
                                <button
                                    onClick={() => updateSet(exerciseIndex, setIndex, 'reps', String((parseFloat(set.reps) || 0) + 1))}
                                    disabled={set.completed}
                                    className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-50 text-xl hover:bg-neutral-800"
                                >
                                    +
                                </button>
                            </div>

                            <span className="text-center text-sm font-bold text-neutral-600">
                                {oneRM > 0 ? oneRM : '-'}
                            </span>

                            <button
                                onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
                                    set.completed
                                        ? "bg-lime-500 text-neutral-950 shadow-[0_0_15px_rgba(132,204,22,0.4)]"
                                        : "bg-neutral-800 border-2 border-neutral-700 text-neutral-600 hover:border-neutral-500"
                                )}
                            >
                                <Check size={24} strokeWidth={3} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex gap-2">
                <Button
                    variant="ghost"
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-4 h-auto"
                    onClick={() => addSet(exerciseIndex)}
                >
                    <Plus size={16} className="mr-2" /> Agregar Serie
                </Button>
                {exercise.sets.length > 0 && (
                    <Button
                        variant="ghost"
                        className="bg-red-900/10 hover:bg-red-900/20 text-red-500 w-14 h-auto"
                         onClick={() => removeSet(exerciseIndex, exercise.sets.length - 1)}
                    >
                        <Trash2 size={20} />
                    </Button>
                )}
            </div>

            <div className="mt-4 border-t border-neutral-800 pt-3">
                <Button
                    variant="outline"
                    className="w-full text-neutral-400 hover:text-white min-h-[44px]"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-busy-machine-modal', {
                            detail: { exerciseIndex, currentExerciseName: exercise.name, muscleGroup: exercise.muscleGroup }
                        }));
                    }}
                >
                    Máquina Ocupada
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
