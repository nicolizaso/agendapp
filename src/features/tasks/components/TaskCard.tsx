import type { Task } from '../../../types';
import { useStore } from '../../../lib/store';
import { CATEGORIES } from '../../../lib/constants';
import { Button } from '../../../components/Button';
import { CheckCircle, Clock, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  className?: string;
  showDelete?: boolean;
}

export function TaskCard({ task, className, showDelete = true }: TaskCardProps) {
  const { completeTask, deleteTask } = useStore();
  const category = CATEGORIES.find(c => c.id === task.category);

  return (
    <div className={cn(
      "bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-rose-900/50 transition-colors group",
      task.status === 'COMPLETED' && "opacity-60",
      className
    )}>
      <div className="flex-1 min-w-0 mr-4">
        <h3 className={cn(
          "font-medium text-lg font-body truncate",
          task.status === 'COMPLETED' ? "line-through text-rose-400" : "text-stone-200"
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
            <span className="text-stone-400 flex items-center gap-1 shrink-0">
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
            className="bg-rose-700 hover:bg-rose-600 text-white gap-2 rounded-lg"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}
        {showDelete && (
           <Button
            size="icon"
            variant="ghost"
            onClick={() => task.id && deleteTask(task.id)}
            className="text-rose-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
