import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { useUIStore } from '../../hooks/useUIStore';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getYear,
  format
} from 'date-fns';
import {
  Clock,
  ChevronRight,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { useTaskDeletion } from '../../hooks/useTaskDeletion';
import { cn } from '../../lib/utils';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { DatePicker } from '../../components/ui/DatePicker';
import { TimeWheelPicker } from '../../components/ui/TimeWheelPicker';
import { getIconComponent } from '../../lib/categoryUtils';

export function CreateTaskModal() {
  const { isCreateModalOpen, closeCreateModal, createModalData, openConfirmDialog } = useUIStore();
  const { addTask, addTasks, updateTask, updateRecurringTasks, categories } = useStore();
  const { initialDate, taskToEdit } = createModalData;
  const { handleDelete } = useTaskDeletion();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [time, setTime] = useState('');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [endTime, setEndTime] = useState('');
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);
  const timeContainerRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeContainerRef.current && !timeContainerRef.current.contains(event.target as Node)) {
        setIsTimePickerOpen(false);
        setIsEndTimePickerOpen(false);
      }
    }
    if (isTimePickerOpen || isEndTimePickerOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimePickerOpen, isEndTimePickerOpen]);

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Additional Data
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Effect to sync state when modal opens or data changes
  useEffect(() => {
    if (isCreateModalOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setCategory(taskToEdit.category || null);
        setLocation(taskToEdit.location || '');
        setNotes(taskToEdit.notes || '');

        if (taskToEdit.scheduledDate) {
          const d = new Date(taskToEdit.scheduledDate);
          setDate(format(d, 'yyyy-MM-dd'));

          if (!taskToEdit.isAllDay) {
            setIsTimeEnabled(true);
            setTime(format(d, 'HH:mm'));
          } else {
            setIsTimeEnabled(false);
            setTime('');
          }
        }

        if (taskToEdit.endTime) {
            setEndTime(taskToEdit.endTime);
        } else {
            setEndTime('');
        }

        // For simplicity, we don't pre-fill recurrence rules as decoding them from a list of tasks is complex
        // We assume editing is for the task content/date
        setIsRecurring(false);
      } else {
        // New Task
        setTitle('');
        setCategory(null);
        setLocation('');
        setNotes('');
        setIsRecurring(false);
        setRecurrenceFrequency(1);
        setRecurrenceUnit('day');

        if (initialDate) {
          setDate(format(initialDate, 'yyyy-MM-dd'));
        } else {
          setDate(new Date().toISOString().split('T')[0]);
        }

        setIsTimeEnabled(false);
        setTime('');
        setEndTime('');
      }
    }
  }, [isCreateModalOpen, taskToEdit, initialDate]);

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

    const taskData = {
        title,
        scheduledDate,
        category: category || undefined,
        location,
        notes,
        isAllDay: !isTimeEnabled,
        endTime: isTimeEnabled && endTime ? endTime : undefined,
    };

    if (taskToEdit) {
        const recurrenceKey = taskToEdit.recurringGroupId || taskToEdit.recurrenceId;

        if (recurrenceKey) {
             openConfirmDialog({
                 title: "¿Qué deseas modificar?",
                 message: "Esta es una tarea recurrente.",
                 actions: [
                     {
                         label: "Solo esta tarea",
                         onClick: async () => {
                             if (taskToEdit.id) {
                                await updateTask(taskToEdit.id, taskData);
                                closeCreateModal();
                             }
                         },
                         variant: 'secondary'
                     },
                     {
                         label: "Esta y siguientes",
                         onClick: async () => {
                             if (recurrenceKey && taskToEdit.scheduledDate) {
                                await updateRecurringTasks(recurrenceKey, taskData, 'following', new Date(taskToEdit.scheduledDate));
                                closeCreateModal();
                             }
                         },
                         variant: 'secondary'
                     },
                     {
                         label: "Todas de la serie",
                         onClick: async () => {
                             if (recurrenceKey && taskToEdit.scheduledDate) {
                                await updateRecurringTasks(recurrenceKey, taskData, 'all', new Date(taskToEdit.scheduledDate));
                                closeCreateModal();
                             }
                         },
                         variant: 'primary'
                     },
                     {
                         label: "Cancelar",
                         onClick: () => {},
                         variant: 'ghost'
                     }
                 ]
             });
        } else {
             if (taskToEdit.id) {
                await updateTask(taskToEdit.id, taskData);
                closeCreateModal();
             }
        }
    } else {
        // Create Logic
        if (isRecurring && scheduledDate) {
          const recurrenceId = crypto.randomUUID(); // Generate Recurrence ID
          const recurringGroupId = crypto.randomUUID(); // Generate Recurring Group ID
          const tasksToCreate = [];
          let nextDate = scheduledDate;
          const limitYear = new Date().getFullYear();

          if (getYear(scheduledDate) > limitYear) {
             await addTask({ ...taskData, recurrenceId, recurringGroupId });
          } else {
             while (getYear(nextDate) === limitYear) {
                tasksToCreate.push({
                    title,
                    scheduledDate: nextDate,
                    category: category || undefined,
                    location,
                    notes,
                    isAllDay: !isTimeEnabled,
                    endTime: isTimeEnabled && endTime ? endTime : undefined,
                    recurrenceId,
                    recurringGroupId
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
          await addTask(taskData);
        }
        closeCreateModal();
    }
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.label,
    icon: getIconComponent(cat.icon),
    colorClass: cat.color,
    bgClass: cat.bg
  }));

  return (
    <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title={taskToEdit ? "Editar Tarea" : "Nueva Tarea"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-md p-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-neutral-700"
            placeholder="Ej: Entrenar pierna"
            required
            autoFocus
          />
        </div>

        {/* Date & Time */}
        <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-neutral-200">Fecha y Hora</label>
            <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div className="relative">
                    <DatePicker value={date} onChange={setDate} />
                </div>

                {/* Time Section */}
                <div className="flex gap-2 relative" ref={timeContainerRef}>
                    <div className="flex items-center h-full">
                        <input
                            type="checkbox"
                            id="timeToggle"
                            checked={isTimeEnabled}
                            onChange={(e) => {
                                setIsTimeEnabled(e.target.checked);
                                if (e.target.checked && !time) setTime("12:00");
                            }}
                            className="w-5 h-5 rounded border-neutral-700 text-red-600 focus:ring-red-600 bg-neutral-900/50"
                        />
                        <label htmlFor="timeToggle" className="cursor-pointer text-neutral-400 ml-2">
                            <Clock size={20} />
                        </label>
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <button
                                type="button"
                                onClick={() => {
                                    if (isTimeEnabled) {
                                        setIsTimePickerOpen(!isTimePickerOpen);
                                        setIsEndTimePickerOpen(false);
                                    }
                                }}
                                disabled={!isTimeEnabled}
                                className={cn(
                                    "w-full flex items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-md p-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all",
                                    !isTimeEnabled && "opacity-50 cursor-not-allowed text-neutral-500",
                                    isTimeEnabled && "hover:bg-neutral-800"
                                )}
                            >
                                <span className="text-lg font-mono tracking-wider">
                                    {time || "--:--"}
                                </span>
                            </button>
                            {isTimePickerOpen && isTimeEnabled && (
                                <div className="absolute top-full left-0 mt-2 z-50 p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-[280px] animate-in fade-in zoom-in-95 duration-100">
                                    <TimeWheelPicker value={time || "12:00"} onChange={setTime} />
                                </div>
                            )}
                        </div>

                        <span className="text-neutral-500 font-bold">-</span>

                        <div className="flex-1 relative">
                            <button
                                type="button"
                                onClick={() => {
                                    if (isTimeEnabled) {
                                        setIsEndTimePickerOpen(!isEndTimePickerOpen);
                                        setIsTimePickerOpen(false);
                                    }
                                }}
                                disabled={!isTimeEnabled}
                                className={cn(
                                    "w-full flex items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-md p-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all",
                                    !isTimeEnabled && "opacity-50 cursor-not-allowed text-neutral-500",
                                    isTimeEnabled && "hover:bg-neutral-800"
                                )}
                            >
                                <span className="text-lg font-mono tracking-wider">
                                    {endTime || "--:--"}
                                </span>
                            </button>
                            {isEndTimePickerOpen && isTimeEnabled && (
                                <div className="absolute top-full right-0 mt-2 z-50 p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-[280px] animate-in fade-in zoom-in-95 duration-100">
                                    <TimeWheelPicker value={endTime || "12:00"} onChange={setEndTime} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Categories */}
        <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Categorías</label>
            <CustomSelect
                value={category}
                onChange={(val) => setCategory(val || null)}
                placeholder="Sin categoría"
                options={categoryOptions}
            />
        </div>

        {/* Recurrence - Only show if creating new task (to avoid complex edit logic) */}
        {!taskToEdit && (
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        id="recurrenceToggle"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-700 text-red-600 focus:ring-red-600 bg-neutral-900/50"
                    />
                    <label htmlFor="recurrenceToggle" className="text-sm font-medium text-neutral-200 cursor-pointer">
                        ¿Se repite?
                    </label>
                </div>

                {isRecurring && (
                    <div className="flex gap-4 p-3 bg-neutral-900/20 border border-neutral-800/30 rounded-md animate-in fade-in slide-in-from-top-1">
                        <div className="w-20">
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={recurrenceFrequency}
                                onChange={(e) => setRecurrenceFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-md p-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600 text-center"
                            />
                        </div>
                        <select
                            value={recurrenceUnit}
                            onChange={(e) => setRecurrenceUnit(e.target.value as 'day' | 'week' | 'month' | 'year')}
                            className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-md p-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                        >
                            <option value="day">Día(s)</option>
                            <option value="week">Semana(s)</option>
                            <option value="month">Mes(es)</option>
                            <option value="year">Año(s)</option>
                        </select>
                    </div>
                )}
            </div>
        )}

        {/* Additional Data (Accordion) */}
        <div className="border-t border-neutral-900/50 pt-2">
            <button
                type="button"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="flex items-center justify-between w-full p-2 text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
            >
                <span>Datos Adicionales</span>
                {isDetailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {isDetailsOpen && (
                <div className="mt-2 space-y-4 p-2 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Ubicación</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-neutral-900/30 border border-neutral-800/50 rounded-md p-2 text-sm text-neutral-300 focus:outline-none focus:ring-1 focus:ring-red-600"
                            placeholder="Ej: Gimnasio, Oficina..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Notas</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-neutral-900/30 border border-neutral-800/50 rounded-md p-2 text-sm text-neutral-300 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                            placeholder="Detalles adicionales..."
                        />
                    </div>
                </div>
            )}
        </div>

        <div className="pt-2 flex items-center justify-between">
            {taskToEdit ? (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDelete(taskToEdit, closeCreateModal)}
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-400 gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Eliminar</span>
                </Button>
            ) : (
                <div />
            )}
            <Button type="submit">{taskToEdit ? 'Guardar Cambios' : 'Crear Tarea'}</Button>
        </div>
      </form>
    </Modal>
  );
}
