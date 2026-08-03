import React, { useState, useEffect } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { RestTimer } from './RestTimer';
import { BusyMachineModal } from './BusyMachineModal';
import { Timer, Plus, Search } from 'lucide-react';
import { CreateExerciseModal } from './CreateExerciseModal';
import { ExerciseCard } from './ExerciseCard';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';


export const ActiveWorkout: React.FC = () => {
  const {
    activeWorkoutStartTime,
    activeExercises,
    exercises,
    setCurrentExerciseIndex,
    toggleSetComplete,
    finishWorkout,
    updateSet,

    addActiveExercise
  } = useGymStore();

  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const [busyMachineProps, setBusyMachineProps] = useState<{ isOpen: boolean, exerciseIndex: number, currentExerciseName: string, muscleGroup: string } | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isAdding, setIsAdding] = useState(false);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Set Editing Modal
  const [editingSet, setEditingSet] = useState<{ exerciseIndex: number, setIndex: number } | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  // General Timer
  useEffect(() => {
    if (!activeWorkoutStartTime) return;

    const calculateTime = () => {
      const start = new Date(activeWorkoutStartTime).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    // Add visibility and focus listeners to recalculate immediately
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        calculateTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', calculateTime);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', calculateTime);
    };
  }, [activeWorkoutStartTime]);


  if (!activeWorkoutStartTime) return null;

        // Optional: activeSession might not have a routine ID stored, we just show a default title
  const title = activeExercises.length > 0 ? 'Entrenamiento Activo' : 'Entrenamiento Activo';

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const handleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    if ('vibrate' in navigator) navigator.vibrate(40);
    toggleSetComplete(exerciseIndex, setIndex).then(() => {
        // We need to check state after it was just toggled
        // But since state updates are asynchronous, we can inspect the draft or current state manually
        // We know we just toggled it. Let's look at the current activeExercises.
        const ex = useGymStore.getState().activeExercises[exerciseIndex];
        // If all sets are completed, auto advance.
        const allCompleted = ex.sets.every(s => s.completed);
        if (allCompleted && exerciseIndex + 1 < useGymStore.getState().activeExercises.length) {
             setExpandedIndex(exerciseIndex + 1);
        }
    });
  };



  const handleSaveSet = () => {
    if (editingSet) {
      updateSet(editingSet.exerciseIndex, editingSet.setIndex, 'weight', editWeight);
      updateSet(editingSet.exerciseIndex, editingSet.setIndex, 'reps', editReps);
      setEditingSet(null);
    }
  };


  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0A0A0A] text-neutral-100 min-h-screen flex flex-col justify-between relative overflow-hidden font-sans">

      {/* 1. FIXED TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-neutral-800 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lime-400 font-mono text-sm">
          <Timer className="w-4 h-4" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>

        <h1 className="text-sm font-semibold text-neutral-200 truncate max-w-[180px]">
          {title}
        </h1>

        <button
          onClick={() => finishWorkout()}
          className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-800/40 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
        >
          Finalizar
        </button>
      </header>

      {/* 2. MAIN CANVAS AREA */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3 pb-28">
            {activeExercises.length > 0 ? (
                activeExercises.map((exercise, index) => (
                    <ExerciseCard
                        key={index}
                        exerciseIndex={index}
                        isExpanded={expandedIndex === index}
                        onExpand={() => setExpandedIndex(index)}
                        onSetCompleted={(setIndex) => handleSetCompleted(index, setIndex)}
                        openSetEditor={(setIndex) => {
                            const set = exercise.sets[setIndex];
                            if (set) {
                                setEditWeight(set.weight);
                                setEditReps(set.reps);
                                setEditingSet({ exerciseIndex: index, setIndex });
                            }
                        }}
                    />
                ))
            ) : (
                <div className="text-center p-8 bg-[#171717] border border-neutral-800 rounded-3xl text-neutral-500">
                    Añade ejercicios a tu rutina.
                </div>
            )}

            {/* Add Exercise UI */}
            <div className="mt-4">
                {!isAdding ? (
                    <Button
                        variant="outline"
                        className="w-full py-6 border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 hover:bg-neutral-900"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-5 h-5 mr-2" /> Agregar Ejercicio
                    </Button>
                ) : (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar ejercicio..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-lime-500 focus:outline-none"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-[46px] w-[46px]" onClick={() => setIsCreateExerciseOpen(true)}>
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {filteredExercises.map(ex => (
                                <button
                                    key={ex.id}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 transition-colors text-left"
                                    onClick={() => {
                                        addActiveExercise(ex);
                                        setIsAdding(false);
                                        setSearch('');
                                        if (activeExercises.length === 0) {
                                            setCurrentExerciseIndex(0);
                                        }
                                    }}
                                >
                                    <span className="text-white font-medium">{ex.name}</span>
                                    <span className="text-xs text-neutral-500 bg-neutral-950 px-2 py-1 rounded">{ex.muscleGroup}</span>
                                </button>
                            ))}
                            {filteredExercises.length === 0 && (
                                <p className="text-center text-neutral-500 py-4 text-sm">No se encontraron ejercicios</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full mt-2 text-red-500 hover:bg-red-950/30"
                            onClick={() => setIsAdding(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                )}
            </div>

            {/* Rest Timer Widget */}
            <RestTimer />
        </div>
      </main>


      {busyMachineProps && (
        <BusyMachineModal
            isOpen={busyMachineProps.isOpen}
            onClose={() => setBusyMachineProps(null)}
            exerciseIndex={busyMachineProps.exerciseIndex}
            currentExerciseName={busyMachineProps.currentExerciseName}
            muscleGroup={busyMachineProps.muscleGroup}
        />
      )}
      <CreateExerciseModal
        isOpen={isCreateExerciseOpen}
        onClose={() => setIsCreateExerciseOpen(false)}
        onExerciseCreated={(ex) => {
            addActiveExercise(ex);
            setIsAdding(false);
            if (activeExercises.length === 0) {
                setCurrentExerciseIndex(0);
            }
        }}
       />

       {/* Set Editor Modal */}
       <Modal isOpen={editingSet !== null} onClose={() => setEditingSet(null)} title="Editar Serie" size="sm">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-neutral-400 mb-1">Peso (kg)</label>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-lime-500 transition-colors">
                            <button onClick={() => setEditWeight(String(Math.max(0, (parseFloat(editWeight) || 0) - 2.5)))} className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white bg-neutral-900">-</button>
                            <input
                                type="number"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="w-full bg-transparent text-center text-xl font-bold text-white focus:outline-none"
                                inputMode="decimal"
                            />
                            <button onClick={() => setEditWeight(String((parseFloat(editWeight) || 0) + 2.5))} className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white bg-neutral-900">+</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-400 mb-1">Repeticiones</label>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-lime-500 transition-colors">
                            <button onClick={() => setEditReps(String(Math.max(0, (parseFloat(editReps) || 0) - 1)))} className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white bg-neutral-900">-</button>
                            <input
                                type="number"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                className="w-full bg-transparent text-center text-xl font-bold text-white focus:outline-none"
                                inputMode="numeric"
                            />
                            <button onClick={() => setEditReps(String((parseFloat(editReps) || 0) + 1))} className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white bg-neutral-900">+</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setEditingSet(null)} className="flex-1">Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveSet} className="flex-1 bg-lime-500 hover:bg-lime-600 text-neutral-950">Guardar</Button>
                </div>
            </div>
       </Modal>
    </div>
  );
};
