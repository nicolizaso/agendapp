import { startOfWeek, endOfWeek, eachDayOfInterval, subDays, format, isSameDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '../../../types';
import type { ChartData, Achievement } from './types';
import { CATEGORIES } from '../../../lib/constants';
import {
    Flame,
    CalendarCheck,
    Trophy
} from 'lucide-react';

// Hex colors mapping for Recharts (matching Tailwind -400 shades)
const CATEGORY_COLORS: Record<string, string> = {
    casa: '#c084fc',
    gym: '#fb923c',
    cultivo: '#4ade80',
    trabajo: '#60a5fa',
    facultad: '#818cf8',
    salud: '#f87171',
    amigos: '#facc15',
    familia: '#22d3ee',
    cumpleanos: '#f472b6',
    otros: '#a8a29e'
};

export const calculateCategoryStats = (tasks: Task[]): ChartData[] => {
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const stats: Record<string, number> = {};

    completedTasks.forEach(task => {
        const cat = task.category || 'otros';
        stats[cat] = (stats[cat] || 0) + 1;
    });

    return Object.keys(stats).map(catId => {
        const categoryDef = CATEGORIES.find(c => c.id === catId);
        return {
            name: categoryDef?.label || catId,
            value: stats[catId],
            color: CATEGORY_COLORS[catId] || '#a8a29e',
            fill: CATEGORY_COLORS[catId] || '#a8a29e'
        };
    }).sort((a, b) => b.value - a.value); // Sort desc
};

export const calculateWeeklyPerformance = (tasks: Task[]): ChartData[] => {
    const today = new Date();
    const last7Days = eachDayOfInterval({
        start: subDays(today, 6),
        end: today
    });

    return last7Days.map(day => {
        const count = tasks.filter(t =>
            t.status === 'COMPLETED' &&
            t.scheduledDate &&
            isSameDay(new Date(t.scheduledDate), day)
        ).length;

        return {
            name: format(day, 'EEE', { locale: es }).replace('.', ''), // Lun, Mar...
            value: count
        };
    });
};

export const calculateAchievements = (tasks: Task[]): Achievement[] => {
    const achievements: Achievement[] = [];

    // --- Logic 1: Maestro [Category] ---
    // Levels: Bronze (10), Silver (25), Gold (50)
    const completedByCategory: Record<string, number> = {};
    tasks.filter(t => t.status === 'COMPLETED').forEach(t => {
        const cat = t.category || 'otros';
        completedByCategory[cat] = (completedByCategory[cat] || 0) + 1;
    });

    CATEGORIES.forEach(cat => {
        const count = completedByCategory[cat.id] || 0;
        let level = 'BRONZE';
        let target = 10;
        let isUnlocked = false;

        if (count >= 50) {
            level = 'GOLD';
            target = 50; // Maxed out or next? Let's say maxed.
            isUnlocked = true;
        } else if (count >= 25) {
            level = 'SILVER';
            target = 50;
            isUnlocked = true;
        } else if (count >= 10) {
            level = 'BRONZE';
            target = 25;
            isUnlocked = true;
        } else {
            // Not even Bronze
            level = 'BRONZE';
            target = 10;
            isUnlocked = false;
        }

        achievements.push({
            id: `maestro-${cat.id}`,
            title: `Maestro de ${cat.label}`,
            description: isUnlocked
                ? (count >= 50 ? '¡Has alcanzado la maestría máxima!' : `Siguiente nivel a las ${target} tareas.`)
                : `Completa ${target - count} tareas más para desbloquear.`,
            icon: Trophy, // Or category icon? Let's use Trophy for uniform achievement look
            level: level as any,
            progress: count,
            maxProgress: target,
            isUnlocked,
            category: cat.id
        });
    });

    // --- Logic 2: Semana Perfecta ---
    // 100% completion in current week (Mon-Sun)
    const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(new Date(), { weekStartsOn: 1 });

    const tasksThisWeek = tasks.filter(t =>
        t.scheduledDate &&
        isWithinInterval(new Date(t.scheduledDate), { start: startOfWeekDate, end: endOfWeekDate })
    );

    const totalThisWeek = tasksThisWeek.length;
    const completedThisWeek = tasksThisWeek.filter(t => t.status === 'COMPLETED').length;

    const isPerfect = totalThisWeek > 0 && totalThisWeek === completedThisWeek;

    achievements.push({
        id: 'perfect-week',
        title: 'Semana Perfecta',
        description: isPerfect
            ? '¡Has completado todas las tareas de esta semana!'
            : 'Completa todas las tareas agendadas de la semana (Lun-Dom).',
        icon: CalendarCheck,
        level: 'PLATINUM',
        progress: completedThisWeek,
        maxProgress: totalThisWeek || 1, // Avoid div by 0 visual
        isUnlocked: isPerfect
    });

    // --- Logic 3: Racha de Fuego [Category] ---
    // Last 5 tasks of a category were consecutive (no fails? wait, prompt says "consecutivas").
    // Interpreting as: The last 5 tasks registered for this category are ALL completed.

    CATEGORIES.forEach(cat => {
        const catTasks = tasks
            .filter(t => t.category === cat.id && t.scheduledDate)
            .sort((a, b) => new Date(b.scheduledDate!).getTime() - new Date(a.scheduledDate!).getTime()); // Newest first

        const streakTarget = 5; // Configurable
        let streak = 0;

        for (const task of catTasks) {
            if (task.status === 'COMPLETED') {
                streak++;
            } else {
                break; // Streak broken
            }
        }

        const isFire = streak >= streakTarget;

        if (streak > 0) { // Only show if there is some activity or if it's a "Fire" achievement
             achievements.push({
                id: `fire-${cat.id}`,
                title: `Racha de Fuego: ${cat.label}`,
                description: isFire
                    ? `¡Llevas ${streak} tareas cumplidas de ${cat.label} al hilo! ¡Máquina!`
                    : `Encadena ${streakTarget} victorias en ${cat.label}. Llevas ${streak}.`,
                icon: Flame,
                level: 'FIRE',
                progress: streak,
                maxProgress: streakTarget,
                isUnlocked: isFire,
                category: cat.id
            });
        }
    });

    return achievements;
};
