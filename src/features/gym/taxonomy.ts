/* Vocabulario compartido de grupos musculares y equipamiento.
   Estaba duplicado en cuatro componentes; vive acá una sola vez. */

export const MUSCLE_GROUPS = [
  'Todos',
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core',
  'Cardio',
  'Otro',
] as const;

export const EQUIPMENT_TYPES = [
  'Todos',
  'Mancuerna',
  'Barra',
  'Máquina',
  'Polea',
  'Peso Corporal',
  'Otro',
] as const;

/** Opciones seleccionables al crear un ejercicio (sin el comodín "Todos"). */
export const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS.filter((group) => group !== 'Todos');
export const EQUIPMENT_OPTIONS = EQUIPMENT_TYPES.filter((equipment) => equipment !== 'Todos');

export const MUSCLE_BADGE: Record<string, string> = {
  pecho: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  espalda: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  piernas: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  hombros: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  bíceps: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  biceps: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  tríceps: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  triceps: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  core: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  cardio: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  otro: 'bg-ink-800 text-ink-300 border-ink-700',
};

export const EQUIPMENT_BADGE: Record<string, string> = {
  mancuerna: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  barra: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  máquina: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  maquina: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  polea: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
  'peso corporal': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  otro: 'bg-ink-800 text-ink-300 border-ink-700',
};
