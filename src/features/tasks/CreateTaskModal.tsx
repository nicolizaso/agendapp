import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import {
  X,
  Clock,
  Dumbbell,
  Sprout,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Users,
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'gym', label: 'Gym', icon: Dumbbell, color: 'text-orange-400', border: 'border-orange-400/50', bg: 'bg-orange-400/10', ring: 'ring-orange-400' },
  { id: 'cultivo', label: 'Cultivo', icon: Sprout, color: 'text-green-400', border: 'border-green-400/50', bg: 'bg-green-400/10', ring: 'ring-green-400' },
  { id: 'trabajo', label: 'Trabajo', icon: Briefcase, color: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400/10', ring: 'ring-blue-400' },
  { id: 'facultad', label: 'Facultad', icon: GraduationCap, color: 'text-indigo-400', border: 'border-indigo-400/50', bg: 'bg-indigo-400/10', ring: 'ring-indigo-400' },
  { id: 'salud', label: 'Salud', icon: HeartPulse, color: 'text-red-400', border: 'border-red-400/50', bg: 'bg-red-400/10', ring: 'ring-red-400' },
  { id: 'amigos', label: 'Amigos', icon: Users, color: 'text-yellow-400', border: 'border-yellow-400/50', bg: 'bg-yellow-400/10', ring: 'ring-yellow-400' },
  { id: 'otros', label: 'Otros', icon: MoreHorizontal, color: 'text-stone-400', border: 'border-stone-400/50', bg: 'bg-stone-400/10', ring: 'ring-stone-400' },
];

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { addTask } = useStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  // Additional Data
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    let scheduledDate: Date | null = null;
    if (date) {
        const [year, month, day] = date.split('-').map(Number);
        scheduledDate = new Date(year, month - 1, day);
        if (isTimeEnabled && time) {
            const [hours, minutes] = time.split(':').map(Number);
            scheduledDate.setHours(hours, minutes, 0, 0);
        } else {
            scheduledDate.setHours(12, 0, 0, 0);
        }
    }

    await addTask({
      title,
      scheduledDate,
      category: category || undefined,
      location,
      notes,
      isAllDay: !isTimeEnabled,
      // Defaults handled in store, but we removed Duration/Effort inputs
    });

    // Reset Form
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsTimeEnabled(false);
    setTime('');
    setCategory(null);
    setIsDetailsOpen(false);
    setLocation('');
    setNotes('');

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Misión">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-rose-200 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-rose-800/50"
            placeholder="Ej: Entrenar pierna"
            required
            autoFocus
          />
        </div>

        {/* Date & Time */}
        <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-rose-200">Fecha y Hora</label>
            <div className="flex items-center gap-3">
                {/* Date Input with Clear Button */}
                <div className="relative flex-1">
                    <input
                        type="date"
                        value={date || ''}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 [color-scheme:dark]"
                    />
                    {date && (
                        <button
                            type="button"
                            onClick={() => setDate(null)}
                            className="absolute right-8 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-200"
                            title="Limpiar fecha"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Time Toggle */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="timeToggle"
                        checked={isTimeEnabled}
                        onChange={(e) => setIsTimeEnabled(e.target.checked)}
                        className="w-5 h-5 rounded border-rose-700 text-rose-600 focus:ring-rose-500 bg-rose-900/50"
                    />
                    <label htmlFor="timeToggle" className="cursor-pointer text-rose-300">
                        <Clock size={20} />
                    </label>
                </div>

                {/* Time Picker (Conditional) */}
                {isTimeEnabled && (
                    <div className="w-28">
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 [color-scheme:dark]"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Categories */}
        <div>
            <label className="block text-sm font-medium text-rose-200 mb-2">Categorías</label>
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(isSelected ? null : cat.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 ${
                                isSelected
                                    ? `${cat.bg} ${cat.border} ${cat.color} ring-2 ${cat.ring} ring-offset-1 ring-offset-rose-950`
                                    : 'bg-rose-900/30 border-rose-800 text-stone-400 hover:border-rose-700 hover:bg-rose-900/50'
                            }`}
                        >
                            <Icon size={16} />
                            <span className="text-sm font-medium">{cat.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Additional Data (Accordion) */}
        <div className="border-t border-rose-900/50 pt-2">
            <button
                type="button"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="flex items-center justify-between w-full p-2 text-sm font-medium text-rose-300 hover:text-rose-100 transition-colors"
            >
                <span>Datos Adicionales</span>
                {isDetailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {isDetailsOpen && (
                <div className="mt-2 space-y-4 p-2 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-medium text-rose-400 mb-1">Ubicación</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-rose-900/30 border border-rose-800/50 rounded-md p-2 text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Ej: Gimnasio, Oficina..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-rose-400 mb-1">Notas</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-rose-900/30 border border-rose-800/50 rounded-md p-2 text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                            placeholder="Detalles adicionales..."
                        />
                    </div>
                </div>
            )}
        </div>

        <div className="pt-2 flex justify-end">
             <Button type="submit">Crear Misión</Button>
        </div>
      </form>
    </Modal>
  );
}
