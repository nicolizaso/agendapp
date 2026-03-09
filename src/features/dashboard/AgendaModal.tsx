import { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { useUIStore } from '../../hooks/useUIStore';
import { Search, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../components/Button';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function AgendaModal() {
    const { tasks, categories, deleteTasks } = useStore();
    const { isAgendaModalOpen, setAgendaModalOpen } = useUIStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'archived'>('pending');

    const filteredTasks = useMemo(() => {
        let result = tasks;

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(t => t.title.toLowerCase().includes(lowerTerm));
        }

        if (selectedCategories.length > 0) {
            result = result.filter(t => {
                const catId = t.category || 'otros';
                return selectedCategories.includes(catId);
            });
        }

        if (activeTab === 'pending') {
            result = result.filter(t => t.status !== 'COMPLETED' && t.scheduledDate);
        } else {
            result = result.filter(t => t.status === 'COMPLETED' || !t.scheduledDate);
        }

        return result.sort((a, b) => {
            const timeA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
            const timeB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
            return timeA - timeB; // Ascending (oldest/next first)
        });
    }, [tasks, searchTerm, selectedCategories, activeTab]);

    const toggleCategory = (catId: string) => {
        setSelectedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleMassDelete = async () => {
        if (selectedTaskIds.length === 0) return;

        await deleteTasks(selectedTaskIds);
        toast.success(`${selectedTaskIds.length} tareas eliminadas`);
        setSelectedTaskIds([]);
    };

    if (!isAgendaModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 w-full max-w-3xl h-[85vh] md:h-[80vh] rounded-2xl border border-neutral-800 flex flex-col overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <h2 className="text-xl font-heading font-bold text-neutral-100">Todos los Eventos</h2>
                    <Button variant="ghost" size="icon" onClick={() => setAgendaModalOpen(false)} className="text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Filters Container */}
                <div className="p-4 border-b border-neutral-800 bg-neutral-900/30 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Buscar tareas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map((cat) => {
                            const isSelected = selectedCategories.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={cn(
                                        "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 shrink-0",
                                        isSelected
                                            ? `${cat.bg} ${cat.border} ${cat.color}`
                                            : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300"
                                    )}
                                >
                                    <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? cat.bg : "bg-neutral-600")} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800 mb-4">
                        <button
                            onClick={() => {
                                setActiveTab('pending');
                                setSelectedTaskIds([]);
                            }}
                            className={cn(
                                "flex-1 transition-colors rounded-md py-1.5 text-sm font-medium",
                                activeTab === 'pending'
                                    ? "bg-neutral-800 text-white"
                                    : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Pendientes
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('archived');
                                setSelectedTaskIds([]);
                            }}
                            className={cn(
                                "flex-1 transition-colors rounded-md py-1.5 text-sm font-medium",
                                activeTab === 'archived'
                                    ? "bg-neutral-800 text-white"
                                    : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Completadas / Sin Fecha
                        </button>
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto bg-neutral-950/50">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-8 text-center">
                            <Search className="w-8 h-8 mb-3 opacity-20" />
                            <p className="font-heading text-lg text-neutral-400">No se encontraron tareas</p>
                            <p className="text-sm">Prueba ajustando los filtros o tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-800/50">
                            {filteredTasks.map(task => {
                                const catDef = categories.find(c => c.id === (task.category || 'otros'));
                                const isSelected = task.id !== undefined && selectedTaskIds.includes(String(task.id));

                                return (
                                    <label
                                        key={task.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 transition-colors cursor-pointer group",
                                            isSelected ? "bg-red-950/20" : "hover:bg-neutral-800/50"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => task.id !== undefined && toggleTaskSelection(String(task.id))}
                                            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-600 focus:ring-offset-neutral-900 accent-red-600 shrink-0 cursor-pointer"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className={cn(
                                                    "font-medium truncate text-sm",
                                                    task.status === 'COMPLETED' ? "text-neutral-500 line-through" : "text-neutral-200"
                                                )}>
                                                    {task.title}
                                                </h3>
                                                {catDef && (
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0",
                                                        catDef.bg, catDef.color
                                                    )}>
                                                        {catDef.label}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                                                {task.scheduledDate
                                                    ? format(new Date(task.scheduledDate), "d MMM, yyyy HH:mm", { locale: es })
                                                    : "Sin fecha"}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Mass Actions */}
                {selectedTaskIds.length > 0 && (
                    <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <span className="text-sm font-medium text-neutral-300">
                            {selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                        </span>

                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleMassDelete}
                            className="gap-2 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Seleccionadas
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
