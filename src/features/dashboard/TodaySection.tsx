import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useUIStore } from '../../hooks/useUIStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { TaskCard } from '../tasks/components/TaskCard';
import { isSameDay, isToday, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Plus, ClipboardList } from 'lucide-react';
import { Button } from '../../components/Button';
import { IconResolver } from '../../lib/categoryUtils';

export function TodaySection() {
    const { tasks, categories } = useStore();
    const { selectedDashboardDate, openCreateModal, setAgendaModalOpen } = useUIStore();
    const today = selectedDashboardDate;

    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const todayTasks = tasks.filter(task =>
        task.scheduledDate &&
        isSameDay(new Date(task.scheduledDate), today)
    ).sort((a, b) => {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        return dateA - dateB;
    });

    const nextTask = todayTasks.find(t => t.status === 'PENDING');
    const remainingTasks = todayTasks.filter(t => t.id !== nextTask?.id);

    const groupedTasks = remainingTasks.reduce((acc, task) => {
        const cat = task.category || 'otros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(task);
        return acc;
    }, {} as Record<string, typeof remainingTasks>);

    const sortedCategoryEntries = Object.entries(groupedTasks).sort(([, tasksA], [, tasksB]) => {
        const aAllCompleted = tasksA.length > 0 && tasksA.every(t => t.status === 'COMPLETED');
        const bAllCompleted = tasksB.length > 0 && tasksB.every(t => t.status === 'COMPLETED');

        if (aAllCompleted === bAllCompleted) return 0; // Mantienen su orden original si tienen el mismo estado
        return aAllCompleted ? 1 : -1; // Los completados (true) se van al final (1)
    });

    const isNextTaskNow = (task: typeof nextTask) => {
        if (!task || !task.scheduledDate) return false;
        const now = new Date();
        const scheduled = new Date(task.scheduledDate);
        const duration = task.durationMinutes || 0;
        const endTime = new Date(scheduled.getTime() + duration * 60000);

        // If duration exists, check if currently inside the window
        if (duration > 0) {
            return now >= scheduled && now < endTime;
        }

        // If no duration, it's "now" if we are past the scheduled time but still same day
        return now >= scheduled;
    };

    return (
        <Card className="rounded-2xl bg-neutral-900/40 backdrop-blur border-neutral-800 animate-in slide-in-from-bottom-2 duration-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-heading text-neutral-200">
                    {isToday(selectedDashboardDate) ? "Agenda de Hoy" : "Agenda del " + format(selectedDashboardDate, "d 'de' MMMM", { locale: es })}
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAgendaModalOpen(true)}
                        className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                    >
                        <ClipboardList className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCreateModal({ initialDate: selectedDashboardDate })}
                        className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {todayTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xl text-neutral-400 font-medium font-heading">Día libre, ¡a disfrutar!</p>
                        <p className="text-neutral-500 text-sm mt-2 font-body">No hay misiones para hoy.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {nextTask && (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold tracking-wider text-neutral-500 uppercase ml-1">
                                        {isNextTaskNow(nextTask) ? "📍 AHORA" : "⏳ PRÓXIMO"}
                                    </h3>
                                    <div className="ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.1)] rounded-xl bg-neutral-900/50">
                                        <TaskCard task={nextTask} showDelete={false} />
                                    </div>
                                </div>
                                <hr className="border-neutral-800 my-4" />
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-3 items-start">
                            {sortedCategoryEntries.map(([catId, tasks]) => {
                                const category = categories.find(c => c.id === catId) || categories.find(c => c.id === 'otros')!;
                                const isExpanded = expandedCategories.includes(catId);
                                const isAllCompleted = tasks.length > 0 && tasks.every(task => task.status === 'COMPLETED');

                                return (
                                    <div key={catId} className={`transition-all duration-300 ease-in-out space-y-2 ${isExpanded ? 'col-span-2' : 'col-span-1'}`}>
                                        <button
                                            onClick={() => toggleCategory(catId)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                                isAllCompleted
                                                    ? 'bg-neutral-800/40 border-neutral-700/50 text-neutral-500 opacity-60 hover:opacity-100'
                                                    : category ? `${category.bg} ${category.border} ${category.color}` : 'bg-neutral-800/40 border-neutral-700/50 text-neutral-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {category && <IconResolver iconName={category.icon} className="w-5 h-5 shrink-0" />}
                                                <span className={`font-heading font-medium truncate ${isAllCompleted ? 'line-through' : ''}`}>
                                                    {category?.label || 'Otros'}
                                                </span>
                                                <span className="text-sm opacity-70 shrink-0">({tasks.length})</span>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="grid gap-3 pt-1 pl-1">
                                                {tasks.map((task) => (
                                                    <TaskCard key={task.id} task={task} showDelete={false} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
