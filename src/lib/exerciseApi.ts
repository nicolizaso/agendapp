import type { Exercise } from '../types';

// GitHub Pages sirve el contenido de 'dist' en la raíz '/'
const PRIMARY_URL = 'https://yuhonas.github.io/free-exercise-db/exercises.json';
const FALLBACK_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const BASE_IMG_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

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
 * Consulta la base de datos externa de ejercicios con retry en CDN secundario.
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    let response = await fetch(PRIMARY_URL);

    // Si la fuente principal responde con error, intentamos con el CDN de respaldo
    if (!response.ok) {
      console.warn(`[ExerciseAPI] Falló URL principal (${response.status}). Probando CDN de respaldo...`);
      response = await fetch(FALLBACK_URL);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
    }

    const data: RemoteExercise[] = await response.json();

    return data.map((item) => {
      let gifUrl = item.gifUrl;
      if (gifUrl && !gifUrl.startsWith('http')) {
        const path = gifUrl.startsWith('/') ? gifUrl.substring(1) : gifUrl;
        gifUrl = path.startsWith('exercises/')
          ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/${path}`
          : `${BASE_IMG_URL}${path}`;
      }

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
        instructions: item.instructions,
      };
    });
  } catch (error) {
    console.error('Error fetching external exercises:', error);
    return [];
  }
}