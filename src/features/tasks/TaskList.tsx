import { useStore } from '../../lib/store';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { CheckCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CATEGORIES } from '../../lib/constants';

export function TaskList() {
    const { tasks, completeTask, deleteTask } = useStore();

    // Filter: Only tasks without scheduledDate (Backlog)
    const backlogTasks = tasks.filter(t => !t.scheduledDate);

    // Sort: Pending first, then by date desc
    const sortedTasks = [...backlogTasks].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'PENDING' ? -1 : 1;
    });

    if (sortedTasks.length === 0) {
        return <div className="text-center text-rose-400 py-10">No hay pendientes. ¡Agrega uno a tu backlog!</div>
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-200 mb-4">Pendientes</h2>
            {sortedTasks.map((task) => {
                const category = CATEGORIES.find(c => c.id === task.category);
                return (
                    <Card key={task.id} className={cn(
                        "transition-all duration-200",
                        task.status === 'COMPLETED' ? "opacity-60 bg-rose-950 border-transparent" : "bg-rose-900 border-rose-800"
                    )}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className={cn("font-medium text-lg", task.status === 'COMPLETED' ? "line-through text-rose-400" : "text-stone-200")}>
                                    {task.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-xs font-body">
                                    {category && (
                                        <span className={cn("px-2 py-0.5 rounded-full border bg-opacity-20 flex items-center gap-1", category.color, category.border, category.bg)}>
                                            {category.label}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                            {task.status === 'PENDING' && (
                                <Button size="sm" onClick={() => task.id && completeTask(task.id)} className="bg-green-700 hover:bg-green-600 text-white gap-2">
                                    <CheckCircle className="w-4 h-4" /> Completar
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => task.id && deleteTask(task.id)} className="text-rose-400 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
            })}
        </div>
    );
}
