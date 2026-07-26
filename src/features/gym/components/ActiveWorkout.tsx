import { useState, useEffect } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { ExerciseCard } from './ExerciseCard';
import { RestTimer } from './RestTimer';
import { Button } from '../../../components/Button';
import { Search, Plus } from 'lucide-react';
import { CreateExerciseModal } from './CreateExerciseModal';
import { BusyMachineModal } from './BusyMachineModal';

export function ActiveWorkout() {
  const {
    activeWorkoutStartTime,
    finishWorkout,
    activeExercises,
    exercises,
    addActiveExercise,
    cancelWorkout
  } = useGymStore();

  const [duration, setDuration] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [busyMachineProps, setBusyMachineProps] = useState<{ isOpen: boolean, exerciseIndex: number, currentExerciseName: string, muscleGroup: string } | null>(null);

  // Global Timer
  useEffect(() => {
    if (!activeWorkoutStartTime) return;
    const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - activeWorkoutStartTime.getTime()) / 1000);
        setDuration(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkoutStartTime]);

  useEffect(() => {
    const handleOpenBusyMachineModal = (e: Event) => {
        const customEvent = e as CustomEvent;
        setBusyMachineProps({
            isOpen: true,
            exerciseIndex: customEvent.detail.exerciseIndex,
            currentExerciseName: customEvent.detail.currentExerciseName,
            muscleGroup: customEvent.detail.muscleGroup
        });
    };

    window.addEventListener('open-busy-machine-modal', handleOpenBusyMachineModal);
    return () => window.removeEventListener('open-busy-machine-modal', handleOpenBusyMachineModal);
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-32"> {/* Space for RestTimer */}
        {/* Header */}
        <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 p-4 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Tiempo</span>
                <span className="text-2xl font-bold font-heading text-white tabular-nums">
                    {formatDuration(duration)}
                </span>
            </div>
            <Button onClick={finishWorkout} variant="primary" className="bg-lime-600 hover:bg-lime-700 text-white font-bold">
                Finalizar
            </Button>
        </div>

        {/* Exercises List */}
        <div className="p-4 space-y-4">
            {activeExercises.map((_, index) => (
                <ExerciseCard key={index} exerciseIndex={index} />
            ))}

            {/* Add Exercise UI */}
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

        <div className="px-4 pb-8 text-center">
             <button onClick={cancelWorkout} className="text-xs text-red-500/50 hover:text-red-500 underline">
                Cancelar entrenamiento
             </button>
        </div>

        <RestTimer />
        <CreateExerciseModal
            isOpen={isCreateExerciseOpen}
            onClose={() => setIsCreateExerciseOpen(false)}
            onExerciseCreated={(ex) => {
                addActiveExercise(ex);
                setIsAdding(false);
            }}
        />

        {busyMachineProps && (
            <BusyMachineModal
                isOpen={busyMachineProps.isOpen}
                onClose={() => setBusyMachineProps(null)}
                exerciseIndex={busyMachineProps.exerciseIndex}
                currentExerciseName={busyMachineProps.currentExerciseName}
                muscleGroup={busyMachineProps.muscleGroup}
            />
        )}
    </div>
  );
}
