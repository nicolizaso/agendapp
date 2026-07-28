import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGymStore } from '../../../hooks/useGymStore';
import { Search, X, Check, Plus, ImageOff } from 'lucide-react';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { cn } from '../../../lib/utils';
import type { Exercise } from '../../../types';

const MUSCLE_GROUPS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Cardio', 'Otro'];
const EQUIPMENT = ['Todos', 'Mancuerna', 'Barra', 'Máquina', 'Polea', 'Peso Corporal'];

// Mapeo de colores únicos por Grupo Muscular
const MUSCLE_COLOR_MAP: Record<string, string> = {
  pecho: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
  espalda: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
  piernas: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
  hombros: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
  bíceps: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
  biceps: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
  tríceps: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
  triceps: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
  core: 'bg-orange-950/80 text-orange-300 border-orange-800/60',
  cardio: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/60',
  otro: 'bg-neutral-900/80 text-neutral-300 border-neutral-700/60',
};

// Mapeo de colores únicos por Equipamiento
const EQUIPMENT_COLOR_MAP: Record<string, string> = {
  mancuerna: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
  barra: 'bg-sky-950/80 text-sky-300 border-sky-800/60',
  máquina: 'bg-violet-950/80 text-violet-300 border-violet-800/60',
  maquina: 'bg-violet-950/80 text-violet-300 border-violet-800/60',
  polea: 'bg-lime-950/80 text-lime-300 border-lime-800/60',
  'peso corporal': 'bg-teal-950/80 text-teal-300 border-teal-800/60',
  otro: 'bg-neutral-900/80 text-neutral-300 border-neutral-700/60',
};

function getMuscleBadgeStyle(muscleGroup?: string): string {
  if (!muscleGroup) return MUSCLE_COLOR_MAP.otro;
  const key = muscleGroup.toLowerCase().trim();
  return MUSCLE_COLOR_MAP[key] || MUSCLE_COLOR_MAP.otro;
}

function getEquipmentBadgeStyle(equipment?: string): string {
  if (!equipment) return EQUIPMENT_COLOR_MAP.otro;
  const key = equipment.toLowerCase().trim();
  return EQUIPMENT_COLOR_MAP[key] || EQUIPMENT_COLOR_MAP.otro;
}

interface ExerciseSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyAddedIds: number[];
  onConfirm: (selectedExercises: Exercise[]) => void;
}

