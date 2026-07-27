import { useState, useEffect } from 'react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { Search, Plus, ImageOff, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { CreateExerciseModal } from './CreateExerciseModal';
import { Card, CardContent } from '../../../components/Card';
import { cn } from '../../../lib/utils';

const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Cardio', 'Otro'];
const EQUIPMENT = ['Mancuerna', 'Barra', 'Máquina', 'Polea', 'Peso Corporal'];

export function ExerciseLibrary() {
  const { exercises, init } = useGymStore();
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle ? ex.muscleGroup === selectedMuscle : true;
    const matchesEq = selectedEquipment ? ex.equipment === selectedEquipment : true;
    return matchesSearch && matchesMuscle && matchesEq;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold text-neutral-100">Biblioteca</h2>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros Grupo Muscular */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-500 font-bold uppercase">Grupo Muscular</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedMuscle === null ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedMuscle(null)}
              className={cn('whitespace-nowrap shrink-0 rounded-full', selectedMuscle === null ? '' : 'bg-neutral-800')}
            >
              Todos
            </Button>
            {MUSCLE_GROUPS.map((mg) => (
              <Button
                key={mg}
                variant={selectedMuscle === mg ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
                className={cn('whitespace-nowrap shrink-0 rounded-full', selectedMuscle === mg ? '' : 'bg-neutral-800')}
              >
                {mg}
              </Button>
            ))}
          </div>
        </div>

        {/* Filtros Equipamiento */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-500 font-bold uppercase">Equipamiento</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedEquipment === null ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedEquipment(null)}
              className={cn('whitespace-nowrap shrink-0 rounded-full', selectedEquipment === null ? '' : 'bg-neutral-800')}
            >
              Todos
            </Button>
            {EQUIPMENT.map((eq) => (
              <Button
                key={eq}
                variant={selectedEquipment === eq ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedEquipment(eq === selectedEquipment ? null : eq)}
                className={cn('whitespace-nowrap shrink-0 rounded-full', selectedEquipment === eq ? '' : 'bg-neutral-800')}
              >
                {eq}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Ejercicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((ex) => (
          <ExerciseCard key={ex.id} ex={ex} />
        ))}
        {filteredExercises.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
            No se encontraron ejercicios con esos filtros.
          </div>
        )}
      </div>

      <CreateExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onExerciseCreated={() => {}}
      />
    </div>
  );
}

/**
 * Tarjeta individual de ejercicio con acordeón desplegable para Fit Notes.
 */
function ExerciseCard({ ex }: { ex: import('../../../types').Exercise }) {
  const { updateExerciseFitNotes } = useGymStore();
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false); // Oculto por defecto
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSaveNotes = async (id: number) => {
    await updateExerciseFitNotes(id, notesValue);
    setEditingNotesId(null);
  };

  const handleToggleNotes = () => {
    if (!isNotesOpen) {
      setNotesValue(ex.fitNotes || '');
    }
    setIsNotesOpen((prev) => !prev);
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Contenedor de Imagen/GIF */}
        <div className="h-40 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
          {ex.gifUrl ? (
            <>
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/80 animate-pulse">
                  <div className="w-8 h-8 border-2 border-lime-500/50 border-t-lime-500 rounded-full animate-spin" />
                </div>
              )}
              {imageError ? (
                <div className="flex flex-col items-center justify-center text-neutral-600">
                  <ImageOff className="w-8 h-8 mb-2" />
                  <span className="text-xs">Imagen no disponible</span>
                </div>
              ) : (
                <img
                  src={ex.gifUrl}
                  alt={ex.name}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <span className="text-neutral-600 text-sm">Sin Imagen</span>
          )}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <span className="bg-neutral-950/80 backdrop-blur text-[10px] px-2 py-1 rounded text-neutral-300 border border-neutral-800">
              {ex.muscleGroup}
            </span>
            {ex.equipment && (
              <span className="bg-neutral-950/80 backdrop-blur text-[10px] px-2 py-1 rounded text-neutral-300 border border-neutral-800">
                {ex.equipment}
              </span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <CardContent className="p-4 space-y-3 relative z-10 bg-neutral-900">
          <h3 className="font-bold text-lg text-white leading-tight">{ex.name}</h3>

          {ex.instructions && ex.instructions.length > 0 && (
            <div className="text-xs text-neutral-400 line-clamp-2">
              {ex.instructions.join(' ')}
            </div>
          )}
        </CardContent>
      </div>

      {/* Botón de acordeón y área desplegable de Fit Notes */}
      <div className="p-4 pt-0 bg-neutral-900 border-t border-neutral-800/50 mt-auto">
        <button
          type="button"
          onClick={handleToggleNotes}
          className="w-full flex items-center justify-between text-xs font-semibold text-neutral-400 hover:text-white py-2 px-3 rounded-lg bg-neutral-950/60 hover:bg-neutral-800 transition-colors border border-neutral-800"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-lime-500" />
            <span>Fit Notes</span>
            {ex.fitNotes && (
              <span className="w-2 h-2 rounded-full bg-lime-500 inline-block" title="Tiene notas guardadas" />
            )}
          </div>
          {isNotesOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </button>

        {/* Desplegable animado */}
        {isNotesOpen && (
          <div className="mt-2 bg-neutral-950/80 rounded-lg p-3 border border-neutral-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {editingNotesId === ex.id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-neutral-200 focus:outline-none focus:border-lime-500"
                  rows={2}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Ej. Asiento en 3, usar polea baja..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotesId(null)}>
                    Cancelar
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => handleSaveNotes(ex.id!)}>
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-text text-sm text-neutral-300 min-h-[36px] whitespace-pre-wrap hover:text-white transition-colors"
                onClick={() => {
                  setEditingNotesId(ex.id!);
                  setNotesValue(ex.fitNotes || '');
                }}
              >
                {ex.fitNotes || <span className="text-neutral-600 italic">Tocar para añadir notas...</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
