import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getYear
} from 'date-fns';
import {
  Clock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { DatePicker } from '../../components/ui/DatePicker';
import { TimeInput } from '../../components/ui/TimeInput';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { addTask, addTasks } = useStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'day' | 'week' | 'month' | 'year'>('day');

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

    if (isRecurring && scheduledDate) {
      const tasksToCreate = [];
      let nextDate = scheduledDate;
      const limitYear = new Date().getFullYear();

      // Ensure we process recurrence only for current year as per requirement
      // If start date is beyond current year, fallback to single task creation
      if (getYear(scheduledDate) > limitYear) {
         await addTask({
            title,
            scheduledDate,
            category: category || undefined,
            location,
            notes,
            isAllDay: !isTimeEnabled,
         });
      } else {
         while (getYear(nextDate) === limitYear) {
            tasksToCreate.push({
                title,
                scheduledDate: nextDate,
                category: category || undefined,
                location,
                notes,
                isAllDay: !isTimeEnabled,
            });

            if (recurrenceUnit === 'day') nextDate = addDays(nextDate, recurrenceFrequency);
            if (recurrenceUnit === 'week') nextDate = addWeeks(nextDate, recurrenceFrequency);
            if (recurrenceUnit === 'month') nextDate = addMonths(nextDate, recurrenceFrequency);
            if (recurrenceUnit === 'year') nextDate = addYears(nextDate, recurrenceFrequency);
         }

         if (tasksToCreate.length > 0) {
             await addTasks(tasksToCreate);
         }
      }
    } else {
      await addTask({
        title,
        scheduledDate,
        category: category || undefined,
        location,
        notes,
        isAllDay: !isTimeEnabled,
      });
    }

    // Reset Form
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsTimeEnabled(false);
    setTime('');
    setCategory(null);
    setIsDetailsOpen(false);
    setLocation('');
    setNotes('');
    setIsRecurring(false);
    setRecurrenceFrequency(1);
    setRecurrenceUnit('day');

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Tarea">
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
            <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div className="relative">
                    <DatePicker value={date} onChange={setDate} />
                </div>

                {/* Time Section */}
                <div className="flex gap-2">
                    <div className="flex items-center h-full">
                        <input
                            type="checkbox"
                            id="timeToggle"
                            checked={isTimeEnabled}
                            onChange={(e) => setIsTimeEnabled(e.target.checked)}
                            className="w-5 h-5 rounded border-rose-700 text-rose-600 focus:ring-rose-500 bg-rose-900/50"
                        />
                        <label htmlFor="timeToggle" className="cursor-pointer text-rose-300 ml-2">
                            <Clock size={20} />
                        </label>
                    </div>

                    <TimeInput
                        value={time}
                        onChange={setTime}
                        disabled={!isTimeEnabled}
                    />
                </div>
            </div>
        </div>

        {/* Categories */}
        <div>
            <label className="block text-sm font-medium text-rose-200 mb-2">Categorías</label>
            <CustomSelect
                value={category}
                onChange={(val) => setCategory(val || null)}
                placeholder="Sin categoría"
            />
        </div>

        {/* Recurrence */}
        <div>
            <div className="flex items-center gap-2 mb-2">
                <input
                    type="checkbox"
                    id="recurrenceToggle"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-rose-700 text-rose-600 focus:ring-rose-500 bg-rose-900/50"
                />
                <label htmlFor="recurrenceToggle" className="text-sm font-medium text-rose-200 cursor-pointer">
                    ¿Se repite?
                </label>
            </div>

            {isRecurring && (
                <div className="flex gap-4 p-3 bg-rose-900/20 border border-rose-800/30 rounded-md animate-in fade-in slide-in-from-top-1">
                    <div className="w-20">
                        <input
                            type="number"
                            min="1"
                            max="99"
                            value={recurrenceFrequency}
                            onChange={(e) => setRecurrenceFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-center"
                        />
                    </div>
                    <select
                        value={recurrenceUnit}
                        onChange={(e) => setRecurrenceUnit(e.target.value as 'day' | 'week' | 'month' | 'year')}
                        className="flex-1 bg-rose-900/50 border border-rose-800 rounded-md p-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                        <option value="day">Día(s)</option>
                        <option value="week">Semana(s)</option>
                        <option value="month">Mes(es)</option>
                        <option value="year">Año(s)</option>
                    </select>
                </div>
            )}
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
             <Button type="submit">Crear Tarea</Button>
        </div>
      </form>
    </Modal>
  );
}
