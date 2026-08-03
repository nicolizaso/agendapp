import { useState, useEffect } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { Trash2, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { WorkoutSet } from '../../../types';

interface ExerciseCardProps {
  exerciseIndex: number;
  isExpanded: boolean;
  onExpand: () => void;
  onSetCompleted: (setIndex: number) => void;
  openSetEditor: (setIndex: number) => void;
}

export function ExerciseCard({ exerciseIndex, isExpanded, onExpand, onSetCompleted, openSetEditor }: ExerciseCardProps) {
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

  const { exercises } = useGymStore();
  const exerciseData = exercises.find(e => e.id === exercise.exerciseId);

  useEffect(() => {
    getHistory(exercise.exerciseId).then(setLastHistory);
  }, [exercise.exerciseId, getHistory]);

  // "Ghost" info: Best/Last set from history
  const ghostText = lastHistory.length > 0
    ? `Última vez: ${lastHistory[0].weight}kg x ${lastHistory[0].reps}`
    : 'Primer registro';

  return (
    <article className="bg-[#171717] border border-neutral-800 rounded-3xl overflow-hidden shadow-xl flex flex-col mb-4">
      {isExpanded ? (
        <>
            {/* Exercise GIF / Image */}
            <div className="w-full h-[200px] bg-neutral-950 relative border-b border-neutral-800">
              {exerciseData?.gifUrl ? (
                <img
                  src={exerciseData.gifUrl}
                  alt={exerciseData.name}
                  className="w-full h-full object-cover opacity-80 mix-blend-screen pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                  Sin animación disponible
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent" />
            </div>

            {/* Card Content */}
            <div className="p-4 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{exerciseData?.name || exercise.name}</h2>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-xs font-medium">
                        {exerciseData?.muscleGroup || exercise.muscleGroup}
                    </span>
                    {/* Fit Note Badge */}
                    {(exerciseData?.fitNotes) ? (
                    <div className="inline-flex items-center gap-1.5 bg-[#45290f] border border-[#784614] text-[#fcd34d] px-3 py-1 rounded-full text-xs font-medium">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{exerciseData?.fitNotes}</span>
                    </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 px-3 py-1 rounded-full text-xs font-medium">
                            <span>+ Nota</span>
                        </div>
                    )}
                </div>
              </div>

              {/* Set Grid (2x2 or dynamic) */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                {exercise.sets.map((set, setIdx) => {
                  const isCompleted = set.completed;
                  const isNextPending = !isCompleted && (setIdx === 0 || exercise.sets[setIdx - 1]?.completed);

                  return (
                    <div key={setIdx} className="relative group">
                        <button
                        onClick={() => onSetCompleted(setIdx)}
                        className={`w-full h-16 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 ${
                            isCompleted
                            ? 'bg-lime-400 text-neutral-950 font-bold'
                            : isNextPending
                            ? 'bg-[#1C1C1C] border-2 border-lime-400 text-white shadow-[0_0_12px_rgba(163,230,53,0.2)]'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        }`}
                        >
                        <div className="flex items-center gap-1 text-sm pointer-events-none">
                            <span>Set {setIdx + 1}</span>
                            {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-mono tracking-wider pointer-events-none ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>
                            {set.weight || '0'}kg × {set.reps || '0'}
                        </span>
                        </button>
                        {/* Edit button */}
                        {!isCompleted && (
                             <button
                                onClick={(e) => { e.stopPropagation(); openSetEditor(setIdx); }}
                                className="absolute top-1 right-1 w-6 h-6 bg-neutral-800/80 rounded-full flex items-center justify-center text-neutral-400 active:scale-95"
                             >
                                <MoreHorizontal className="w-3 h-3" />
                             </button>
                        )}
                    </div>
                  );
                })}
              </div>

              {/* Actions inside Card */}
              <div className="flex gap-3 mt-1">
                <button className="flex-1 h-12 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <History className="w-4 h-4" /> Historial
                </button>
                <button
                  onClick={() => {
                     window.dispatchEvent(new CustomEvent('open-busy-machine-modal', {
                            detail: { exerciseIndex, currentExerciseName: exercise.name, muscleGroup: exercise.muscleGroup }
                     }));
                  }}
                  className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center active:scale-95 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
        </>
      ) : (
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-neutral-700"
          onClick={onExpand}
        >
          <div className="flex flex-col gap-1">
             <span className="text-white font-medium">{exerciseData?.name || exercise.name}</span>
             <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[10px] w-fit font-medium">
                 {exerciseData?.muscleGroup || exercise.muscleGroup}
             </span>
          </div>
          <div className="text-xs font-mono text-neutral-400">
             {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} Sets
          </div>
        </div>
      )}
    </article>
  );
}
