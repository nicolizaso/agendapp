/**
 * Qué se entrena en una fecha concreta del calendario.
 *
 * La agenda vive en dos lados: los días de un plan (que se repiten todas las semanas entre
 * la fecha de inicio y la de fin del plan, con su progresión de peso) y los turnos sueltos
 * de una rutina (que se repiten todas las semanas, sin plan detrás). Esta función junta los
 * dos y los ordena por horario, para que el calendario y el detalle del día muestren lo mismo.
 */
import { isDateWithinPlan, totalWeeksForPlanDay, weekIndexForPlanDay } from './progression';
import type { PlanDay, Routine, ScheduledSession, TrainingPlan } from '../types';

export interface DayEntry {
  key: string;
  /** Del plan (con progresión de peso) o turno suelto de una rutina. */
  kind: 'plan' | 'routine';
  time: string;
  routineId: number;
  /** Nombre de la rutina que toca, o el aviso de que ya no existe. */
  routineName: string;
  routineExists: boolean;
  planId?: number;
  planName?: string;
  planDayId?: number;
  /** Semana de progresión (0-indexed) que corresponde a esa fecha. */
  weekIndex?: number;
  totalWeeks?: number;
  notes?: string;
}

interface AgendaData {
  plans: TrainingPlan[];
  planDays: PlanDay[];
  sessions: ScheduledSession[];
  routines: Routine[];
}

export function entriesForDate(date: Date, { plans, planDays, sessions, routines }: AgendaData): DayEntry[] {
  const dayOfWeek = date.getDay();
  const entries: DayEntry[] = [];

  for (const planDay of planDays) {
    if (planDay.dayOfWeek !== dayOfWeek) continue;

    const plan = plans.find((item) => item.id === planDay.planId);
    if (!plan || !isDateWithinPlan(plan, date)) continue;

    const routine = routines.find((item) => item.id === planDay.routineId);

    entries.push({
      key: `plan-${planDay.id}`,
      kind: 'plan',
      time: planDay.time,
      routineId: planDay.routineId,
      routineName: routine?.name ?? 'Rutina eliminada',
      routineExists: Boolean(routine),
      planId: plan.id,
      planName: plan.name,
      planDayId: planDay.id,
      weekIndex: weekIndexForPlanDay(plan, planDay.dayOfWeek, date),
      totalWeeks: Math.max(1, totalWeeksForPlanDay(plan, planDay.dayOfWeek)),
    });
  }

  for (const session of sessions) {
    // Los turnos de un plan ya entraron por su día del plan, que es el que manda.
    if (!session.routineId || session.dayOfWeek !== dayOfWeek) continue;

    const routine = routines.find((item) => item.id === session.routineId);

    entries.push({
      key: `session-${session.id}`,
      kind: 'routine',
      time: session.time,
      routineId: session.routineId,
      routineName: routine?.name ?? 'Rutina eliminada',
      routineExists: Boolean(routine),
      notes: session.notes,
    });
  }

  return entries.sort((a, b) => a.time.localeCompare(b.time));
}
