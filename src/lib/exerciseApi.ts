import type { Exercise } from '../types';

// 🔴 URL Anterior (Causaba 404):
// const JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

// 🟢 URL Corregida (GitHub Pages):
const JSON_URL = 'https://yuhonas.github.io/free-exercise-db/dist/exercises.json';
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
  'assisted': 'Máquina',
  'band': 'Otro',
  'kettlebell': 'Otro',
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
 * Obtiene el listado de ejercicios externos desde el CDN de GitHub Pages.
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    const response = await fetch(JSON_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
    }
    const data: RemoteExercise[] = await response.json();

    return data.map((item) => {
      let gifUrl = item.gifUrl;
      if (gifUrl && !gifUrl.startsWith('http')) {
        const path = gifUrl.startsWith('/') ? gifUrl.substring(1) : gifUrl;
        if (path.startsWith('exercises/')) {
          gifUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/${path}`;
        } else {
          gifUrl = `${BASE_IMG_URL}${path}`;
        }
      }

      const muscleGroup = MUSCLE_GROUP_TRANSLATIONS[item.bodyPart?.toLowerCase()] ||
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