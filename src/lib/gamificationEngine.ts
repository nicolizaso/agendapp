import { isBefore, startOfWeek, isAfter, format } from 'date-fns';
import type { Task, Category, GamificationSettings, Reward } from '../types';

export function calculateCurrentPoints(
  tasks: Task[],
  categories: Category[],
  settings: GamificationSettings
): number {
  const lastResetDate = new Date(settings.lastResetDate);
  const currentMonday = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Use the max of lastResetDate or currentMonday (in case we are in the middle of a week and no reset triggered yet, though the reset should trigger)
  const startDate = isAfter(lastResetDate, currentMonday) ? lastResetDate : currentMonday;

  const completedTasksThisWeek = tasks.filter(task => {
    if (task.status !== 'COMPLETED' || !task.scheduledDate) return false;
    const taskDate = new Date(task.scheduledDate);
    // Task must be scheduled on or after the start date of this week
    return !isBefore(taskDate, startDate);
  });

  const earnedPoints = completedTasksThisWeek.reduce((total, task) => {
    const categoryId = task.category || 'otros';
    const category = categories.find(c => c.id === categoryId);
    const points = category?.points ?? 10;
    return total + points;
  }, 0);

  return settings.carryOverPoints + earnedPoints;
}

export function performWeeklyReset(
  tasks: Task[],
  categories: Category[],
  settings: GamificationSettings,
  rewards: Reward[]
): GamificationSettings | null {
  const currentMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentMondayStr = format(currentMonday, 'yyyy-MM-dd');
  const lastResetDateStr = settings.lastResetDate;

  // Si no hemos pasado al siguiente lunes, no hacemos reset
  if (currentMondayStr <= lastResetDateStr) {
    return null;
  }

  const lastResetDate = new Date(lastResetDateStr);

  // Filtrar tareas de la semana pasada (desde lastResetDate hasta antes de currentMonday)
  const lastWeekTasks = tasks.filter(task => {
    if (!task.scheduledDate) return false;
    const taskDate = new Date(task.scheduledDate);
    return !isBefore(taskDate, lastResetDate) && isBefore(taskDate, currentMonday);
  });

  const completedLastWeek = lastWeekTasks.filter(t => t.status === 'COMPLETED');
  const pendingLastWeek = lastWeekTasks.filter(t => t.status === 'PENDING');

  const earnedPoints = completedLastWeek.reduce((total, task) => {
    const categoryId = task.category || 'otros';
    const category = categories.find(c => c.id === categoryId);
    const points = category?.points ?? 10;
    return total + points;
  }, 0) + settings.carryOverPoints;

  // Encontrar el premio más alto desbloqueado
  let maxUnlockedThreshold = 0;
  for (const reward of rewards) {
    if (reward.pointsThreshold <= earnedPoints && reward.pointsThreshold > maxUnlockedThreshold) {
      maxUnlockedThreshold = reward.pointsThreshold;
    }
  }

  const remainder = earnedPoints - maxUnlockedThreshold;
  const totalPenalty = pendingLastWeek.length * settings.penaltyPoints;
  const newCarryOver = remainder - totalPenalty;

  return {
    ...settings,
    carryOverPoints: newCarryOver,
    lastResetDate: currentMondayStr
  };
}
