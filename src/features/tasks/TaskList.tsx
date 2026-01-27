import { useStore } from '../../lib/store';
import { TaskCard } from './components/TaskCard';

export function TaskList() {
    const { tasks } = useStore();

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
            {sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} showDelete={true} />
            ))}
        </div>
    );
}
