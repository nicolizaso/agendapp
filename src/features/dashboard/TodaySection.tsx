import { useStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
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

    return (
        <Card className="rounded-2xl bg-rose-900/40 backdrop-blur border-rose-800 animate-in slide-in-from-bottom-2 duration-500 h-full">
            <CardHeader>
                <CardTitle className="text-2xl font-heading text-stone-200">Agenda de Hoy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {todayTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xl text-rose-300 font-medium font-heading">Día libre, ¡a disfrutar!</p>
                        <p className="text-rose-500 text-sm mt-2 font-body">No hay misiones para hoy.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {todayTasks.map((task) => (
                            <div key={task.id} className="bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-rose-900/50 transition-colors">
                                 <div className="flex-1">
                                    <h3 className="font-medium text-lg text-stone-200 font-body">
                                        {task.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-rose-300 font-body">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {task.durationMinutes}m
                                        </span>
                                        <span className={cn(
                                            "flex items-center gap-1 font-semibold",
                                            task.effort === 'HIGH' ? "text-red-400" : task.effort === 'MEDIUM' ? "text-amber-400" : "text-green-400"
                                        )}>
                                            <Zap className="w-3 h-3" /> {task.effort === 'LOW' ? 'Bajo' : task.effort === 'MEDIUM' ? 'Medio' : 'Alto'}
                                        </span>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => task.id && completeTask(task.id)} className="bg-rose-700 hover:bg-rose-600 text-white gap-2 rounded-lg">
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
