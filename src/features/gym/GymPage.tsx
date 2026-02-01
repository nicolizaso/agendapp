import { useEffect } from 'react';
import { useGymStore } from '../../hooks/useGymStore';
import { GymDashboard } from './components/GymDashboard';
import { ActiveWorkout } from './components/ActiveWorkout';
import { Loader2 } from 'lucide-react';

export function GymPage() {
  const { init, isLoading, isWorkoutActive } = useGymStore();

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
        <div className="h-full flex items-center justify-center text-red-500">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-full">
      {isWorkoutActive ? <ActiveWorkout /> : <GymDashboard />}
    </div>
  );
}
