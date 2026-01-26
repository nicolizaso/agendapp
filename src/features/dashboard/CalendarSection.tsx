import { useStore } from '../../lib/store';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';

export function CalendarSection() {
    const { tasks } = useStore();
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });

    // Helper to check if a day has tasks (any status)
    const hasTask = (day: Date) => {
        return tasks.some(t => isSameDay(new Date(t.scheduledDate || t.createdAt), day));
    };

    return (
        <Card className="rounded-2xl bg-rose-900/40 backdrop-blur border-rose-800 animate-in slide-in-from-bottom-4 duration-700 delay-100">
             <CardHeader className="pb-2">
                 <CardTitle className="text-xl font-heading text-stone-200 capitalize text-center">
                    {format(today, 'MMMM yyyy', { locale: es })}
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="grid grid-cols-7 gap-1 text-center text-xs text-rose-400 mb-4 font-body">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                        <div key={i} className="font-bold">{d}</div>
                    ))}
                 </div>
                 <div className="grid grid-cols-7 gap-2 font-body">
                    {/* Pad start of month */}
                    {Array.from({ length: start.getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {days.map((day) => {
                        const active = hasTask(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "aspect-square rounded-md flex flex-col items-center justify-center relative border transition-all duration-300",
                                    isCurrentDay
                                        ? "bg-rose-800 border-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]"
                                        : "bg-rose-950/50 border-rose-900 text-stone-400 hover:bg-rose-900 hover:border-rose-700"
                                )}
                            >
                                <span className="text-sm font-medium">{format(day, 'd')}</span>
                                {active && (
                                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
                                )}
                            </div>
                        );
                    })}
                 </div>
             </CardContent>
        </Card>
    );
}
