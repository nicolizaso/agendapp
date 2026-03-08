import { useStore } from '../../lib/store';
import { Card, CardFooter, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Coins, Ticket } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useTicketWallet } from '../../lib/gamificationEngine';
import { cn } from '../../lib/utils';

export function RewardList() {
    const { rewards, tasks, rewardClaims, categories, claimReward } = useStore();
    const wallet = useTicketWallet(tasks, rewardClaims, categories);

    if (rewards.length === 0) {
        return <div className="text-center text-neutral-400 py-10">No hay recompensas disponibles. ¡Añade una!</div>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
                // Dynamic icon lookup (fallback to Gift)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const iconName = reward.icon || 'Gift';
                const IconComponent = (Icons as any)[iconName] || Icons.Gift;

                const canAfford = reward.costs.every(c => {
                  const catWallet = wallet.find(w => w.category.id === c.categoryId);
                  return (catWallet?.available || 0) >= c.amount;
                });

                return (
                    <Card key={reward.id} className="bg-neutral-900 border-neutral-800 flex flex-col justify-between transition-colors hover:border-neutral-700/50">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-neutral-200">{reward.title}</CardTitle>
                                <IconComponent className="w-6 h-6 text-neutral-400" />
                             </div>
                        </CardHeader>
                        <CardFooter className="pt-4 flex-col items-stretch gap-2">
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {reward.costs.map((cost, idx) => {
                                    const cat = categories.find(c => c.id === cost.categoryId);
                                    return (
                                        <span key={idx} className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1",
                                            canAfford ? "bg-yellow-500/10 text-yellow-500" : "bg-neutral-800 text-neutral-500"
                                        )}>
                                            {cost.amount} <Ticket className="w-3 h-3" /> {cat?.label}
                                        </span>
                                    );
                                })}
                            </div>
                            <Button
                                className="w-full justify-between group"
                                variant={canAfford ? 'primary' : 'secondary'}
                                disabled={!canAfford}
                                onClick={() => reward.id && claimReward(reward)}
                            >
                                <span className="group-hover:hidden">Reclamar</span>
                                <span className="hidden group-hover:inline">Confirmar</span>
                                <span className="flex items-center">
                                    Canjear
                                </span>
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
