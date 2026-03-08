import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Label } from '../../components/Label';
import { Select } from '../../components/Select';
import * as Icons from 'lucide-react';

const AVAILABLE_ICONS = ['Coffee', 'Gamepad2', 'Tv', 'ShoppingBag', 'Beer', 'Pizza', 'Plane', 'Music', 'Gift', 'Book', 'Smartphone', 'Zap', 'Star', 'Heart'];

export function CreateReward() {
  const addReward = useStore((state) => state.addReward);
  const categories = useStore((state) => state.categories);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(1);
  const [icon, setIcon] = useState('Gift');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId) return;
    await addReward({ id: crypto.randomUUID(), title, cost, categoryId, icon });
    setTitle('');
    setCost(1);
    setIcon('Gift');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconPreview = (Icons as any)[icon] || Icons.Gift;

  return (
    <Card className="mb-8 border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <CardTitle>Add New Reward</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
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

          <div className="grid gap-2 w-full sm:w-32">
            <Label htmlFor="reward-category">Categoría</Label>
            <Select
              id="reward-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2 w-full sm:w-24">
            <Label htmlFor="reward-cost">Costo</Label>
            <Input
                id="reward-cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                min={1}
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

          <Button type="submit" className="w-full sm:w-auto">Add</Button>
        </form>
      </CardContent>
    </Card>
  );
}
