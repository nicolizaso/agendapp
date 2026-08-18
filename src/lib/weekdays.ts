/** Días de la semana para la agenda recurrente, en el orden en que se muestran (arranca el lunes). */
export const WEEKDAYS: { value: number; label: string; short: string; letter: string }[] = [
  { value: 1, label: 'Lunes', short: 'Lun', letter: 'L' },
  { value: 2, label: 'Martes', short: 'Mar', letter: 'M' },
  { value: 3, label: 'Miércoles', short: 'Mié', letter: 'X' },
  { value: 4, label: 'Jueves', short: 'Jue', letter: 'J' },
  { value: 5, label: 'Viernes', short: 'Vie', letter: 'V' },
  { value: 6, label: 'Sábado', short: 'Sáb', letter: 'S' },
  { value: 0, label: 'Domingo', short: 'Dom', letter: 'D' },
];

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAYS.find((day) => day.value === dayOfWeek)?.label ?? '';
}

export function weekdayLetter(dayOfWeek: number): string {
  return WEEKDAYS.find((day) => day.value === dayOfWeek)?.letter ?? '?';
}

export function weekdayShort(dayOfWeek: number): string {
  return WEEKDAYS.find((day) => day.value === dayOfWeek)?.short ?? '';
}
