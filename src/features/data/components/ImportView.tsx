import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileJson, Upload, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Card';
import { CheckboxRow } from '../../../components/ui/CheckboxRow';
import { useAgendaStore } from '../../../hooks/useAgendaStore';
import { useGymStore } from '../../../hooks/useGymStore';
import {
  importBundle,
  isDataBundle,
  summarizeBundle,
  type DataBundle,
  type ImportSelection,
} from '../../../lib/dataTransfer';

export function ImportView() {
  const refreshExercises = useGymStore((state) => state.refreshExercises);
  const getRoutines = useGymStore((state) => state.getRoutines);
  const getPlans = useAgendaStore((state) => state.getPlans);
  const getSessions = useAgendaStore((state) => state.getSessions);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [bundle, setBundle] = useState<DataBundle | null>(null);
  const [selection, setSelection] = useState<ImportSelection>({
    routines: true,
    customExercises: true,
    plans: true,
    workouts: true,
    agenda: true,
  });
  const [isImporting, setIsImporting] = useState(false);

  const summary = bundle ? summarizeBundle(bundle) : null;

  const reset = () => {
    setBundle(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isDataBundle(parsed)) {
        toast.error('Ese archivo no tiene el formato de exportación de Carga');
        return;
      }

      setBundle(parsed);
      setFileName(file.name);
      setSelection({
        routines: Boolean(parsed.routines?.length),
        customExercises: Boolean(parsed.customExercises?.length),
        plans: Boolean(parsed.plans?.length),
        workouts: Boolean(parsed.workouts?.length),
        agenda: Boolean(parsed.agenda?.length),
      });
    } catch (err) {
      console.error('No se pudo leer el archivo de importación', err);
      toast.error('No se pudo leer el archivo: ¿es un JSON válido?');
    }
  };

  const handleImport = async () => {
    if (!bundle) return;

    setIsImporting(true);
    try {
      const result = await importBundle(bundle, selection);

      const parts = [
        result.routinesImported > 0 && `${result.routinesImported} rutina${result.routinesImported === 1 ? '' : 's'}`,
        result.plansImported > 0 && `${result.plansImported} plan${result.plansImported === 1 ? '' : 'es'}`,
        result.workoutsImported > 0 &&
          `${result.workoutsImported} entrenamiento${result.workoutsImported === 1 ? '' : 's'}`,
        result.agendaImported > 0 && `${result.agendaImported} turno${result.agendaImported === 1 ? '' : 's'}`,
      ].filter(Boolean);

      toast.success(parts.length > 0 ? `Se importó: ${parts.join(', ')}` : 'Importación completa');

      if (result.agendaSkipped > 0) {
        toast.warning(
          `${result.agendaSkipped} turno${result.agendaSkipped === 1 ? '' : 's'} no se pudo importar porque la rutina o el plan que usaba no vino en este archivo`
        );
      }

      await Promise.all([refreshExercises(), getRoutines(), getPlans(), getSessions()]);
      reset();
    } catch (err) {
      console.error('No se pudo importar el archivo', err);
      toast.error('No se pudo completar la importación');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 pt-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {!bundle ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-700 bg-ink-950/40 px-6 py-10 text-center transition-colors hover:border-ember-500/40"
            >
              <Upload className="h-8 w-8 text-ink-500" />
              <span className="text-sm font-semibold text-ink-200">Elegí un archivo JSON exportado</span>
              <span className="text-xs text-ink-500">Tocá para buscarlo en el dispositivo</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-ink-800 bg-ink-950/40 p-4">
              <FileJson className="h-8 w-8 shrink-0 text-ember-400" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-100">{fileName}</span>
              <button
                type="button"
                onClick={reset}
                aria-label="Quitar archivo"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {bundle && summary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Qué querés importar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <CheckboxRow
                checked={selection.routines}
                onChange={(checked) => setSelection((previous) => ({ ...previous, routines: checked }))}
                label="Rutinas"
                hint={
                  summary.routineNames.length > 0
                    ? summary.routineNames.join(', ')
                    : 'El archivo no tiene rutinas'
                }
                disabled={summary.routineNames.length === 0}
              />
              <CheckboxRow
                checked={selection.customExercises}
                onChange={(checked) => setSelection((previous) => ({ ...previous, customExercises: checked }))}
                label="Ejercicios creados a mano"
                hint={
                  summary.customExerciseCount > 0
                    ? `${summary.customExerciseCount} ejercicio${summary.customExerciseCount === 1 ? '' : 's'}`
                    : 'El archivo no tiene ejercicios propios'
                }
                disabled={summary.customExerciseCount === 0}
              />
              <CheckboxRow
                checked={selection.plans}
                onChange={(checked) => setSelection((previous) => ({ ...previous, plans: checked }))}
                label="Planes de entrenamiento"
                hint={summary.planNames.length > 0 ? summary.planNames.join(', ') : 'El archivo no tiene planes'}
                disabled={summary.planNames.length === 0}
              />
              <CheckboxRow
                checked={selection.workouts}
                onChange={(checked) => setSelection((previous) => ({ ...previous, workouts: checked }))}
                label="Entrenamientos guardados"
                hint={
                  summary.workoutCount > 0
                    ? `${summary.workoutCount} sesión${summary.workoutCount === 1 ? '' : 'es'}`
                    : 'El archivo no tiene entrenamientos'
                }
                disabled={summary.workoutCount === 0}
              />
              <CheckboxRow
                checked={selection.agenda}
                onChange={(checked) => setSelection((previous) => ({ ...previous, agenda: checked }))}
                label="Configuración de la agenda"
                hint={
                  summary.agendaCount > 0
                    ? `${summary.agendaCount} turno${summary.agendaCount === 1 ? '' : 's'} agendado${summary.agendaCount === 1 ? '' : 's'}`
                    : 'El archivo no tiene turnos agendados'
                }
                disabled={summary.agendaCount === 0}
              />
              <p className="pt-1 text-xs text-ink-500">
                Los turnos que agendaban una rutina o un plan que no importás junto con ellos se omiten: no
                hay nada válido a lo que apunten.
              </p>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" disabled={isImporting} onClick={handleImport}>
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importando…' : 'Importar'}
          </Button>
        </>
      )}
    </div>
  );
}
