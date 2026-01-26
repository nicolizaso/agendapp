import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { useStore } from '../../lib/store';
import { Coins, Trophy, Zap } from 'lucide-react';

export function StatsCard() {
  const { userStats } = useStore();
  const xpForNextLevel = 1000;
  const currentLevelXp = userStats.currentXp % xpForNextLevel;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
       {/* Gold */}
       <Card className="border-rose-700/20 bg-rose-900/50">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium text-stone-200">Total Gold</CardTitle>
           <Coins className="h-4 w-4 text-rose-400" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold text-stone-100">{userStats.currentGold}</div>
           <p className="text-xs text-rose-300">Available to spend</p>
         </CardContent>
       </Card>

       {/* Level */}
       <Card className="bg-rose-900/50">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium text-stone-200">Level</CardTitle>
           <Trophy className="h-4 w-4 text-rose-400" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold text-stone-100">{userStats.level}</div>
           <p className="text-xs text-rose-300">Keep growing!</p>
         </CardContent>
       </Card>

       {/* XP */}
       <Card className="bg-rose-900/50">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium text-stone-200">Experience</CardTitle>
           <Zap className="h-4 w-4 text-rose-400" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold text-stone-100">{userStats.currentXp} XP</div>
            <div className="w-full bg-rose-800 rounded-full h-2.5 mt-2 overflow-hidden">
                <div className="bg-rose-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
            </div>
           <p className="text-xs text-rose-300 mt-1">{Math.round(xpProgress)}% to next level</p>
         </CardContent>
       </Card>
    </div>
  );
}
