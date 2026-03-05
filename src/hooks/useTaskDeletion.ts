import { useStore } from '../lib/store';
import { useUIStore } from './useUIStore';
import type { Task } from '../types';

export function useTaskDeletion() {
  const { deleteTask, deleteRecurringTasks } = useStore();
  const { openConfirmDialog } = useUIStore();

  const handleDelete = (task: Task, onAfterDelete?: () => void) => {
    if (!task.id) return;

    const recurrenceKey = task.recurringGroupId || task.recurrenceId;

    if (recurrenceKey) {
      openConfirmDialog({
        title: "¿Qué deseas eliminar?",
        message: "Esta es una tarea recurrente.",
        actions: [
          {
            label: "Solo esta tarea",
            onClick: () => {
              deleteTask(task.id!);
              onAfterDelete?.();
            },
            variant: 'secondary'
          },
          {
            label: "Esta y siguientes",
            onClick: () => {
              deleteRecurringTasks(recurrenceKey, 'following', task.scheduledDate ? new Date(task.scheduledDate) : new Date());
              onAfterDelete?.();
            },
            variant: 'secondary'
          },
          {
            label: "Todas de la serie",
            onClick: () => {
              deleteRecurringTasks(recurrenceKey, 'all', task.scheduledDate ? new Date(task.scheduledDate) : new Date());
              onAfterDelete?.();
            },
            variant: 'danger'
          },
          {
            label: "Cancelar",
            onClick: () => {},
            variant: 'ghost'
          }
        ]
      });
    } else {
      openConfirmDialog({
        title: "¿Eliminar Tarea?",
        message: "¿Estás seguro de que deseas eliminar esta tarea?",
        variant: 'danger',
        onConfirm: () => {
          deleteTask(task.id!);
          onAfterDelete?.();
        }
      });
    }
  };

  return { handleDelete };
}
