import { useState } from 'react';
import { useStore } from '../../../lib/store';
import { useTicketWallet } from '../../../lib/gamificationEngine';
import { db } from '../../../lib/db';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { getIconComponent } from '../../../lib/categoryUtils';
import { Minus, Plus, Ticket } from 'lucide-react';

interface TicketExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TicketExchangeModal({ isOpen, onClose }: TicketExchangeModalProps) {
  const { tasks, rewardClaims, habitClaims, categories } = useStore();
  const wallet = useTicketWallet(tasks, rewardClaims, habitClaims, categories);

  const [paymentSelection, setPaymentSelection] = useState<Record<string, number>>({});
  const [destCategory, setDestCategory] = useState<string>('');

  if (!isOpen) return null;

  const totalSelected = Object.values(paymentSelection).reduce((acc, val) => acc + val, 0);

  const handleIncrement = (categoryId: string, available: number) => {
    if (totalSelected >= 5) return;
    const current = paymentSelection[categoryId] || 0;
    if (current >= available) return;

    setPaymentSelection({
      ...paymentSelection,
      [categoryId]: current + 1
    });
  };

  const handleDecrement = (categoryId: string) => {
    const current = paymentSelection[categoryId] || 0;
    if (current <= 0) return;

    setPaymentSelection({
      ...paymentSelection,
      [categoryId]: current - 1
    });
  };

  const handleExchange = async () => {
    if (totalSelected !== 5 || !destCategory) return;

    const exchangeId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Convertir la selección de pago a un array de costos
    const costs = Object.entries(paymentSelection)
      .filter(([_, amount]) => amount > 0)
      .map(([categoryId, amount]) => ({ categoryId, amount }));

    // 2. Deducir los 5 tickets mixtos (Gasto fantasma)
    await db.rewardClaims.add({
      id: `deduct_${exchangeId}`,
      rewardId: 'ticket_exchange',
      claimedAt: now,
      costs: costs
    });

    // 3. Sumar 1 ticket elegido (Ingreso fantasma)
    await db.habitClaims.add({
      id: `income_${exchangeId}`,
      weekStartDate: now, // We use 'now' as dummy for generic claims since we need weekStartDate prop
      claimedAt: now,
      earnedTickets: [{ categoryId: destCategory, amount: 1 }]
    });

    // 4. Recargar store
    const updatedRewardClaims = await db.rewardClaims.toArray();
    const updatedHabitClaims = await db.habitClaims.toArray();
    useStore.setState({ rewardClaims: updatedRewardClaims, habitClaims: updatedHabitClaims });

    // Reset UI and close
    setPaymentSelection({});
    setDestCategory('');
    onClose();
  };

  const availableCategories = wallet.filter(b => b.available > 0);

  const destOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.label,
    icon: getIconComponent(cat.icon),
    colorClass: cat.color,
    bgClass: cat.bg
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Canje de Tickets">
      <div className="space-y-6">
        {/* Paso 1: Pago */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center justify-between">
            <span>Paso 1: Elige 5 tickets para pagar</span>
            <span className={totalSelected === 5 ? "text-green-500" : "text-neutral-400"}>
              ({totalSelected}/5)
            </span>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {availableCategories.length === 0 ? (
              <p className="text-sm text-neutral-500 italic">No tienes tickets disponibles para canjear.</p>
            ) : (
              availableCategories.map(b => {
                const currentSelected = paymentSelection[b.category.id] || 0;
                const IconComp = getIconComponent(b.category.icon);
                return (
                  <div key={b.category.id} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
                    <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full shadow-md font-bold text-white border border-white/20 ${b.category.bg} ${b.category.color}`}>
                      <IconComp size={16} />
                      <div className="flex items-center gap-1 text-sm">
                        {b.available}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-neutral-950 rounded-lg p-1 border border-neutral-800">
                      <button
                        onClick={() => handleDecrement(b.category.id)}
                        disabled={currentSelected <= 0}
                        className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-bold text-white text-sm">{currentSelected}</span>
                      <button
                        onClick={() => handleIncrement(b.category.id, b.available)}
                        disabled={totalSelected >= 5 || currentSelected >= b.available}
                        className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Paso 2: Recibo */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Paso 2: Elige 1 ticket para recibir</h3>
          <CustomSelect
            value={destCategory}
            onChange={(val) => setDestCategory(val || '')}
            options={destOptions}
            placeholder="Selecciona categoría de destino..."
          />
        </div>

        {/* Accion */}
        <div className="pt-4 border-t border-neutral-800">
          <Button
            className="w-full py-6 text-lg"
            onClick={handleExchange}
            disabled={totalSelected !== 5 || !destCategory}
            variant={(totalSelected === 5 && destCategory) ? 'primary' : 'secondary'}
          >
            Efectuar Canje
          </Button>
        </div>
      </div>
    </Modal>
  );
}