export function ExerciseSelectorDrawer({
  isOpen,
  onClose,
  alreadyAddedIds,
  onConfirm,
}: ExerciseSelectorDrawerProps) {
  const { exercises } = useGymStore();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState('Todos');
  const [stagedExercises, setStagedExercises] = useState<Exercise[]>([]);

  /**
   * Filtrado y deduplicación estricta por nombre de ejercicio.
   * Evita renderizados duplicados en la UI de forma reactiva.
   */
  const filteredExercises = useMemo(() => {
    const seenNames = new Set<string>();

    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchesMuscle =
        selectedMuscle === 'Todos' ||
        ex.muscleGroup.toLowerCase() === selectedMuscle.toLowerCase();
      const matchesEquipment =
        selectedEquipment === 'Todos' ||
        ex.equipment?.toLowerCase() === selectedEquipment.toLowerCase();

      if (!matchesSearch || !matchesMuscle || !matchesEquipment) {
        return false;
      }

      const normalizedName = ex.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) {
        return false; // Descarte de duplicados
      }

      seenNames.add(normalizedName);
      return true;
    });
  }, [exercises, search, selectedMuscle, selectedEquipment]);

  if (!isOpen) return null;

  const handleToggleExercise = (ex: Exercise) => {
    if (!ex.id) return;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }

    setStagedExercises((prev) => {
      const exists = prev.some((item) => item.id === ex.id);
      if (exists) {
        return prev.filter((item) => item.id !== ex.id);
      } else {
        return [...prev, ex];
      }
    });
  };

  const handleFinish = () => {
    onConfirm(stagedExercises);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 h-dvh w-screen bg-neutral-950 flex flex-col animate-in slide-in-from-bottom duration-200">
      {/* 1. Header Fijo Superior y Filtros */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="h-12 bg-neutral-900 border-neutral-800 pl-10 pr-10 text-base text-white focus:border-lime-400 rounded-xl"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector"
            className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white bg-neutral-900 rounded-xl border border-neutral-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chips Grupo Muscular */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {MUSCLE_GROUPS.map((group) => {
            const isActive = selectedMuscle === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedMuscle(group)}
                className={cn(
                  'h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                  isActive
                    ? 'bg-lime-400 text-neutral-950 border-lime-400 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                )}
              >
                {group}
              </button>
            );
          })}
        </div>

        {/* Chips Equipamiento */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {EQUIPMENT.map((eq) => {
            const isActive = selectedEquipment === eq;
            return (
              <button
                key={eq}
                type="button"
                onClick={() => setSelectedEquipment(eq)}
                className={cn(
                  'h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                  isActive
                    ? 'bg-lime-400 text-neutral-950 border-lime-400 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                )}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Catálogo de Tarjetas (Grilla de 2 columnas) */}
      <div className="flex-1 overflow-y-auto p-3 pb-32">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {filteredExercises.map((ex) => {
            const isAlreadyInRoutine = alreadyAddedIds.includes(ex.id!);
            const isStaged = stagedExercises.some((item) => item.id === ex.id);

            return (
              <div
                key={ex.id || ex.name}
                onClick={() => !isAlreadyInRoutine && handleToggleExercise(ex)}
                className={cn(
                  'relative aspect-4/5 bg-neutral-900 border rounded-xl overflow-hidden flex flex-col justify-between p-2 cursor-pointer transition-all group select-none',
                  isAlreadyInRoutine
                    ? 'opacity-40 cursor-not-allowed border-neutral-800/40'
                    : isStaged
                    ? 'border-lime-400 ring-2 ring-lime-400/50 shadow-lg shadow-lime-400/10'
                    : 'border-neutral-800 hover:border-neutral-700 active:scale-[0.98]'
                )}
              >
                {ex.gifUrl ? (
                  <img
                    src={ex.gifUrl}
                    alt={ex.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center text-neutral-600 gap-1">
                    <ImageOff className="w-8 h-8" />
                    <span className="text-[10px]">Sin Imagen</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-950/30 pointer-events-none" />

                <button
                  type="button"
                  disabled={isAlreadyInRoutine}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAlreadyInRoutine) handleToggleExercise(ex);
                  }}
                  className={cn(
                    'absolute top-2 right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-md z-10',
                    isAlreadyInRoutine
                      ? 'bg-neutral-900/80 text-neutral-600 border border-neutral-800'
                      : isStaged
                      ? 'bg-lime-400 text-neutral-950 font-bold scale-105'
                      : 'bg-neutral-950/70 backdrop-blur-md text-white border border-white/20 hover:bg-neutral-900'
                  )}
                >
                  {isAlreadyInRoutine || isStaged ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                <div className="relative z-10 mt-auto w-full p-2.5 rounded-lg bg-neutral-950/75 backdrop-blur-md border border-white/10 flex flex-col items-center text-center space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-2">
                    {ex.name}
                  </h4>

                  <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5">
                    <span
                      className={cn(
                        'text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md border backdrop-blur-sm',
                        getMuscleBadgeStyle(ex.muscleGroup)
                      )}
                    >
                      {ex.muscleGroup}
                    </span>

                    {ex.equipment && (
                      <span
                        className={cn(
                          'text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md border backdrop-blur-sm',
                          getEquipmentBadgeStyle(ex.equipment)
                        )}
                      >
                        {ex.equipment}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div className="py-20 text-center text-neutral-500 text-sm border border-dashed border-neutral-800/60 rounded-2xl my-4">
            No se encontraron ejercicios con los filtros seleccionados.
          </div>
        )}
      </div>

      {/* 3. Botón Flotante Inferior de Confirmación */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md z-50">
        <Button
          onClick={handleFinish}
          disabled={stagedExercises.length === 0}
          className="w-full h-14 bg-lime-400 hover:bg-lime-500 text-neutral-950 font-bold text-base rounded-xl disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-lime-400/10 active:scale-95 transition-all"
        >
          Listo ({stagedExercises.length})
        </Button>
      </div>
    </div>,
    document.body
  );
}