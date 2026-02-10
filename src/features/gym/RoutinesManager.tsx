import { useEffect, useState } from 'react';
import { useGymStore } from '../../hooks/useGymStore';
import { Button } from '../../components/Button';
import { RoutineModal, type RoutineExerciseInput } from './components/RoutineModal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/Card';
import { Plus, Pencil, Trash2, Dumbbell } from 'lucide-react';
import { db } from '../../lib/db';
import type { Routine } from '../../types';

export function RoutinesManager() {
  const { routines, getRoutines, deleteRoutine, exercises: allExercises, init } = useGymStore();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<{routine: Routine, exercises: RoutineExerciseInput[]} | null>(null);

  useEffect(() => {
    init();
    getRoutines();
  }, [init, getRoutines]);

  useEffect(() => {
    const fetchCounts = async () => {
        const newCounts: Record<number, number> = {};
        for (const routine of routines) {
            if (routine.id) {
                const count = await db.routineExercises.where('routineId').equals(routine.id).count();
                newCounts[routine.id] = count;
            }
        }
        setCounts(newCounts);
    };
    if (routines.length > 0) fetchCounts();
  }, [routines]);

  const handleEdit = async (routine: Routine) => {
    if (!routine.id) return;
    const routineExercises = await db.routineExercises.where('routineId').equals(routine.id).sortBy('order');

    const formattedExercises: RoutineExerciseInput[] = routineExercises.map(rex => {
        const exDef = allExercises.find(e => e.id === rex.exerciseId);
        return {
            exerciseId: rex.exerciseId,
            name: exDef ? exDef.name : 'Ejercicio desconocido',
            targetSets: rex.targetSets,
            targetReps: rex.targetReps,
            targetWeight: rex.targetWeight || ''
        };
    });

    setEditingRoutine({ routine, exercises: formattedExercises });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta rutina?')) {
        await deleteRoutine(id);
    }
  };

  const handleCreate = () => {
      setEditingRoutine(null);
      setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold text-neutral-100">Mis Rutinas</h2>
        <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva Rutina
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.map(routine => (
            <Card key={routine.id} className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{routine.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                    <div className="flex items-center text-neutral-400 text-sm gap-2">
                        <Dumbbell className="w-4 h-4" />
                        <span>{counts[routine.id!] || 0} Ejercicios</span>
                    </div>
                </CardContent>
                <CardFooter className="justify-end gap-2 pt-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(routine)}>
                        <Pencil className="w-4 h-4 text-neutral-400 hover:text-white" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(routine.id!)}>
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </div>

      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingRoutine}
      />
    </div>
  );
}
