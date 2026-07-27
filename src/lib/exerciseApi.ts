import type { Exercise } from '../types';

// Endpoints mirror ordenados por confiabilidad (CDNs optimizados para GitHub)
const ENDPOINTS = [
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json',
  'https://cdn.statically.io/gh/yuhonas/free-exercise-db/main/dist/exercises.json',
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
  '/exercises.json' // Fallback local dentro de public/
];

const BASE_IMG_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

const MUSCLE_GROUP_TRANSLATIONS: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Piernas',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core',
  abs: 'Core',
  cardio: 'Cardio',
  'upper legs': 'Piernas',
  'lower legs': 'Piernas',
  'upper arms': 'Bíceps',
  'lower arms': 'Bíceps',
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
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
  instructions: string[];
}

/**
 * Realiza un fetch iterando por los distintos CDNs hasta encontrar uno funcional.
 */
async function fetchWithFallback(): Promise<RemoteExercise[]> {
  for (const url of ENDPOINTS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      console.warn(`[ExerciseAPI] ${url} respondió con estado ${response.status}`);
    } catch (error) {
      console.warn(`[ExerciseAPI] Falló la conexión con ${url}`);
    }
  }
  throw new Error('Todos los endpoints de ejercicios fallaron.');
}

/**
 * Obtiene y mapea los ejercicios externos al formato de la app.
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    const data = await fetchWithFallback();

    return data.map((item) => {
      // Normalización de la URL del GIF
      let gifUrl = item.gifUrl;
      if (gifUrl && !gifUrl.startsWith('http')) {
        const path = gifUrl.startsWith('/') ? gifUrl.substring(1) : gifUrl;
        gifUrl = path.startsWith('exercises/')
          ? `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/${path}`
          : `${BASE_IMG_URL}${path}`;
      }

      // Traducciones y fallbacks
      const muscleGroup =
        MUSCLE_GROUP_TRANSLATIONS[item.bodyPart?.toLowerCase()] ||
        MUSCLE_GROUP_TRANSLATIONS[item.target?.toLowerCase()] ||
        'Otro';

      const equipment = EQUIPMENT_TRANSLATIONS[item.equipment?.toLowerCase()] || 'Otro';

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
    console.error('[ExerciseAPI] Error crítico al cargar ejercicios externos:', error);
    return [];
  }
}