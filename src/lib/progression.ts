/**
 * Progresión de peso de un plan de entrenamiento.
 *
 * Secuencia de bloques de 3 semanas, series fijas en 4:
 *   semana 0 → 4x8  con el peso inicial
 *   semana 1 → 4x10 con el mismo peso
 *   semana 2 → 4x12 con el mismo peso
 *   semana 3 → 4x8  con un peso más (sube el incremento del equipamiento)
 *   semana 4 → 4x10 con ese mismo peso repetido
 *   semana 5 → 4x12 con ese mismo peso repetido
 *   semana 6 → 4x8  con un peso más
 *   ...
 *
 * El incremento depende de la herramienta con la que se carga el peso: no es
 * lo mismo "un salto" en una máquina de placas apiladas que en un par de
 * mancuernas.
 */
import type { EquipmentType, PlanWeekTarget } from '../types';

export const TARGET_SETS = 4;
export const REPS_BY_PHASE = [8, 10, 12] as const;
export const WEEKS_PER_BLOCK = REPS_BY_PHASE.length;

/**
 * Incremento por defecto según el tipo de equipamiento, en kg:
 * - Máquina: los stacks de placas casi siempre saltan de a 4.5-6.8 kg (10-15 lb)
 *   por eslabón; 6 kg es el valor pedido y un salto habitual.
 * - Mancuerna: los racks de gimnasio suelen ir de a 2.5 kg (o 2 en 2 kg);
 *   2.5 kg es el salto estándar y el pedido.
 * - Barra: el disco más chico habitual es de 1.25 kg por lado → 2.5 kg total
 *   por carga; es el incremento clásico en levantamientos con barra.
 * - Polea/cable: los stacks de cable suelen tener pines de 5 kg (algunos
 *   traen "magnetines" de 1.25 kg, pero el salto de pin a pin es 5 kg).
 * - Peso corporal: no hay "cambio de peso" en el aparato; el avance se agrega
 *   con un chaleco o cinturón con lastre, que normalmente se ajusta de a 1 kg.
 * - Otro: sin dato del fabricante, se usa el mismo criterio que barra/mancuerna
 *   (2.5 kg), que es el incremento más chico y seguro para no romper la técnica.
 */
export const DEFAULT_INCREMENT_BY_EQUIPMENT: Record<EquipmentType, number> = {
  Máquina: 6,
  Mancuerna: 2.5,
  Barra: 2.5,
  Polea: 5,
  'Peso Corporal': 1,
  Otro: 2.5,
};

export function getDefaultIncrement(equipmentType: EquipmentType): number {
  return DEFAULT_INCREMENT_BY_EQUIPMENT[equipmentType] ?? 2.5;
}

/** Calcula sets/reps/peso objetivo de un ejercicio del plan para una semana dada (0-indexed). */
export function calculateWeekTarget(
  initialWeight: number,
  equipmentType: EquipmentType,
  weekIndex: number,
  incrementOverride?: number
): PlanWeekTarget {
  const increment = incrementOverride ?? getDefaultIncrement(equipmentType);
  const safeWeek = Math.max(0, Math.floor(weekIndex));

  const blockIndex = Math.floor(safeWeek / WEEKS_PER_BLOCK);
  const phase = safeWeek % WEEKS_PER_BLOCK;

  const weight = Math.round((initialWeight + blockIndex * increment) * 100) / 100;

  return {
    weekIndex: safeWeek,
    sets: TARGET_SETS,
    reps: REPS_BY_PHASE[phase],
    weight,
    isWeightIncrease: phase === 0 && blockIndex > 0,
  };
}

/** Genera la tabla de las próximas `weekCount` semanas, para mostrarla completa. */
export function buildProgressionTable(
  initialWeight: number,
  equipmentType: EquipmentType,
  weekCount: number,
  incrementOverride?: number
): PlanWeekTarget[] {
  return Array.from({ length: weekCount }, (_, weekIndex) =>
    calculateWeekTarget(initialWeight, equipmentType, weekIndex, incrementOverride)
  );
}

/** Semana calendario (0-indexed) en la que cae `date`, a partir del `startDate` del plan. */
export function weekIndexForDate(startDate: Date, date: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  return Math.max(0, Math.floor(diffDays / 7));
}
