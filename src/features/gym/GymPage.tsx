import { Loader2 } from 'lucide-react';
import { useGymStore } from '../../hooks/useGymStore';
import { GymDashboard } from './components/GymDashboard';

export function GymPage() {
  const isLoading = useGymStore((state) => state.isLoading);
  const exercises = useGymStore((state) => state.exercises);

  // Sólo bloqueamos la pantalla en la primera carga, cuando no hay nada que mostrar.
  if (isLoading && exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-400">
        <Loader2 className="h-7 w-7 animate-spin text-ember-400" />
        <p className="text-sm">Preparando tu catálogo de ejercicios...</p>
      </div>
    );
  }

  return <GymDashboard />;
}
