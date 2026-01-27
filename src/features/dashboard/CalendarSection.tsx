import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useUIStore } from '../../hooks/useUIStore';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { ChevronLeft, ChevronRight, Plus, CalendarX } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { TaskCard } from '../tasks/components/TaskCard';

// Map specific bg colors for dots based on category ID
const DOT_COLORS: Record<string, string> = {
  casa: 'bg-purple-500',
  gym: 'bg-orange-500',
  cultivo: 'bg-green-500',
  trabajo: 'bg-blue-500',
  facultad: 'bg-indigo-500',
  salud: 'bg-red-500',
  amigos: 'bg-yellow-500',
  cumpleanos: 'bg-pink-500',
  otros: 'bg-stone-500',
};

export function CalendarSection() {
    const { tasks } = useStore();
    const { openCreateModal } = useUIStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Generate days for the grid (including prev/next month fillers)
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); // Sunday start
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });

    // Navigation handlers
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    // Helper to get tasks for a specific day
    const getTasksForDay = (day: Date) => {
        return tasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day));
    };

    const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

    return (
        <Card className="rounded-2xl bg-neutral-900/40 backdrop-blur border-neutral-800 animate-in slide-in-from-bottom-4 duration-700 delay-100">
             {/* Header with Navigation */}
             <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                 <Button variant="ghost" size="icon" onClick={prevMonth} className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50">
                    <ChevronLeft className="w-5 h-5" />
                 </Button>
                 <CardTitle className="text-xl font-heading text-neutral-200 capitalize text-center select-none">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                 </CardTitle>
                 <Button variant="ghost" size="icon" onClick={nextMonth} className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50">
                    <ChevronRight className="w-5 h-5" />
                 </Button>
             </CardHeader>

             <CardContent>
                 {/* Weekday Headers */}
                 <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400 mb-4 font-body">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                        <div key={i} className="font-bold">{d}</div>
                    ))}
                 </div>

                 {/* Calendar Grid */}
                 <div className="grid grid-cols-7 gap-2 font-body">
                    {days.map((day) => {
                        const dayTasks = getTasksForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "aspect-square rounded-md flex flex-col items-center justify-start pt-1.5 relative border transition-all duration-300 cursor-pointer select-none",
                                    isCurrentDay
                                        ? "bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                                        : isCurrentMonth
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700"
                                            : "bg-neutral-950/50 border-neutral-900/30 text-neutral-800 hover:bg-neutral-900/30"
                                )}
                            >
                                <span className="text-sm font-medium leading-none">{format(day, 'd')}</span>

                                {/* Dots Container */}
                                <div className="flex gap-0.5 flex-wrap justify-center content-center mt-1 w-full px-1">
                                    {dayTasks.slice(0, 3).map((task) => (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full shadow-sm",
                                                task.category ? DOT_COLORS[task.category] || 'bg-neutral-500' : 'bg-neutral-500'
                                            )}
                                        />
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <Plus className="w-1.5 h-1.5 text-neutral-500" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                 </div>
             </CardContent>

             {/* Day Details Modal */}
             <Modal
                isOpen={!!selectedDay}
                onClose={() => setSelectedDay(null)}
                title={selectedDay ? format(selectedDay, "EEEE, d 'de' MMMM", { locale: es }) : ''}
             >
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {selectedDayTasks.length > 0 ? (
                        selectedDayTasks.map(task => (
                            <TaskCard key={task.id} task={task} showDelete={true} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-3">
                            <CalendarX className="w-16 h-16 opacity-50" />
                            <p className="text-sm font-body">No hay eventos programados</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-800/50 flex justify-end">
                    <Button
                        onClick={() => {
                            if (selectedDay) {
                                openCreateModal({ initialDate: selectedDay });
                                setSelectedDay(null);
                            }
                        }}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Tarea
                    </Button>
                </div>
             </Modal>
        </Card>
    );
}
