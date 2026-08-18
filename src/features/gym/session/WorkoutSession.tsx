import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Dumbbell,
  Image as ImageIcon,
  Lightbulb,
  MoreVertical,
  Plus,
  Shuffle,
  Timer,
  Trash2,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGymStore } from '../../../hooks/useGymStore';
import { useUIStore } from '../../../hooks/useUIStore';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { ExerciseSelectorDrawer } from '../components/ExerciseSelectorDrawer';
import { ExerciseRail } from './ExerciseRail';
import { SetTable } from './SetTable';
import { RestOverlay } from './RestOverlay';
import { SwapExerciseSheet } from './SwapExerciseSheet';
import { formatDuration } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import type { Exercise } from '../../../types';

const REST_BETWEEN_SETS_PRESETS = [15, 30, 45, 60, 90];
const REST_BETWEEN_EXERCISES_PRESETS = [60, 90, 120, 150, 180];

/**
 * Modo entrenamiento.
 *
 * Ocupa la pantalla completa y se enfoca en un solo ejercicio por vez: durante
 * la serie sólo importa qué toca ahora, con cuánto peso y cuánto descanso queda.
 * El resto de la sesión sigue accesible en la tira superior.
 */
export function WorkoutSession() {
  const activeExercises = useGymStore((state) => state.activeExercises);
  const activeWorkoutName = useGymStore((state) => state.activeWorkoutName);
  const activeWorkoutStartTime = useGymStore((state) => state.activeWorkoutStartTime);
  const currentExerciseIndex = useGymStore((state) => state.currentExerciseIndex);
  const catalog = useGymStore((state) => state.exercises);
  const restBetweenSetsSeconds = useGymStore((state) => state.restBetweenSetsSeconds);
  const restBetweenExercisesSeconds = useGymStore((state) => state.restBetweenExercisesSeconds);

  const setCurrentExerciseIndex = useGymStore((state) => state.setCurrentExerciseIndex);
  const addActiveExercise = useGymStore((state) => state.addActiveExercise);
  const removeActiveExercise = useGymStore((state) => state.removeActiveExercise);
  const moveActiveExercise = useGymStore((state) => state.moveActiveExercise);
  const setRestBetweenSetsSeconds = useGymStore((state) => state.setRestBetweenSetsSeconds);
  const setRestBetweenExercisesSeconds = useGymStore((state) => state.setRestBetweenExercisesSeconds);
  const startRestTimer = useGymStore((state) => state.startRestTimer);
  const finishWorkout = useGymStore((state) => state.finishWorkout);
  const cancelWorkout = useGymStore((state) => state.cancelWorkout);
  const openConfirmDialog = useUIStore((state) => state.openConfirmDialog);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const index = Math.min(currentExerciseIndex, Math.max(0, activeExercises.length - 1));
  const exercise = activeExercises[index];
  const definition = useMemo(
    () => catalog.find((item) => item.id === exercise?.exerciseId),
    [catalog, exercise?.exerciseId]
  );

  const totals = useMemo(() => {
    const all = activeExercises.flatMap((item) => item.sets);
    return {
      done: all.filter((item) => item.completed).length,
      total: all.length,
      volume: all
        .filter((item) => item.completed)
        .reduce((sum, item) => sum + (parseFloat(item.weight) || 0) * (parseFloat(item.reps) || 0), 0),
    };
  }, [activeExercises]);

  // Cronómetro global: se recalcula desde la hora de inicio, así que sigue
  // siendo exacto aunque el navegador congele los intervalos en segundo plano.
  useEffect(() => {
    if (!activeWorkoutStartTime) return;

    const tick = () => {
      const start = new Date(activeWorkoutStartTime).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', tick);
    };
  }, [activeWorkoutStartTime]);

  // El modo entrenamiento toma la pantalla completa: nada detrás debe scrollear.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= activeExercises.length) return;
    setCurrentExerciseIndex(nextIndex);
  };

  const handleAllSetsCompleted = () => {
    const all = useGymStore.getState().activeExercises;
    const isSessionComplete = all.every((item) => item.sets.length > 0 && item.sets.every((s) => s.completed));

    if (isSessionComplete) {
      toast.success('¡Completaste todos los ejercicios!');
      return;
    }

    // Saltamos al primer ejercicio que todavía tenga series pendientes.
    const pending = all.findIndex(
      (item, itemIndex) => itemIndex !== index && item.sets.some((s) => !s.completed)
    );

    if (pending !== -1) {
      toast.success('Ejercicio completo. Vamos al siguiente.');
      goTo(pending);
    }
  };

  const handleAddExercises = async (selected: Exercise[]) => {
    const firstNewIndex = activeExercises.length;

    for (const item of selected) {
      await addActiveExercise(item);
    }

    setIsSelectorOpen(false);
    if (selected.length > 0 && activeExercises.length === 0) setCurrentExerciseIndex(firstNewIndex);
  };

  const handleFinish = () => {
    openConfirmDialog({
      title: '¿Terminar el entrenamiento?',
      message:
        totals.done === 0
          ? 'Todavía no registraste ninguna serie. Si terminás ahora, la sesión no se guarda.'
          : `Vas a guardar ${totals.done} ${totals.done === 1 ? 'serie' : 'series'} en tu historial.`,
      confirmLabel: 'Terminar',
      cancelLabel: 'Seguir entrenando',
      // El resumen lo muestra App: esta vista se desmonta al cerrar la sesión.
      onConfirm: () => {
        finishWorkout();
      },
    });
  };

  const handleDiscard = () => {
    setIsOptionsOpen(false);
    openConfirmDialog({
      title: '¿Descartar el entrenamiento?',
      message: 'Se borran todas las series de esta sesión. No se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Descartar',
      cancelLabel: 'Volver',
      onConfirm: () => {
        cancelWorkout();
      },
    });
  };

  const handleRemoveExercise = () => {
    setIsOptionsOpen(false);
    openConfirmDialog({
      title: '¿Quitar el ejercicio?',
      message: `"${exercise?.name}" sale de esta sesión junto con las series que ya cargaste.`,
      variant: 'danger',
      confirmLabel: 'Quitar',
      onConfirm: () => {
        removeActiveExercise(index);
      },
    });
  };

  // Deslizar horizontalmente cambia de ejercicio, como pasar de página.
  const handleTouchStart = (event: React.TouchEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, button')) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    goTo(deltaX < 0 ? index + 1 : index - 1);
  };

  const progress = totals.total > 0 ? (totals.done / totals.total) * 100 : 0;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[8000] flex flex-col bg-ink-950 text-ink-100">
        {/* Barra superior: identidad de la sesión, reloj y salida */}
        <header className="shrink-0 border-b border-ink-800 bg-ink-950/95 pt-safe backdrop-blur-xl">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <button
              type="button"
              onClick={() => setIsOptionsOpen(true)}
              aria-label="Opciones del entrenamiento"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-300 transition-colors hover:bg-ink-850"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="truncate font-heading text-sm font-bold tracking-tight text-ink-100">
                {activeWorkoutName}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs tabular-nums text-ink-400">
                <Timer className="h-3.5 w-3.5 text-ember-400" />
                {formatDuration(elapsedSeconds)}
                <span className="text-ink-600">·</span>
                {totals.done}/{totals.total} series
              </p>
            </div>

            <Button size="sm" variant="primary" className="shrink-0 px-4" onClick={handleFinish}>
              Terminar
            </Button>
          </div>

          <div className="h-1 w-full bg-ink-850">
            <div
              className="h-full bg-linear-to-r from-ember-500 to-mint-400 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {activeExercises.length > 0 && (
          <ExerciseRail
            exercises={activeExercises}
            currentIndex={index}
            onSelect={goTo}
            onAdd={() => setIsSelectorOpen(true)}
          />
        )}

        {/* Zona de trabajo: un ejercicio por vez */}
        <main
          className="flex-1 overflow-y-auto overscroll-contain"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {exercise ? (
            <div className="mx-auto max-w-2xl space-y-5 p-4 pb-8">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ember-400">
                      Ejercicio {index + 1} de {activeExercises.length}
                    </p>
                    <h1 className="mt-1 font-heading text-2xl font-bold leading-tight tracking-tight text-ink-100">
                      {definition?.name || exercise.name}
                    </h1>
                  </div>

                  {definition?.gifUrl && (
                    <button
                      type="button"
                      onClick={() => setIsMediaOpen(true)}
                      aria-label="Ver la técnica del ejercicio"
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900"
                    >
                      <img
                        src={definition.gifUrl}
                        alt={definition.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-ink-700 bg-ink-850 px-3 py-1 text-xs font-semibold text-ink-300">
                    {definition?.muscleGroup || exercise.muscleGroup}
                  </span>
                  {definition?.equipment && (
                    <span className="rounded-full border border-ink-700 bg-ink-850 px-3 py-1 text-xs font-semibold text-ink-300">
                      {definition.equipment}
                    </span>
                  )}
                  {definition?.fitNotes && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/10 px-3 py-1 text-xs font-semibold text-ember-300">
                      <Lightbulb className="h-3.5 w-3.5" />
                      {definition.fitNotes}
                    </span>
                  )}
                </div>
              </div>

              <SetTable
                key={index}
                exercise={exercise}
                exerciseIndex={index}
                onAllSetsCompleted={handleAllSetsCompleted}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwapOpen(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-ink-800 bg-ink-900 text-sm font-semibold text-ink-300 transition-colors hover:border-ember-500/40 hover:text-ink-100"
                >
                  <Shuffle className="h-4 w-4" /> Cambiar ejercicio
                </button>
                <button
                  type="button"
                  onClick={() => startRestTimer(restBetweenSetsSeconds)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-ink-800 bg-ink-900 text-sm font-semibold text-ink-300 transition-colors hover:border-ember-500/40 hover:text-ink-100"
                >
                  <Timer className="h-4 w-4" /> Descansar {restBetweenSetsSeconds}s
                </button>
              </div>

              {totals.volume > 0 && (
                <p className="pt-2 text-center text-xs text-ink-500">
                  Volumen de la sesión:{' '}
                  <span className="font-semibold tabular-nums text-ink-300">
                    {Math.round(totals.volume).toLocaleString('es-AR')} kg
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-ink-800 bg-ink-900 text-ember-400">
                <Dumbbell className="h-9 w-9" />
              </span>
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-bold text-ink-100">Sesión vacía</h2>
                <p className="max-w-xs text-sm text-ink-400">
                  Agregá el primer ejercicio para empezar a registrar tus series.
                </p>
              </div>
              <Button size="lg" onClick={() => setIsSelectorOpen(true)}>
                <Plus className="h-5 w-5" /> Agregar ejercicio
              </Button>
            </div>
          )}
        </main>

        {/* Descanso y navegación viven juntos al alcance del pulgar */}
        <div className="shrink-0">
          <RestOverlay />

          {activeExercises.length > 0 && (
            <div className="flex items-center gap-2 border-t border-ink-800 bg-ink-950/95 px-4 py-3 pb-safe backdrop-blur-xl">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className={cn(
                  'flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-ink-800 bg-ink-900 text-ink-300 transition-colors',
                  'disabled:opacity-30'
                )}
                aria-label="Ejercicio anterior"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {index + 1 < activeExercises.length ? (
                <Button size="lg" variant="secondary" className="flex-1" onClick={() => goTo(index + 1)}>
                  Siguiente: {activeExercises[index + 1].name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="flex-1" onClick={() => setIsSelectorOpen(true)}>
                  <Plus className="h-4 w-4" /> Agregar otro ejercicio
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {isSelectorOpen && (
        <ExerciseSelectorDrawer
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          alreadyAddedIds={activeExercises.map((item) => item.exerciseId)}
          onConfirm={handleAddExercises}
          confirmLabel="Agregar al entrenamiento"
        />
      )}

      {exercise && (
        <SwapExerciseSheet
          isOpen={isSwapOpen}
          onClose={() => setIsSwapOpen(false)}
          exerciseIndex={index}
          currentExerciseName={exercise.name}
          muscleGroup={exercise.muscleGroup}
        />
      )}

      {definition?.gifUrl && (
        <Modal
          isOpen={isMediaOpen}
          onClose={() => setIsMediaOpen(false)}
          title={definition.name}
          description={definition.instructions?.[0]}
          size="md"
        >
          <img
            src={definition.gifUrl}
            alt={definition.name}
            className="w-full rounded-2xl border border-ink-800 bg-ink-950 object-contain"
          />
        </Modal>
      )}

      <Modal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        title="Opciones"
        description={exercise ? exercise.name : activeWorkoutName}
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">
              Descanso entre series (mismo ejercicio)
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {REST_BETWEEN_SETS_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setRestBetweenSetsSeconds(seconds)}
                  className={cn(
                    'h-11 rounded-xl border text-sm font-bold tabular-nums transition-colors',
                    restBetweenSetsSeconds === seconds
                      ? 'border-ember-500 bg-ember-500/15 text-ember-300'
                      : 'border-ink-800 bg-ink-850 text-ink-300'
                  )}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">
              Descanso al cambiar de ejercicio
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {REST_BETWEEN_EXERCISES_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setRestBetweenExercisesSeconds(seconds)}
                  className={cn(
                    'h-11 rounded-xl border text-sm font-bold tabular-nums transition-colors',
                    restBetweenExercisesSeconds === seconds
                      ? 'border-ember-500 bg-ember-500/15 text-ember-300'
                      : 'border-ink-800 bg-ink-850 text-ink-300'
                  )}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          {exercise && (
            <div className="space-y-1.5">
              <OptionRow
                icon={ChevronDown}
                label="Mover ejercicio arriba"
                disabled={index === 0}
                onClick={() => {
                  moveActiveExercise(index, -1);
                  setIsOptionsOpen(false);
                }}
                iconClassName="rotate-180"
              />
              <OptionRow
                icon={ChevronDown}
                label="Mover ejercicio abajo"
                disabled={index >= activeExercises.length - 1}
                onClick={() => {
                  moveActiveExercise(index, 1);
                  setIsOptionsOpen(false);
                }}
              />
              <OptionRow
                icon={ImageIcon}
                label="Ver técnica"
                disabled={!definition?.gifUrl}
                onClick={() => {
                  setIsOptionsOpen(false);
                  setIsMediaOpen(true);
                }}
              />
              <OptionRow
                icon={Trash2}
                label="Quitar ejercicio de la sesión"
                tone="danger"
                onClick={handleRemoveExercise}
              />
            </div>
          )}

          <div className="space-y-1.5 border-t border-ink-800 pt-4">
            <OptionRow
              icon={Trophy}
              label="Terminar y guardar"
              onClick={() => {
                setIsOptionsOpen(false);
                handleFinish();
              }}
            />
            <OptionRow icon={Trash2} label="Descartar entrenamiento" tone="danger" onClick={handleDiscard} />
          </div>
        </div>
      </Modal>

    </>,
    document.body
  );
}

function OptionRow({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone = 'default',
  iconClassName,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors disabled:opacity-30',
        tone === 'danger'
          ? 'text-flare-400 hover:bg-flare-500/10'
          : 'text-ink-200 hover:bg-ink-850'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', iconClassName)} />
      {label}
    </button>
  );
}
