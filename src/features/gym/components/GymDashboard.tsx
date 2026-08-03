import { useEffect, useState, useRef } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { Dumbbell, Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { db } from '../../../lib/db';
import type { Routine } from '../../../types';
import { WorkoutDetailModal } from './WorkoutDetailModal';

export function GymDashboard() {
  const { startWorkout, routines, getRoutines, loadRoutineIntoWorkout, getWorkoutsForMonth } = useGymStore();
  const [suggestedRoutine, setSuggestedRoutine] = useState<Routine | null>(null);
  const [trainedDays, setTrainedDays] = useState<number[]>([]);
  const [currentMonth] = useState(new Date());

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getRoutines();
  }, [getRoutines]);

  useEffect(() => {
    if (routines.length > 0) {
      // Pick a random routine for "Entrenamiento a 1 Clic"
      const randomIndex = Math.floor(Math.random() * routines.length);
      setSuggestedRoutine(routines[randomIndex]);
    } else {
      setSuggestedRoutine(null);
    }
  }, [routines]);

  useEffect(() => {
    const fetchTrainedDays = async () => {
      const days = await getWorkoutsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
      setTrainedDays(days);
    };
    fetchTrainedDays();
  }, [currentMonth, getWorkoutsForMonth]);

  const handleStartSuggested = () => {
    if (suggestedRoutine && suggestedRoutine.id) {
      loadRoutineIntoWorkout(suggestedRoutine.id);
    } else {
      startWorkout();
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Adjust for Monday start (0=Monday, 6=Sunday)
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const isTrained = trainedDays.includes(i);
        days.push(
            <div
                key={i}
                onClick={async () => {
                    if (isTrained) {
                        // Find the workout for this day
                        const startOfDay = new Date(year, month, i);
                        const endOfDay = new Date(year, month, i, 23, 59, 59);
                        const workouts = await db.workouts.where('date').between(startOfDay, endOfDay).toArray();
                        if (workouts.length > 0 && workouts[0].id) {
                            setSelectedWorkoutId(workouts[0].id);
                        }
                    }
                }}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${isTrained ? 'bg-lime-500 text-neutral-950 cursor-pointer shadow-[0_0_10px_rgba(132,204,22,0.4)]' : 'text-neutral-500'}`}
            >
                {i}
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-neutral-200 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-lime-500" />
                    Asistencia
                </h3>
                <span className="text-sm font-medium text-neutral-400 capitalize">
                    {currentMonth.toLocaleString('es', { month: 'long', year: 'numeric' })}
                </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-xs font-bold text-neutral-600">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center">
                {days}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">

      {/* Hero Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative">
        <div className="relative z-10">
            <h2 className="text-3xl font-heading font-bold text-white mb-2">Gym Tracker</h2>

            <div className="mt-6 mb-4 relative" ref={dropdownRef}>
                <p className="text-sm text-neutral-400 font-medium uppercase tracking-wider mb-1">Hoy toca:</p>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="group flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <h3 className="text-2xl font-bold text-lime-400 drop-shadow-md">
                        {suggestedRoutine ? suggestedRoutine.name : 'Entrenamiento Libre'}
                    </h3>
                    <ChevronDown className={`w-6 h-6 text-lime-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full z-30 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div
                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800 border-b border-neutral-800 ${!suggestedRoutine ? 'text-lime-400' : 'text-neutral-200'}`}
                            onClick={() => {
                                setSuggestedRoutine(null);
                                setIsDropdownOpen(false);
                            }}
                        >
                            <span className="font-medium">Entrenamiento Libre</span>
                            {!suggestedRoutine && <Check className="w-5 h-5" />}
                        </div>
                        {routines.map((routine) => (
                            <div
                                key={routine.id}
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800 border-b border-neutral-800 last:border-0 ${suggestedRoutine?.id === routine.id ? 'text-lime-400' : 'text-neutral-200'}`}
                                onClick={() => {
                                    setSuggestedRoutine(routine);
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <span className="font-medium">{routine.name}</span>
                                {suggestedRoutine?.id === routine.id && <Check className="w-5 h-5" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Button
                onClick={handleStartSuggested}
                className="w-full bg-lime-500 hover:bg-lime-600 text-neutral-950 font-bold text-lg py-6 shadow-[0_0_20px_rgba(132,204,22,0.3)] min-h-[64px]"
            >
                <Dumbbell className="w-6 h-6 mr-3" />
                INICIAR ENTRENAMIENTO
            </Button>
        </div>

        {/* Decorative BG */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        </div>
      </div>

      {renderCalendar()}

      {selectedWorkoutId && (
        <WorkoutDetailModal
            workoutId={selectedWorkoutId}
            onClose={() => setSelectedWorkoutId(null)}
        />
      )}
    </div>
  );
}
