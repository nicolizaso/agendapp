import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { TaskCard } from '../tasks/components/TaskCard';
import { isSameDay } from 'date-fns';
import { CATEGORIES } from '../../lib/constants';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function TodaySection() {
    const { tasks } = useStore();
    const today = new Date();

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
        if (a.status !== b.status) {
            return a.status === 'PENDING' ? -1 : 1;
        }
        const dateA = new Date(a.scheduledDate || 0).getTime();
        const dateB = new Date(b.scheduledDate || 0).getTime();
        return dateA - dateB;
    });

    const groupedTasks = todayTasks.reduce((acc, task) => {
        const cat = task.category || 'otros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(task);
        return acc;
    }, {} as Record<string, typeof todayTasks>);

    return (
        <Card className="rounded-2xl bg-neutral-900/40 backdrop-blur border-neutral-800 animate-in slide-in-from-bottom-2 duration-500 h-full">
            <CardHeader>
                <CardTitle className="text-2xl font-heading text-neutral-200">Agenda de Hoy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {todayTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xl text-neutral-400 font-medium font-heading">Día libre, ¡a disfrutar!</p>
                        <p className="text-neutral-500 text-sm mt-2 font-body">No hay misiones para hoy.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(groupedTasks).map(([catId, tasks]) => {
                            const category = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'otros')!;
                            const isExpanded = expandedCategories.includes(catId);
                            const Icon = category.icon;

                            return (
                                <div key={catId} className="space-y-2">
                                    <button
                                        onClick={() => toggleCategory(catId)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${category.bg} ${category.border} ${category.color}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-5 h-5" />
                                            <span className="font-heading font-medium">{category.label}</span>
                                            <span className="text-sm opacity-70">({tasks.length})</span>
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
                )}
            </CardContent>
        </Card>
    );
}
