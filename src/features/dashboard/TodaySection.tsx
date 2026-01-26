import { useStore } from '../../lib/store';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { CheckCircle, Clock, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { isSameDay } from 'date-fns';

export function TodaySection() {
    const { tasks, completeTask } = useStore();
    const today = new Date();

    const todayTasks = tasks.filter(task =>
        task.status === 'PENDING' &&
        isSameDay(new Date(task.scheduledDate || task.createdAt), today)
    );

    if (todayTasks.length === 0) {
        return (
             <div className="bg-rose-900/30 border border-rose-800 rounded-lg p-6 text-center animate-in fade-in duration-500">
                <p className="text-xl text-rose-300 font-medium">Día libre, ¡a disfrutar!</p>
                <p className="text-rose-500 text-sm mt-2">No hay misiones para hoy.</p>
             </div>
        )
    }

    return (
        <div className="space-y-4 mb-8 animate-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl font-bold text-stone-200">Hoy</h2>
            <div className="grid gap-4">
                {todayTasks.map((task) => (
                    <Card key={task.id} className="bg-rose-900 border-rose-800 transition-colors hover:bg-rose-800/80">
                        <CardContent className="p-4 flex items-center justify-between">
                             <div className="flex-1">
                                <h3 className="font-medium text-lg text-stone-200">
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
                            <Button size="sm" onClick={() => task.id && completeTask(task.id)} className="bg-rose-700 hover:bg-rose-600 text-white gap-2">
                                <CheckCircle className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
