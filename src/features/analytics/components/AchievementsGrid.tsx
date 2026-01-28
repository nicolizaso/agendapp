import type { Achievement } from '../utils/types';
import { AchievementCard } from './AchievementCard';

interface Props {
  achievements: Achievement[];
}

export function AchievementsGrid({ achievements }: Props) {
  // Sort: Unlocked first, then by title
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="w-full">
      <h3 className="text-xl font-heading font-bold text-neutral-100 mb-6 flex items-center gap-2">
        Logros & Medallas
        <span className="text-sm font-normal text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
          {achievements.filter(a => a.isUnlocked).length} / {achievements.length}
        </span>
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
