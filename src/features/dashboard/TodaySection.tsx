import { useStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { TaskCard } from '../tasks/components/TaskCard';
import { isSameDay } from 'date-fns';

export function TodaySection() {
    const { tasks } = useStore();
    const today = new Date();

    const todayTasks = tasks.filter(task =>
        task.scheduledDate &&
        isSameDay(new Date(task.scheduledDate), today)
    ).sort((a, b) => (a.status === b.status ? 0 : a.status === 'PENDING' ? -1 : 1));

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
                    <div className="grid gap-3">
                        {todayTasks.map((task) => (
                            <TaskCard key={task.id} task={task} showDelete={false} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
