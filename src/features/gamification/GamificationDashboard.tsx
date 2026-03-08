import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useTicketWallet } from '../../lib/gamificationEngine';
import { Button } from '../../components/Button';
import { Trophy, Plus, Lock, Trash2, Edit2, Ticket, Wallet } from 'lucide-react';
import { IconResolver, AVAILABLE_ICONS } from '../../lib/categoryUtils';
import { cn } from '../../lib/utils';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { getIconComponent } from '../../lib/categoryUtils';
import { toast } from 'sonner';
import type { Reward } from '../../types';

export function GamificationDashboard() {
  const { tasks, rewardClaims, categories, rewards, addReward, updateReward, deleteReward, claimReward, habitClaims } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const defaultCategory = categories.length > 0 ? categories[0].id : '';
  const [formData, setFormData] = useState({ title: '', costs: [{ categoryId: defaultCategory, amount: 1 }], icon: AVAILABLE_ICONS[0] });

  const wallet = useTicketWallet(tasks, rewardClaims, habitClaims, categories);
  const sortedRewards = [...rewards].sort((a, b) => (a.costs[0]?.amount || 0) - (b.costs[0]?.amount || 0));

  const handleSaveReward = () => {
    if (editingReward) {
      updateReward(editingReward.id, formData);
    } else {
      addReward({
        id: crypto.randomUUID(),
        ...formData
      });
    }
    setIsCreating(false);
    setEditingReward(null);
  };

  const handleAddCost = () => {
    setFormData({ ...formData, costs: [...formData.costs, { categoryId: defaultCategory, amount: 1 }] });
  };

  const handleRemoveCost = (index: number) => {
    setFormData({ ...formData, costs: formData.costs.filter((_, i) => i !== index) });
  };

  const handleCostChange = (index: number, field: 'categoryId' | 'amount', value: string | number) => {
    const newCosts = [...formData.costs];
    newCosts[index] = { ...newCosts[index], [field]: value as never };
    setFormData({ ...formData, costs: newCosts });
  };

  const handleClaim = (reward: Reward) => {
    claimReward(reward);
    toast.success(`¡Premio canjeado con éxito! Disfruta de: ${reward.title}`);
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.label,
    icon: getIconComponent(cat.icon),
    colorClass: cat.color,
    bgClass: cat.bg
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24 md:pb-8">

      {/* Header & Stats - Billetera */}
      <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-white">Mi Billetera</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {wallet.filter(b => b.earned > 0).map(balance => (
            <div
              key={balance.category.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border border-neutral-800/50 bg-neutral-950/50"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", balance.category.bg, balance.category.color)}>
                <IconResolver iconName={balance.category.icon} size={20} />
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-400">{balance.category.label}</div>
                <div className="text-xl font-bold text-white flex items-center gap-1">
                  {balance.available} <Ticket className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
            </div>
          ))}

          {wallet.filter(b => b.earned > 0).length === 0 && (
            <div className="text-neutral-500 italic py-2">
              Aún no has ganado tickets. Completa tareas para empezar a ahorrar.
            </div>
          )}
        </div>
      </div>

      {/* Rewards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Mis Premios</h3>
          <Button onClick={() => {
            setFormData({ title: '', costs: [{ categoryId: defaultCategory, amount: 1 }], icon: AVAILABLE_ICONS[0] });
            setIsCreating(true);
            setEditingReward(null);
          }} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Premio
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedRewards.map(reward => {
            const canAfford = reward.costs.every(c => {
              const catWallet = wallet.find(w => w.category.id === c.categoryId);
              return (catWallet?.available || 0) >= c.amount;
            });

            return (
              <div
                key={reward.id}
                className={cn(
                  "flex flex-col relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden group",
                  canAfford
                    ? "bg-neutral-900 border-yellow-500/30 hover:border-yellow-500/50"
                    : "bg-neutral-950 border-neutral-800 opacity-80"
                )}
              >
                {/* Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => {
                      setEditingReward(reward);
                      setFormData({ title: reward.title, costs: reward.costs, icon: reward.icon || AVAILABLE_ICONS[0] });
                      setIsCreating(true);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Seguro que quieres borrar este premio?")) {
                        deleteReward(reward.id);
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center text-center gap-3 mb-4 mt-2">
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center relative",
                    canAfford ? "bg-yellow-500/20 text-yellow-500" : "bg-neutral-800 text-neutral-500 grayscale"
                  )}>
                    {reward.icon ? (
                       <IconResolver iconName={reward.icon} size={28} />
                    ) : (
                       <Trophy className="w-7 h-7" />
                    )}

                    {!canAfford && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className={cn("font-semibold text-lg mb-1 leading-tight", canAfford ? "text-white" : "text-neutral-400")}>
                      {reward.title}
                    </h4>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                      {reward.costs.map((cost, idx) => {
                        const rewardCategory = categories.find(c => c.id === cost.categoryId);
                        return (
                          <span key={idx} className={cn(
                            "text-sm font-medium px-2.5 py-1 rounded-md inline-flex items-center gap-1.5",
                            canAfford ? "bg-yellow-500/10 text-yellow-500" : "bg-neutral-800 text-neutral-500"
                          )}>
                            {cost.amount} <Ticket className="w-3.5 h-3.5" />
                            <span className="text-xs opacity-80">de {rewardCategory?.label || 'Categoría'}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {canAfford && (
                    <div className="absolute -right-4 -bottom-4 opacity-10 blur-xl pointer-events-none">
                      <div className="w-24 h-24 rounded-full bg-yellow-500" />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800 mt-auto">
                    <Button
                        onClick={() => handleClaim(reward)}
                        disabled={!canAfford}
                        className="w-full"
                        variant={canAfford ? 'primary' : 'ghost'}
                    >
                        {canAfford ? 'Canjear' : 'Tickets insuficientes'}
                    </Button>
                </div>
              </div>
            );
          })}
          {sortedRewards.length === 0 && (
            <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
              Aún no has creado premios. ¡Crea el primero!
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingReward ? 'Editar Premio' : 'Nuevo Premio'}
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Título del Premio</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                    placeholder="Ej: Salida al cine"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Costos (Tickets)</label>
                    {formData.costs.map((cost, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <CustomSelect
                              value={cost.categoryId}
                              onChange={(val) => handleCostChange(index, 'categoryId', val || '')}
                              placeholder="Categoría..."
                              options={categoryOptions}
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            value={cost.amount}
                            onChange={e => handleCostChange(index, 'amount', parseInt(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                            min="1"
                          />
                        </div>
                        {formData.costs.length > 1 && (
                          <button type="button" className="p-2.5 text-neutral-500 hover:text-red-400 bg-neutral-950 border border-neutral-800 rounded-lg hover:border-red-400/50 transition-colors" onClick={() => handleRemoveCost(index)}>
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button type="button" variant="ghost" className="w-full border border-dashed border-neutral-800 text-sm gap-2 text-neutral-400 hover:text-white hover:border-neutral-700" onClick={handleAddCost}>
                        <Plus className="w-4 h-4" /> Agregar otro ticket
                      </Button>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Icono</label>
                  <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-800">
                    {AVAILABLE_ICONS.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={cn(
                          "p-2 rounded-md flex items-center justify-center transition-all",
                          formData.icon === iconName
                            ? "bg-yellow-500/20 border border-yellow-500 text-yellow-500"
                            : "bg-neutral-950 border border-transparent text-neutral-400 hover:bg-neutral-800"
                        )}
                      >
                        <IconResolver iconName={iconName} size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => {
                  setIsCreating(false);
                  setEditingReward(null);
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveReward}
                  disabled={!formData.title.trim() || !formData.costs.every(c => c.categoryId && c.amount > 0)}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
