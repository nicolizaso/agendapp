import { useMemo } from 'react';
import { useStore } from '../../lib/store';
import {
    calculateCategoryStats,
    calculateWeeklyPerformance,
    calculateAchievements
} from './utils/analyticsEngine';
import { CategoryPieChart } from './components/CategoryPieChart';
import { WeeklyBarChart } from './components/WeeklyBarChart';
import { AchievementsGrid } from './components/AchievementsGrid';
import { BarChart3 } from 'lucide-react';

export function AnalyticsSection() {
    const { tasks } = useStore();

    const categoryData = useMemo(() => calculateCategoryStats(tasks), [tasks]);
    const weeklyData = useMemo(() => calculateWeeklyPerformance(tasks), [tasks]);
    const achievements = useMemo(() => calculateAchievements(tasks), [tasks]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold text-neutral-100">Mi Rendimiento</h2>
                    <p className="text-neutral-400">Estadísticas y medallas desbloqueadas</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategoryPieChart data={categoryData} />
                <WeeklyBarChart data={weeklyData} />
            </div>

            {/* Achievements Section */}
            <AchievementsGrid achievements={achievements} />
        </div>
    );
}
