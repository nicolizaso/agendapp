import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Label } from '../../components/Label';
import { Select } from '../../components/Select';
import * as Icons from 'lucide-react';
import { Trash2, Plus } from 'lucide-react';

const AVAILABLE_ICONS = ['Coffee', 'Gamepad2', 'Tv', 'ShoppingBag', 'Beer', 'Pizza', 'Plane', 'Music', 'Gift', 'Book', 'Smartphone', 'Zap', 'Star', 'Heart'];

export function CreateReward() {
  const addReward = useStore((state) => state.addReward);
  const categories = useStore((state) => state.categories);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('Gift');
  const [costs, setCosts] = useState<{ categoryId: string; amount: number }[]>([{ categoryId: categories[0]?.id || '', amount: 1 }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValidCosts = costs.every(c => c.categoryId && c.amount > 0);
    if (!title || !isValidCosts) return;
    await addReward({ id: crypto.randomUUID(), title, costs, icon });
    setTitle('');
    setCosts([{ categoryId: categories[0]?.id || '', amount: 1 }]);
    setIcon('Gift');
  };

  const handleAddCost = () => {
    setCosts([...costs, { categoryId: categories[0]?.id || '', amount: 1 }]);
  };

  const handleRemoveCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const handleCostChange = (index: number, field: 'categoryId' | 'amount', value: string | number) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], [field]: value as never };
    setCosts(newCosts);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconPreview = (Icons as any)[icon] || Icons.Gift;

  return (
    <Card className="mb-8 border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <CardTitle>Add New Reward</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="reward-title">Title</Label>
              <Input
                  id="reward-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cheat Meal"
                  required
              />
            </div>

            <div className="grid gap-2 w-full sm:w-40">
              <Label htmlFor="reward-icon">Icon</Label>
              <div className="relative">
                  <Select
                      id="reward-icon"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="pl-9"
                  >
                      {AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </Select>
                  <div className="absolute left-2 top-2.5 pointer-events-none">
                      <IconPreview className="w-4 h-4 text-neutral-400" />
                  </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Costos (Tickets)</Label>
            {costs.map((cost, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Select
                    value={cost.categoryId}
                    onChange={(e) => handleCostChange(index, 'categoryId', e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecciona categoría...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="w-full sm:w-32">
                  <Input
                    type="number"
                    value={cost.amount}
                    onChange={(e) => handleCostChange(index, 'amount', Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
                {costs.length > 1 && (
                  <Button type="button" variant="ghost" onClick={() => handleRemoveCost(index)} className="px-3 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={handleAddCost} className="text-sm gap-2 mt-2 w-full border border-dashed border-neutral-700">
              <Plus className="w-4 h-4" /> Agregar otro ticket
            </Button>
          </div>

          <Button type="submit" className="w-full">Add Reward</Button>
        </form>
      </CardContent>
    </Card>
  );
}
