import { useMemo, useState } from 'react';
import { ChevronDown, ImageOff, Loader2, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { CreateExerciseModal } from './CreateExerciseModal';
import { MUSCLE_BADGE, EQUIPMENT_BADGE, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../taxonomy';
import { cn } from '../../../lib/utils';
import type { Exercise } from '../../../types';

const PAGE_SIZE = 12;

export function ExerciseLibrary() {
  const exercises = useGymStore((state) => state.exercises);
  const isLoading = useGymStore((state) => state.isLoading);
  const loadError = useGymStore((state) => state.loadError);
  const refreshExercisesFromApi = useGymStore((state) => state.refreshExercisesFromApi);

  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('Todos');
  const [equipment, setEquipment] = useState('Todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Cambiar un filtro vuelve a la primera página de resultados.
  const applyFilter = (apply: () => void) => {
    apply();
    setVisibleCount(PAGE_SIZE);
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return exercises.filter((exercise) => {
      if (query && !exercise.name.toLowerCase().includes(query)) return false;
      if (muscle !== 'Todos' && exercise.muscleGroup.toLowerCase() !== muscle.toLowerCase()) return false;
      if (equipment !== 'Todos' && (exercise.equipment ?? '').toLowerCase() !== equipment.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [exercises, search, muscle, equipment]);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">Biblioteca</h1>
          <p className="mt-1 text-sm text-ink-400">
            {exercises.length.toLocaleString('es-AR')} ejercicios disponibles
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(event) => applyFilter(() => setSearch(event.target.value))}
            placeholder="Buscar ejercicio..."
            className="pl-11 pr-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => applyFilter(() => setSearch(''))}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <FilterRow
          label="Músculo"
          options={MUSCLE_GROUPS}
          value={muscle}
          onChange={(value) => applyFilter(() => setMuscle(value))}
        />
        <FilterRow
          label="Equipo"
          options={EQUIPMENT_TYPES}
          value={equipment}
          onChange={(value) => applyFilter(() => setEquipment(value))}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-card border border-ink-800 bg-ink-900 py-10 text-sm text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin text-ember-400" />
          Cargando catálogo...
        </div>
      )}

      {loadError && !isLoading && (
        <div className="flex flex-col gap-3 rounded-card border border-ember-500/30 bg-ember-500/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ember-200">{loadError}</p>
          <Button variant="outline" onClick={refreshExercisesFromApi} className="shrink-0">
            <RefreshCw className="h-4 w-4" /> Reintentar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, visibleCount).map((exercise) => (
          <ExerciseTile key={exercise.id ?? exercise.apiId ?? exercise.name} exercise={exercise} />
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-card border border-dashed border-ink-800 py-16 text-center">
          <p className="text-sm text-ink-400">No hay ejercicios con esos filtros.</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" /> Crear ejercicio
          </Button>
        </div>
      )}

      {visibleCount < filtered.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((previous) => previous + PAGE_SIZE)}
          className="h-12 w-full rounded-2xl border border-ink-800 bg-ink-900 text-sm font-semibold text-ink-300 transition-colors hover:bg-ink-850"
        >
          Ver más ({filtered.length - visibleCount} restantes)
        </button>
      )}

      <CreateExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onExerciseCreated={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-widest text-ink-500">{label}</span>
      <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition-all',
              value === option
                ? 'border-ember-500 bg-ember-500 text-ink-950'
                : 'border-ink-800 bg-ink-900 text-ink-400 hover:text-ink-100'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tarjeta de la biblioteca con las notas de puesta a punto editables. */
function ExerciseTile({ exercise }: { exercise: Exercise }) {
  const updateExerciseFitNotes = useGymStore((state) => state.updateExerciseFitNotes);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(exercise.fitNotes ?? '');
  const [imageFailed, setImageFailed] = useState(false);

  const handleSave = async () => {
    if (typeof exercise.id !== 'number') return;
    await updateExerciseFitNotes(exercise.id, notes.trim());
    setIsEditing(false);
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-ink-800 bg-ink-900">
      <div className="relative h-40 bg-ink-850">
        {exercise.gifUrl && !imageFailed ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-600">
            <ImageOff className="h-7 w-7" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span
            className={cn(
              'rounded-md border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm',
              MUSCLE_BADGE[exercise.muscleGroup.toLowerCase()] ?? MUSCLE_BADGE.otro
            )}
          >
            {exercise.muscleGroup}
          </span>
          {exercise.equipment && (
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm',
                EQUIPMENT_BADGE[exercise.equipment.toLowerCase()] ?? EQUIPMENT_BADGE.otro
              )}
            >
              {exercise.equipment}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-heading text-base font-bold leading-tight text-ink-100">{exercise.name}</h3>

        {exercise.instructions && exercise.instructions.length > 0 && (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-400">{exercise.instructions.join(' ')}</p>
        )}

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => {
              setNotes(exercise.fitNotes ?? '');
              setIsOpen((previous) => !previous);
            }}
            aria-expanded={isOpen}
            className="flex h-10 w-full items-center justify-between rounded-xl border border-ink-800 bg-ink-950/60 px-3 text-xs font-semibold text-ink-300 transition-colors hover:text-ink-100"
          >
            <span className="flex items-center gap-2">
              Puesta a punto
              {exercise.fitNotes && <span className="h-2 w-2 rounded-full bg-ember-500" />}
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="animate-in fade-in slide-in-from-top-1 mt-2 space-y-2 rounded-xl border border-ink-800 bg-ink-950/60 p-3 duration-150">
              {isEditing ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    autoFocus
                    placeholder="Ej. Asiento en 3, agarre ancho"
                    className="w-full resize-none rounded-lg border border-ink-700 bg-ink-900 p-2 text-sm text-ink-100 placeholder:text-ink-600 focus:border-ember-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      Guardar
                    </Button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex w-full items-start gap-2 text-left text-sm text-ink-300 hover:text-ink-100"
                >
                  <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="whitespace-pre-wrap">
                    {exercise.fitNotes || <span className="italic text-ink-600">Agregar una nota...</span>}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
