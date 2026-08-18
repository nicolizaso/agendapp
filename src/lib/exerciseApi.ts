import type { Exercise } from '../types';

// CDNs de alta disponibilidad ordenados por confiabilidad
const ENDPOINTS = [
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json',
  'https://cdn.statically.io/gh/yuhonas/free-exercise-db/main/dist/exercises.json',
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
  '/exercises.json', // Fallback local dentro de public/
];

const BASE_CDN_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

// Mapeo de primaryMuscles / bodyPart a categorías en español
const MUSCLE_GROUP_TRANSLATIONS: Record<string, string> = {
  abdominals: 'Core',
  chest: 'Pecho',
  lats: 'Espalda',
  'lower back': 'Espalda',
  'middle back': 'Espalda',
  traps: 'Espalda',
  neck: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Bíceps',
  quadriceps: 'Piernas',
  hamstrings: 'Piernas',
  calves: 'Piernas',
  glutes: 'Piernas',
  adductors: 'Piernas',
  abductors: 'Piernas',
  // Fallbacks para estructuras alternativas
  back: 'Espalda',
  legs: 'Piernas',
  core: 'Core',
  abs: 'Core',
  cardio: 'Cardio',
};

const EQUIPMENT_TRANSLATIONS: Record<string, string> = {
  dumbbell: 'Mancuerna',
  barbell: 'Barra',
  machine: 'Máquina',
  cable: 'Polea',
  'body weight': 'Peso Corporal',
  bodyweight: 'Peso Corporal',
  assisted: 'Máquina',
  band: 'Otro',
  kettlebell: 'Otro',
  'leverage machine': 'Máquina',
  'medicine ball': 'Otro',
  'stability ball': 'Otro',
  'smith machine': 'Máquina',
};

export interface RemoteExercise {
  id: string;
  name: string;
  bodyPart?: string;
  target?: string;
  primaryMuscles?: string[];
  equipment?: string;
  gifUrl?: string;
  images?: string[];
  instructions?: string[];
}

/**
 * Petición con reintentos automáticos en mirrors de CDN.
 */
async function fetchWithFallback(): Promise<RemoteExercise[]> {
  for (const url of ENDPOINTS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      console.warn(`[ExerciseAPI] Falló la conexión con ${url}`);
    }
  }
  throw new Error('Todos los endpoints de ejercicios fallaron.');
}

/**
 * Transforma y normaliza la respuesta remota al modelo interno del sistema.
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    const data = await fetchWithFallback();

    return data.map((item) => {
      // 1. Normalización de URL de la imagen principal (.jpg / .gif)
      let gifUrl = '';
      if (item.images && item.images.length > 0) {
        gifUrl = `${BASE_CDN_URL}${item.images[0]}`;
      } else if (item.gifUrl) {
        gifUrl = item.gifUrl.startsWith('http')
          ? item.gifUrl
          : `${BASE_CDN_URL}${item.gifUrl.replace(/^\/?(exercises\/)?/, '')}`;
      }

      // 2. Traducción de grupo muscular basado en el músculo primario
      const primaryMuscle = item.primaryMuscles?.[0]?.toLowerCase();
      const muscleGroup =
        (primaryMuscle && MUSCLE_GROUP_TRANSLATIONS[primaryMuscle]) ||
        MUSCLE_GROUP_TRANSLATIONS[item.bodyPart?.toLowerCase() || ''] ||
        MUSCLE_GROUP_TRANSLATIONS[item.target?.toLowerCase() || ''] ||
        'Otro';

      // 3. Traducción de equipamiento
      const equipmentKey = item.equipment?.toLowerCase() || '';
      const equipment = EQUIPMENT_TRANSLATIONS[equipmentKey] || 'Otro';

      return {
        apiId: item.id,
        name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        muscleGroup,
        equipment,
        gifUrl,
        instructions: item.instructions || [],
      };
    });
  } catch (error) {
    console.error('[ExerciseAPI] Error al cargar ejercicios:', error);
    return [];
  }
}
