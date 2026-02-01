import { useEffect, useState } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { CreateRoutineModal } from './CreateRoutineModal';
import { Dumbbell, History, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import { db } from '../../../lib/db';
import type { Workout } from '../../../types';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function GymDashboard() {
  const { startWorkout, routines, getRoutines, loadRoutineIntoWorkout } = useGymStore();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [chartData, setChartData] = useState<{date: string, count: number}[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [isCreateRoutineOpen, setIsCreateRoutineOpen] = useState(false);

  useEffect(() => {
    getRoutines();
  }, [getRoutines]);

  useEffect(() => {
    const loadData = async () => {
      // Recent Workouts
      const workouts = await db.workouts.orderBy('date').reverse().limit(5).toArray();
      setRecentWorkouts(workouts);

      // Chart Data (Last 10 sessions duration)
      const allWorkouts = await db.workouts.orderBy('date').toArray();
      const data = allWorkouts.slice(-10).map(w => ({
          date: format(w.date, 'dd/MM'),
          count: Math.round(w.durationSeconds / 60)
      }));
      setChartData(data);
    };
    loadData();
  }, []);

  const handleStart = () => {
    if (selectedRoutine) {
      loadRoutineIntoWorkout(parseInt(selectedRoutine));
    } else {
      startWorkout();
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">

      {/* Hero Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-3xl font-heading font-bold text-white mb-2">Gym Tracker</h2>
            <p className="text-neutral-400 mb-6">¿Listo para romper tus límites?</p>

            {/* Routine Selector */}
            <div className="mb-4 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50 backdrop-blur-sm">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Seleccionar Rutina</label>
              <div className="flex gap-2">
                <Select
                  value={selectedRoutine}
                  onChange={(e) => setSelectedRoutine(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Entrenamiento Libre</option>
                  {routines.map(routine => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreateRoutineOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
                onClick={handleStart}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-6 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
            >
                <Dumbbell className="w-6 h-6 mr-3" />
                {selectedRoutine ? 'INICIAR RUTINA' : 'COMENZAR ENTRENAMIENTO'}
            </Button>
        </div>

        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <CreateRoutineModal
        isOpen={isCreateRoutineOpen}
        onClose={() => setIsCreateRoutineOpen(false)}
      />

      {/* Analytics Sparkline */}
      {chartData.length > 1 && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    Rendimiento (Minutos)
                </h3>
            </div>
            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="date" hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#a3a3a3' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#dc2626"
                            strokeWidth={3}
                            dot={{ fill: '#dc2626', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* Recent History */}
      <div>
        <h3 className="font-bold text-neutral-300 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            Últimas Sesiones
        </h3>
        <div className="space-y-3">
            {recentWorkouts.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-neutral-800 rounded-xl text-neutral-500">
                    Sin historial reciente
                </div>
            ) : (
                recentWorkouts.map(workout => (
                    <div key={workout.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-neutral-700 transition-colors">
                        <div>
                            <h4 className="font-bold text-white">{workout.name}</h4>
                            <p className="text-xs text-neutral-400 capitalize">
                                {format(workout.date, "EEEE d 'de' MMMM", { locale: es })} • {Math.round(workout.durationSeconds / 60)} min
                            </p>
                        </div>
                        <ChevronRight className="text-neutral-600 group-hover:text-white transition-colors" />
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
