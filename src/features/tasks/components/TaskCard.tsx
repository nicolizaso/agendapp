import type { Task } from '../../../types';
import { useStore } from '../../../lib/store';
import { useUIStore } from '../../../hooks/useUIStore';
import { CATEGORIES } from '../../../lib/constants';
import { Button } from '../../../components/Button';
import { CheckCircle, Clock, Trash2, Pencil } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  className?: string;
  showDelete?: boolean;
}

export function TaskCard({ task, className, showDelete = true }: TaskCardProps) {
  const { completeTask, deleteTask, deleteRecurringTasks } = useStore();
  const { openCreateModal, openConfirmDialog } = useUIStore();
  const category = CATEGORIES.find(c => c.id === task.category);

  const handleDelete = () => {
    if (!task.id) return;

    if (task.recurrenceId) {
      openConfirmDialog({
        title: "Borrar evento recurrente",
        message: "¿Qué deseas borrar?",
        actions: [
          {
            label: "Cancelar",
            onClick: () => {},
            variant: 'ghost'
          },
          {
            label: "Solo este evento",
            onClick: () => deleteTask(task.id!),
            variant: 'secondary'
          },
          {
            label: "Este y futuros",
            onClick: () => deleteRecurringTasks(task.recurrenceId!, 'future', task.scheduledDate ? new Date(task.scheduledDate) : new Date()),
            variant: 'danger'
          }
        ]
      });
    } else {
      deleteTask(task.id);
    }
  };

  return (
    <div className={cn(
      "bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors group",
      task.status === 'COMPLETED' && "opacity-60",
      className
    )}>
      <div className="flex-1 min-w-0 mr-4">
        <h3 className={cn(
          "font-medium text-lg font-body truncate",
          task.status === 'COMPLETED' ? "line-through text-neutral-400" : "text-neutral-200"
        )}>
          {task.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-xs font-body">
          {category && (
            <span className={cn(
              "px-2 py-0.5 rounded-full border bg-opacity-20 flex items-center gap-1 shrink-0",
              category.color,
              category.border,
              category.bg
            )}>
              {category.label}
            </span>
          )}
          {!task.isAllDay && task.scheduledDate && (
            <span className="text-neutral-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {format(new Date(task.scheduledDate), 'HH:mm')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.status === 'PENDING' && (
          <Button
            size="sm"
            onClick={() => task.id && completeTask(task.id)}
            className="bg-red-600 hover:bg-red-700 text-white gap-2 rounded-lg"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => openCreateModal({ taskToEdit: task })}
          className="text-neutral-500 hover:text-neutral-200 transition-colors duration-200"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        {showDelete && (
           <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            className="text-neutral-500 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
