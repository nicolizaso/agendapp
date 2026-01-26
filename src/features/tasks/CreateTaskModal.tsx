import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import type { Effort } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { addTask } = useStore();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('15');
  const [effort, setEffort] = useState<Effort>('LOW');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // We create a date object from the input string (YYYY-MM-DD)
    // We append T00:00:00 to ensure local time is roughly respected or just use the date part logic
    // Actually, new Date('2024-01-01') defaults to UTC in some contexts but local in others depending on browser.
    // Better to parse it explicitly to avoid timezone shifts if possible, but for now simple constructor is ok
    // as long as we use consistent comparison.
    // The prompt asked to "ignore time" so matching YYYY-MM-DD is key.
    // Here we pass a Date object.

    // Fix timezone issue by parsing YYYY-MM-DD explicitly as local components
    const [year, month, day] = date.split('-').map(Number);
    const scheduledDate = new Date(year, month - 1, day);
    // Set to noon to avoid edge cases with DST shifts when viewing
    scheduledDate.setHours(12, 0, 0, 0);

    await addTask({
      title,
      durationMinutes: parseInt(duration),
      effort,
      scheduledDate: scheduledDate,
    });

    setTitle('');
    setDuration('15');
    setEffort('LOW');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Misión">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-rose-200 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Ej: Leer 10 páginas"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rose-200 mb-1">Duración (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
                 <label className="block text-sm font-medium text-rose-200 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 [color-scheme:dark]"
                  />
            </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-rose-200 mb-1">Esfuerzo</label>
           <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as Effort[]).map((eff) => (
                    <button
                        key={eff}
                        type="button"
                        onClick={() => setEffort(eff)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                            effort === eff
                            ? 'bg-rose-700 border-rose-600 text-white'
                            : 'bg-transparent border-rose-800 text-rose-300 hover:bg-rose-900'
                        }`}
                    >
                        {eff === 'LOW' ? 'Bajo' : eff === 'MEDIUM' ? 'Medio' : 'Alto'}
                    </button>
                ))}
           </div>
        </div>

        <div className="pt-2 flex justify-end">
             <Button type="submit">Crear Misión</Button>
        </div>
      </form>
    </Modal>
  );
}
