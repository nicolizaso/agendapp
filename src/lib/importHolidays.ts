import { db } from './db';
import { useStore } from './store';
import type { TaskStatus } from '../types';

const holidays2026 = [
  { date: '2026-03-24', title: 'Día Nacional de la Memoria por la Verdad y la Justicia', notes: 'Feriado inamovible' },
  { date: '2026-04-02', title: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', notes: 'Feriado inamovible' },
  { date: '2026-04-03', title: 'Viernes Santo', notes: 'Feriado inamovible' },
  { date: '2026-05-01', title: 'Día del Trabajador', notes: 'Feriado inamovible' },
  { date: '2026-05-25', title: 'Día de la Revolución de Mayo', notes: 'Feriado inamovible' },
  { date: '2026-06-20', title: 'Paso a la Inmortalidad del General Manuel Belgrano', notes: 'Feriado inamovible' },
  { date: '2026-07-09', title: 'Día de la Independencia', notes: 'Feriado inamovible' },
  { date: '2026-12-08', title: 'Día de la Inmaculada Concepción de María', notes: 'Feriado inamovible' },
  { date: '2026-12-25', title: 'Navidad', notes: 'Feriado inamovible' },
  { date: '2026-06-17', title: 'Paso a la Inmortalidad del General Martín Güemes', notes: 'Feriado trasladable' },
  { date: '2026-08-17', title: 'Paso a la Inmortalidad del Gral. José de San Martín', notes: 'Feriado trasladable' },
  { date: '2026-10-12', title: 'Día del Respeto a la Diversidad Cultural', notes: 'Feriado trasladable' },
  { date: '2026-11-20', title: 'Día de la Soberanía Nacional', notes: 'Feriado trasladable' },
  { date: '2026-03-23', title: 'Feriado con fines turísticos', notes: 'Lunes puente' },
  { date: '2026-07-10', title: 'Feriado con fines turísticos', notes: 'Viernes puente' },
  { date: '2026-12-07', title: 'Feriado con fines turísticos', notes: 'Lunes puente' }
];

export const bulkImportHolidays = async () => {
  try {
    const tasksToAdd = holidays2026.map(holiday => ({
      id: crypto.randomUUID(),
      title: holiday.title,
      notes: holiday.notes,
      category: 'Feriados',
      scheduledDate: new Date(`${holiday.date}T00:00:00`),
      tickets: 0,
      status: 'PENDING' as TaskStatus,
      createdAt: new Date(),
      goldReward: 0,
      durationMinutes: 15, // Default requirement
      effort: 'LOW' as const // Default requirement
    }));
    await db.tasks.bulkAdd(tasksToAdd);
    const updatedTasks = await db.tasks.toArray();
    useStore.setState({ tasks: updatedTasks });
    alert('¡Feriados 2026 cargados con éxito!');
  } catch (error) {
    console.error(error);
    alert('Error al importar.');
  }
};