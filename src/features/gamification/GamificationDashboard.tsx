import { useState } from 'react';
import { useStore } from '../../lib/store';
import { calculateCurrentPoints } from '../../lib/gamificationEngine';
import { Button } from '../../components/Button';
import { Trophy, Plus, Lock, AlertTriangle, Settings2, Trash2, Edit2 } from 'lucide-react';
import { IconResolver, AVAILABLE_ICONS } from '../../lib/categoryUtils';
import { cn } from '../../lib/utils';
import type { Reward } from '../../types';

export function GamificationDashboard() {
  const { tasks, categories, gamificationSettings, rewards, addReward, updateReward, deleteReward, updateGamificationSettings, updateCategory } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [formData, setFormData] = useState({ title: '', pointsThreshold: 100, icon: AVAILABLE_ICONS[0] });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!gamificationSettings) return null;

  const currentPoints = calculateCurrentPoints(tasks, categories, gamificationSettings);

  const sortedRewards = [...rewards].sort((a, b) => a.pointsThreshold - b.pointsThreshold);

  const nextReward = sortedRewards.find(r => r.pointsThreshold > currentPoints);

  let progressPercentage = 100;
  if (nextReward) {
    const previousRewardThreshold = sortedRewards.reverse().find(r => r.pointsThreshold <= currentPoints)?.pointsThreshold || 0;
    const pointsNeeded = nextReward.pointsThreshold - previousRewardThreshold;
    const pointsGained = currentPoints - previousRewardThreshold;
    progressPercentage = Math.min(100, Math.max(0, (pointsGained / pointsNeeded) * 100));
    // restore the array back to ascending
    sortedRewards.reverse();
  }

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

  const handlePenaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    updateGamificationSettings({ penaltyPoints: val });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24 md:pb-8">

      {/* Header & Stats */}
      <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500/50">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{currentPoints} <span className="text-xl text-neutral-400 font-normal">pts</span></h2>
              <p className="text-neutral-400">Puntos Actuales Disponibles</p>
            </div>
          </div>

          <Button variant="ghost" onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="self-start md:self-auto gap-2">
            <Settings2 className="w-4 h-4" /> Configuración
          </Button>
        </div>

        {gamificationSettings.carryOverPoints < 0 && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-4 h-4" />
            <span>Arrastras una penalización de {Math.abs(gamificationSettings.carryOverPoints)} puntos de la semana anterior.</span>
          </div>
        )}

        {isSettingsOpen && (
          <div className="mt-6 pt-6 border-t border-neutral-800 animate-in slide-in-from-top-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Penalización por tarea no completada (pts)</label>
              <input
                type="number"
                value={gamificationSettings.penaltyPoints}
                onChange={handlePenaltyChange}
                className="w-32 bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-4">Puntos por Categoría</label>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between bg-neutral-950/50 p-3 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", category.bg, category.color)}>
                        <IconResolver iconName={category.icon} size={16} />
                      </div>
                      <span className="text-neutral-200 font-medium">{category.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={category.points ?? 10}
                        onChange={(e) => updateCategory(category.id, { points: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-neutral-900 border border-neutral-700 rounded-md p-1.5 text-center text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                        min="0"
                      />
                      <span className="text-sm text-neutral-500">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {nextReward && (
        <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-400">Próximo Premio</p>
              <h3 className="text-lg font-semibold text-white">{nextReward.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm text-neutral-400">Faltan {nextReward.pointsThreshold - currentPoints} pts</span>
            </div>
          </div>
          <div className="h-4 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Rewards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Mis Premios</h3>
          <Button onClick={() => {
            setFormData({ title: '', pointsThreshold: 100, icon: AVAILABLE_ICONS[0] });
            setIsCreating(true);
            setEditingReward(null);
          }} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Premio
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedRewards.map(reward => {
            const isUnlocked = currentPoints >= reward.pointsThreshold;
            return (
              <div
                key={reward.id}
                className={cn(
                  "relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden group",
                  isUnlocked
                    ? "bg-neutral-900 border-yellow-500/30 hover:border-yellow-500/50"
                    : "bg-neutral-950 border-neutral-800 opacity-70 grayscale"
                )}
              >
                {/* Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => {
                      setEditingReward(reward);
                      setFormData({ title: reward.title, pointsThreshold: reward.pointsThreshold, icon: reward.icon || AVAILABLE_ICONS[0] });
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

                <div className="flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center relative",
                    isUnlocked ? "bg-yellow-500/20 text-yellow-500" : "bg-neutral-800 text-neutral-500"
                  )}>
                    {reward.icon ? (
                       <IconResolver iconName={reward.icon} size={24} />
                    ) : (
                       <Trophy className="w-6 h-6" />
                    )}

                    {!isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                        <Lock className="w-3 h-3 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className={cn("font-semibold mb-1", isUnlocked ? "text-white" : "text-neutral-400")}>
                      {reward.title}
                    </h4>
                    <span className={cn(
                      "text-sm font-medium px-2.5 py-0.5 rounded-full inline-block",
                      isUnlocked ? "bg-yellow-500/10 text-yellow-500" : "bg-neutral-800 text-neutral-500"
                    )}>
                      {reward.pointsThreshold} pts
                    </span>
                  </div>

                  {isUnlocked && (
                    <div className="absolute -right-4 -bottom-4 opacity-10 blur-xl pointer-events-none">
                      <div className="w-24 h-24 rounded-full bg-yellow-500" />
                    </div>
                  )}
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

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Puntos Requeridos</label>
                  <input
                    type="number"
                    value={formData.pointsThreshold}
                    onChange={e => setFormData({ ...formData, pointsThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                    min="1"
                  />
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
                  disabled={!formData.title.trim() || formData.pointsThreshold <= 0}
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
