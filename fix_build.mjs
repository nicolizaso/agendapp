import fs from 'fs';

const activeWorkoutPath = 'src/features/gym/components/ActiveWorkout.tsx';
const exerciseCardPath = 'src/features/gym/components/ExerciseCard.tsx';

let activeWorkoutCode = fs.readFileSync(activeWorkoutPath, 'utf-8');
let exerciseCardCode = fs.readFileSync(exerciseCardPath, 'utf-8');

// 1. Fix ActiveWorkout.tsx Imports and unused variables
activeWorkoutCode = activeWorkoutCode.replace(
    /import \{ Timer, Check, Lightbulb, History, MoreHorizontal, ChevronUp, Plus, Search \} from 'lucide-react';/,
    "import { Timer, Plus, Search } from 'lucide-react';"
);

// Remove unused functions and variables in ActiveWorkout.tsx
activeWorkoutCode = activeWorkoutCode.replace(/const currentExerciseData = exercises\.find\(e => e\.id === currentSessionExercise\?\.exerciseId\);\n/g, '');
activeWorkoutCode = activeWorkoutCode.replace(/const cancelWorkout.*?\n/g, '');

activeWorkoutCode = activeWorkoutCode.replace(/cancelWorkout,/g, '');


activeWorkoutCode = activeWorkoutCode.replace(/const handleSetClick = \(setIndex: number\) => \{\s+if \('vibrate' in navigator\) navigator\.vibrate\(40\);\s+toggleSetComplete\(currentIdx, setIndex\);\s+\};\n/g, '');
activeWorkoutCode = activeWorkoutCode.replace(/const openSetEditor = \(setIndex: number\) => \{[\s\S]*?\};\n/g, '');
activeWorkoutCode = activeWorkoutCode.replace(/const nextExerciseData = nextExercise \? exercises\.find\(e => e\.id === nextExercise\.exerciseId\) : null;\n/g, '');


// 2. Fix ExerciseCard.tsx Imports and unused variables
exerciseCardCode = exerciseCardCode.replace(
    /import \{ Trash2, Plus, Check, ChevronDown, ChevronUp \} from 'lucide-react';/,
    "import { Check, Lightbulb, History as HistoryIcon, MoreHorizontal } from 'lucide-react';"
);

exerciseCardCode = exerciseCardCode.replace(
    /import \{ Button \} from '\.\.\/\.\.\/\.\.\/components\/Button';\n/,
    ""
);

exerciseCardCode = exerciseCardCode.replace(
    /import \{ cn \} from '\.\.\/\.\.\/\.\.\/lib\/utils';\n/,
    ""
);

// Remove unused destructured variables
exerciseCardCode = exerciseCardCode.replace(
    /updateSet,\n\s*toggleSetComplete,\n\s*addSet,\n\s*removeSet,\n/,
    ""
);

exerciseCardCode = exerciseCardCode.replace(
    /calculate1RM\n/,
    ""
);


// Fix <History /> to <HistoryIcon />
exerciseCardCode = exerciseCardCode.replace(/<History className="w-4 h-4" \/>/g, '<HistoryIcon className="w-4 h-4" />');


fs.writeFileSync(activeWorkoutPath, activeWorkoutCode);
fs.writeFileSync(exerciseCardPath, exerciseCardCode);
console.log("Files updated for build.");
