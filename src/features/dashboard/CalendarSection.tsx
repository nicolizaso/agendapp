import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useUIStore } from '../../hooks/useUIStore';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Button } from '../../components/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function CalendarSection() {
    const { tasks, categories } = useStore();
    const { setSelectedDashboardDate, selectedDashboardDate } = useUIStore();
    const [currentDate, setCurrentDate] = useState(new Date());

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

    return (
        <div className="w-full animate-in slide-in-from-bottom-4 duration-700 delay-100 mt-2">
             {/* Header with Navigation */}
             <div className="flex flex-row items-center justify-between pb-4">
                 <Button variant="ghost" size="icon" onClick={prevMonth} className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50">
                    <ChevronLeft className="w-5 h-5" />
                 </Button>
                 <h2 className="text-xl font-heading text-neutral-200 capitalize text-center select-none">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                 </h2>
                 <Button variant="ghost" size="icon" onClick={nextMonth} className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50">
                    <ChevronRight className="w-5 h-5" />
                 </Button>
             </div>

             {/* Weekday Headers */}
             <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400 mb-4 font-body">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                    <div key={i} className="font-bold">{d}</div>
                ))}
             </div>

             {/* Calendar Grid */}
             <div className="grid grid-cols-7 gap-1.5 font-body">
                    {days.map((day) => {
                        const dayTasks = getTasksForDay(day).sort((a, b) => {
                            const timeA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
                            const timeB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
                            return timeA - timeB;
                        });
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isSelectedDay = isSameDay(day, selectedDashboardDate);

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => setSelectedDashboardDate(day)}
                                className={cn(
                                    "min-h-[5.5rem] sm:min-h-[6.5rem] rounded-md flex flex-col items-center justify-start pt-1 relative border transition-all duration-300 cursor-pointer select-none overflow-hidden",
                                    isSelectedDay
                                        ? "bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                                        : isCurrentMonth
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700"
                                            : "bg-neutral-950/50 border-neutral-900/30 text-neutral-800 hover:bg-neutral-900/30"
                                )}
                            >
                                <span className="text-sm font-medium leading-none mb-0.5">{format(day, 'd')}</span>

                                {/* Labels Container */}
                                <div className="flex flex-col gap-[2px] w-full px-0.5 mt-0.5 overflow-hidden">
                                    {dayTasks.slice(0, 3).map((task) => {
                                        const catDef = categories.find(c => c.id === task.category);
                                        // Usamos las clases directas de la categoría para evitar el purging de Tailwind
                                        const bgClass = catDef?.bg || 'bg-neutral-800';
                                        const textClass = catDef?.color || 'text-neutral-300';

                                        return (
                                            <div
                                                key={task.id}
                                                className={cn(
                                                    "w-full truncate text-[8px] md:text-[10px] leading-tight px-1 py-[1.5px] rounded-[3px] text-left font-medium",
                                                    bgClass,
                                                    textClass
                                                )}
                                            >
                                                {task.title}
                                            </div>
                                        );
                                    })}

                                    {/* Contador de Tareas Extra */}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[9px] text-neutral-500 font-bold text-center leading-none mt-[1px]">
                                            +{dayTasks.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                 </div>
        </div>
    );
}
