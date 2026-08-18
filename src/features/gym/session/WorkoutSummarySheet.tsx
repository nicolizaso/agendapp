import { Flame, Repeat2, Timer, Trophy } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import type { WorkoutSummary } from '../../../types';
import { formatDuration } from '../../../lib/format';

interface WorkoutSummarySheetProps {
  summary: WorkoutSummary | null;
  onClose: () => void;
}

export function WorkoutSummarySheet({ summary, onClose }: WorkoutSummarySheetProps) {
  if (!summary) return null;

  const stats = [
    { icon: Timer, label: 'Duración', value: formatDuration(summary.durationSeconds) },
    { icon: Repeat2, label: 'Series', value: String(summary.totalSets) },
    { icon: Flame, label: 'Volumen', value: `${Math.round(summary.totalVolume).toLocaleString('es-AR')} kg` },
    { icon: Trophy, label: 'Ejercicios', value: String(summary.exerciseCount) },
  ];

  return (
    <Modal isOpen onClose={onClose} title="Entrenamiento terminado" description={summary.name} size="sm">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-ink-800 bg-ink-850 p-4">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-500">
                  <Icon className="h-3.5 w-3.5 text-ember-400" />
                  {stat.label}
                </span>
                <p className="mt-2 font-heading text-xl font-bold tabular-nums text-ink-100">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {summary.totalSets === 0 && (
          <p className="rounded-2xl border border-ink-800 bg-ink-850 p-4 text-sm text-ink-400">
            No registraste ninguna serie, así que la sesión no se guardó en tu historial.
          </p>
        )}

        <Button size="lg" className="w-full" onClick={onClose}>
          Listo
        </Button>
      </div>
    </Modal>
  );
}
