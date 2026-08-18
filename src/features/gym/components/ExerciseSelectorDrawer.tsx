import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ImageOff, Plus, Search, X } from 'lucide-react';
import { useGymStore } from '../../../hooks/useGymStore';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { cn } from '../../../lib/utils';
import { MUSCLE_BADGE, EQUIPMENT_BADGE, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../taxonomy';
import type { Exercise } from '../../../types';
import { CreateExerciseModal } from './CreateExerciseModal';

const PAGE_SIZE = 12;

interface ExerciseSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyAddedIds: number[];
  onConfirm: (selectedExercises: Exercise[]) => void;
  confirmLabel?: string;
}

/**
 * Buscador de ejercicios a pantalla completa, compartido por el armado de
 * rutinas y por el modo entrenamiento.
 */
export function ExerciseSelectorDrawer({
  isOpen,
  onClose,
  alreadyAddedIds,
  onConfirm,
  confirmLabel = 'Agregar',
}: ExerciseSelectorDrawerProps) {
  const exercises = useGymStore((state) => state.exercises);

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState('Todos');
  const [staged, setStaged] = useState<Exercise[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    const seen = new Set<string>();

    return exercises.filter((exercise) => {
      if (query && !exercise.name.toLowerCase().includes(query)) return false;
      if (selectedMuscle !== 'Todos' && exercise.muscleGroup.toLowerCase() !== selectedMuscle.toLowerCase()) {
        return false;
      }
      if (
        selectedEquipment !== 'Todos' &&
        (exercise.equipment ?? '').toLowerCase() !== selectedEquipment.toLowerCase()
      ) {
        return false;
      }

      // El catálogo remoto trae variantes con el mismo nombre: mostramos una.
      const key = exercise.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [exercises, search, selectedMuscle, selectedEquipment]);

  if (!isOpen) return null;

  const resetFilter = (apply: () => void) => {
    apply();
    setVisibleCount(PAGE_SIZE);
  };

  const toggleExercise = (exercise: Exercise) => {
    if (typeof exercise.id !== 'number') return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);

    setStaged((previous) =>
      previous.some((item) => item.id === exercise.id)
        ? previous.filter((item) => item.id !== exercise.id)
        : [...previous, exercise]
    );
  };

  const handleConfirm = () => {
    onConfirm(staged);
    setStaged([]);
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9500] flex h-dvh w-screen flex-col bg-ink-950 animate-in slide-in-from-bottom duration-200">
        <div className="shrink-0 space-y-3 border-b border-ink-800 bg-ink-950/95 p-4 pt-safe backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <Input
                value={search}
                onChange={(event) => resetFilter(() => setSearch(event.target.value))}
                placeholder="Buscar ejercicio..."
                className="pl-11 pr-11"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => resetFilter(() => setSearch(''))}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar buscador"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink-800 bg-ink-900 text-ink-300 transition-colors hover:text-ink-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <FilterChips
            options={MUSCLE_GROUPS}
            value={selectedMuscle}
            onChange={(value) => resetFilter(() => setSelectedMuscle(value))}
          />
          <FilterChips
            options={EQUIPMENT_TYPES}
            value={selectedEquipment}
            onChange={(value) => resetFilter(() => setSelectedEquipment(value))}
          />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.slice(0, visibleCount).map((exercise) => {
              const isAlreadyAdded = alreadyAddedIds.includes(exercise.id as number);
              const isStaged = staged.some((item) => item.id === exercise.id);

              return (
                <button
                  key={exercise.id ?? exercise.name}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => toggleExercise(exercise)}
                  className={cn(
                    'group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl border p-2 text-left transition-all',
                    isAlreadyAdded
                      ? 'cursor-not-allowed border-ink-800/50 opacity-40'
                      : isStaged
                        ? 'border-ember-500 ring-2 ring-ember-500/40'
                        : 'border-ink-800 hover:border-ink-600 active:scale-[0.98]'
                  )}
                >
                  {exercise.gifUrl ? (
                    <img
                      src={exercise.gifUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-900 text-ink-600">
                      <ImageOff className="h-7 w-7" />
                    </div>
                  )}

                  <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/50 to-ink-950/10" />

                  <span
                    className={cn(
                      'absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
                      isAlreadyAdded
                        ? 'border-ink-800 bg-ink-900/80 text-ink-600'
                        : isStaged
                          ? 'border-transparent bg-ember-500 text-ink-950'
                          : 'border-white/15 bg-ink-950/70 text-ink-100 backdrop-blur-md'
                    )}
                  >
                    {isAlreadyAdded || isStaged ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>

                  <span className="relative z-10 space-y-1.5">
                    <span className="line-clamp-2 block text-xs font-bold leading-tight text-ink-100">
                      {exercise.name}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      <span
                        className={cn(
                          'rounded-md border px-1.5 py-0.5 text-[9px] font-bold',
                          MUSCLE_BADGE[exercise.muscleGroup.toLowerCase()] ?? MUSCLE_BADGE.otro
                        )}
                      >
                        {exercise.muscleGroup}
                      </span>
                      {exercise.equipment && (
                        <span
                          className={cn(
                            'rounded-md border px-1.5 py-0.5 text-[9px] font-bold',
                            EQUIPMENT_BADGE[exercise.equipment.toLowerCase()] ?? EQUIPMENT_BADGE.otro
                          )}
                        >
                          {exercise.equipment}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="my-4 rounded-card border border-dashed border-ink-800 py-16 text-center">
              <p className="text-sm text-ink-400">No hay ejercicios con esos filtros.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" /> Crear el ejercicio
              </Button>
            </div>
          )}

          {visibleCount < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((previous) => previous + PAGE_SIZE)}
              className="mt-4 h-12 w-full rounded-2xl border border-ink-800 bg-ink-900 text-sm font-semibold text-ink-300 transition-colors hover:bg-ink-850"
            >
              Ver más ({filtered.length - visibleCount} restantes)
            </button>
          )}

          <div className="h-28" />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-ink-800 bg-ink-950/95 p-4 pb-safe backdrop-blur-xl">
          <Button
            variant="outline"
            size="lg"
            className="shrink-0"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Crear ejercicio nuevo"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button size="lg" className="flex-1" disabled={staged.length === 0} onClick={handleConfirm}>
            {confirmLabel}
            {staged.length > 0 ? ` (${staged.length})` : ''}
          </Button>
        </div>
      </div>

      <CreateExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onExerciseCreated={(exercise) => setStaged((previous) => [...previous, exercise])}
      />
    </>,
    document.body
  );
}

function FilterChips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
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
  );
}
