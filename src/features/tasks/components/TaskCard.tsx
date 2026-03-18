import type { Task } from '../../../types';
import { useStore } from '../../../lib/store';
import { useUIStore } from '../../../hooks/useUIStore';
import { useTaskDeletion } from '../../../hooks/useTaskDeletion';
import { Button } from '../../../components/Button';
import { CheckCircle, Clock, Trash2, Pencil, MapPin, Ticket } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  className?: string;
  showDelete?: boolean;
}

export function TaskCard({ task, className, showDelete = true }: TaskCardProps) {
  const { completeTask, categories, locations } = useStore();
  const { openCreateModal } = useUIStore();
  const { handleDelete } = useTaskDeletion();
  const category = categories.find(c => c.id === task.category);

  const knownLocation = locations.find(l => l.id === task.location);
  const displayLocation = knownLocation ? knownLocation.name : task.location;

  return (
    <div className={cn(
      "relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors group",
      task.status === 'COMPLETED' && "opacity-60",
      className
    )}>
      {category && (
        <span className={cn(
          "absolute top-3 right-3 text-xs px-2 py-1 rounded-full border bg-opacity-20 flex items-center gap-1 max-w-[100px] truncate",
          category.color,
          category.border,
          category.bg
        )}>
          <span className="truncate">{category.label}</span>
        </span>
      )}
      <div className="flex-1 min-w-0 pr-20 mr-4">
        <h3 className={cn(
          "font-medium text-lg font-body break-words line-clamp-2 leading-tight",
          task.status === 'COMPLETED' ? "line-through text-neutral-400" : "text-neutral-200"
        )}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-neutral-400 mt-1 line-clamp-2 break-words w-full pr-4">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-body">
          {!task.isAllDay && task.scheduledDate && (
            <span className="text-neutral-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {format(new Date(task.scheduledDate), 'HH:mm')}
              {task.endTime && ` - ${task.endTime}`}
            </span>
          )}
          {displayLocation && (
            <span className="text-neutral-400 flex items-center gap-1 shrink-0 ml-1 truncate">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{displayLocation}</span>
            </span>
          )}
          {(task.tickets ?? 1) > 0 && (
            <span className="text-yellow-500/80 flex items-center gap-1 shrink-0 ml-1">
              <Ticket className="w-3 h-3" />
              {task.tickets ?? 1}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 mt-auto sm:mt-0 relative z-10">
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
            onClick={() => handleDelete(task)}
            className="text-neutral-500 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
