import { useStore } from '../../lib/store';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { CheckCircle, Trash2, Clock, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TaskList() {
    const { tasks, completeTask, deleteTask } = useStore();

    // Sort: Pending first, then by date desc
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'PENDING' ? -1 : 1;
    });

    if (tasks.length === 0) {
        return <div className="text-center text-rose-400 py-10">No hay misiones activas. ¡Crea una!</div>
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-200 mb-4">Misiones Activas</h2>
            {sortedTasks.map((task) => (
                <Card key={task.id} className={cn(
                    "transition-all duration-200",
                    task.status === 'COMPLETED' ? "opacity-60 bg-rose-950 border-transparent" : "bg-rose-900 border-rose-800"
                )}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className={cn("font-medium text-lg", task.status === 'COMPLETED' ? "line-through text-rose-400" : "text-stone-200")}>
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-xs text-rose-300">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {task.durationMinutes}m
                                </span>
                                <span className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    task.effort === 'HIGH' ? "text-red-400" : task.effort === 'MEDIUM' ? "text-amber-400" : "text-green-400"
                                )}>
                                    <Zap className="w-3 h-3" /> {task.effort === 'LOW' ? 'Bajo' : task.effort === 'MEDIUM' ? 'Medio' : 'Alto'}
                                </span>
                                <span className="text-rose-400 font-bold">
                                    +{task.goldReward} Oro
                                </span>
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
            ))}
        </div>
    );
}
