import React, { useState, useEffect } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { RestTimer } from './RestTimer';
import { BusyMachineModal } from './BusyMachineModal';
import { Timer, Check, Lightbulb, History, MoreHorizontal, ChevronUp, Plus, Search } from 'lucide-react';
import { CreateExerciseModal } from './CreateExerciseModal';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { cn } from '../../../lib/utils';

export const ActiveWorkout: React.FC = () => {
  const {
    activeWorkoutStartTime,
    activeExercises,
    exercises,
    routines,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    toggleSetComplete,
    finishWorkout,
    updateSet,
    cancelWorkout,
    addActiveExercise
  } = useGymStore();

  const [isQueueOpen, setIsQueueOpen] = useState(false);

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
    const interval = setInterval(() => {
      const start = new Date(activeWorkoutStartTime).getTime();
      const now = new Date().getTime();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkoutStartTime]);

  if (!activeWorkoutStartTime) return null;

  const currentIdx = currentExerciseIndex || 0;
  const currentSessionExercise = activeExercises[currentIdx];
  const currentExerciseData = exercises.find(e => e.id === currentSessionExercise?.exerciseId);
  // Optional: activeSession might not have a routine ID stored, we just show a default title
  const title = activeExercises.length > 0 ? 'Entrenamiento Activo' : 'Entrenamiento Activo';

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetClick = (setIndex: number) => {
    if ('vibrate' in navigator) navigator.vibrate(40);
    toggleSetComplete(currentIdx, setIndex);
  };

  const openSetEditor = (setIndex: number) => {
    const set = currentSessionExercise?.sets[setIndex];
    if (set) {
      setEditWeight(set.weight);
      setEditReps(set.reps);
      setEditingSet({ exerciseIndex: currentIdx, setIndex });
    }
  };

  const handleSaveSet = () => {
    if (editingSet) {
      updateSet(editingSet.exerciseIndex, editingSet.setIndex, 'weight', editWeight);
      updateSet(editingSet.exerciseIndex, editingSet.setIndex, 'reps', editReps);
      setEditingSet(null);
    }
  };

  const nextExercise = activeExercises[currentIdx + 1];
  const nextExerciseData = nextExercise ? exercises.find(e => e.id === nextExercise.exerciseId) : null;

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
      <main className="flex-1 px-4 py-4 flex flex-col gap-4 overflow-y-auto pb-32">
        {currentSessionExercise ? (
          <article className="bg-[#171717] border border-neutral-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">

            {/* Exercise GIF / Image */}
            <div className="w-full h-[200px] bg-neutral-950 relative border-b border-neutral-800">
              {currentExerciseData?.gifUrl ? (
                <img
                  src={currentExerciseData.gifUrl}
                  alt={currentExerciseData.name}
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
                <h2 className="text-xl font-bold text-white">{currentExerciseData?.name || currentSessionExercise.name}</h2>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-xs font-medium">
                        {currentExerciseData?.muscleGroup || currentSessionExercise.muscleGroup}
                    </span>
                    {/* Fit Note Badge */}
                    {(currentExerciseData?.fitNotes) ? (
                    <div className="inline-flex items-center gap-1.5 bg-[#45290f] border border-[#784614] text-[#fcd34d] px-3 py-1 rounded-full text-xs font-medium">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{currentExerciseData?.fitNotes}</span>
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
                {currentSessionExercise?.sets.map((set, setIdx) => {
                  const isCompleted = set.completed;
                  const isNextPending = !isCompleted && (setIdx === 0 || currentSessionExercise.sets[setIdx - 1]?.completed);

                  return (
                    <div key={setIdx} className="relative group">
                        <button
                        onClick={() => handleSetClick(setIdx)}
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
                  onClick={() => setBusyMachineProps({
                    isOpen: true,
                    exerciseIndex: currentIdx,
                    currentExerciseName: currentSessionExercise.name,
                    muscleGroup: currentSessionExercise.muscleGroup
                  })}
                  className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center active:scale-95 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </article>
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

        <div className="px-4 pb-8 mt-4 text-center">
             <button onClick={cancelWorkout} className="text-xs text-red-500/50 hover:text-red-500 underline">
                Cancelar entrenamiento
             </button>
        </div>

        {/* Rest Timer Widget */}
        <RestTimer />
      </main>

      {/* 3. BOTTOM SHEET OVERLAY (Queue Drawer) */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4">
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className="w-full bg-[#171717] border-t border-x border-neutral-800 rounded-t-3xl px-5 py-4 flex items-center justify-between shadow-2xl active:bg-neutral-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ChevronUp className={`w-5 h-5 text-neutral-400 transition-transform ${isQueueOpen ? 'rotate-180' : ''}`} />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
                EJERCICIO {currentIdx + 1} DE {activeExercises.length}
              </span>
              <span className="text-xs text-white font-medium truncate max-w-[150px]">
                {nextExerciseData ? `Siguiente: ${nextExerciseData.name}` : 'Último ejercicio'}
              </span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-1.5 overflow-hidden max-w-[80px]">
            {activeExercises.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full shrink-0 ${
                  idx === currentIdx ? 'bg-lime-400' : idx < currentIdx ? 'bg-lime-900' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </button>

        {/* Expanded Queue Drawer */}
        {isQueueOpen && (
          <div className="bg-[#171717] border-x border-neutral-800 px-4 pb-6 max-h-[50vh] overflow-y-auto flex flex-col gap-2">
            {activeExercises.map((item, idx) => {
              const exData = exercises.find(e => e.id === item.exerciseId);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentExerciseIndex(idx);
                    setIsQueueOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer ${
                    idx === currentIdx ? 'bg-lime-400/10 border border-lime-400/40 text-lime-400' : 'bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <span className="text-sm font-medium">{exData?.name || item.name}</span>
                  <span className="text-xs font-mono opacity-60">{item.sets.filter(s => s.completed).length}/{item.sets.length} series</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
