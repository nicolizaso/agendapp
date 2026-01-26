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
        return <div className="text-center text-slate-500 py-10">No missions active. Create one above!</div>
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-200 mb-4">Mission Log</h2>
            {sortedTasks.map((task) => (
                <Card key={task.id} className={cn(
                    "transition-all duration-200",
                    task.status === 'COMPLETED' ? "opacity-60 bg-slate-900 border-transparent" : "bg-slate-800 border-slate-700"
                )}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className={cn("font-medium text-lg", task.status === 'COMPLETED' ? "line-through text-slate-500" : "text-slate-100")}>
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {task.durationMinutes}m
                                </span>
                                <span className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    task.effort === 'HIGH' ? "text-red-400" : task.effort === 'MEDIUM' ? "text-yellow-400" : "text-green-400"
                                )}>
                                    <Zap className="w-3 h-3" /> {task.effort}
                                </span>
                                <span className="text-gold-500 font-bold">
                                    +{task.goldReward} G
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {task.status === 'PENDING' && (
                                <Button size="sm" onClick={() => task.id && completeTask(task.id)} className="bg-green-600 hover:bg-green-500 text-white gap-2">
                                    <CheckCircle className="w-4 h-4" /> Complete
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => task.id && deleteTask(task.id)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
