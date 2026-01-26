import { useStore } from '../../lib/store';
import { Card, CardFooter, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Coins } from 'lucide-react';
import * as Icons from 'lucide-react';

export function RewardList() {
    const { rewards, userStats, buyReward } = useStore();

    if (rewards.length === 0) {
        return <div className="text-center text-slate-500 py-10">No rewards available. Add one above!</div>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
                // Dynamic icon lookup (fallback to Gift)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const IconComponent = (Icons as any)[reward.icon] || Icons.Gift;
                const canAfford = userStats.currentGold >= reward.cost;

                return (
                    <Card key={reward.id} className="bg-slate-800 border-slate-700 flex flex-col justify-between transition-colors hover:border-gold-500/50">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-slate-100">{reward.title}</CardTitle>
                                <IconComponent className="w-6 h-6 text-slate-400" />
                             </div>
                        </CardHeader>
                        <CardFooter className="pt-4">
                            <Button
                                className="w-full justify-between group"
                                variant={canAfford ? 'primary' : 'secondary'}
                                disabled={!canAfford}
                                onClick={() => reward.id && buyReward(reward.id)}
                            >
                                <span className="group-hover:hidden">Buy</span>
                                <span className="hidden group-hover:inline">Confirm</span>
                                <span className="flex items-center">
                                    {reward.cost} <Coins className="w-4 h-4 ml-1" />
                                </span>
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
