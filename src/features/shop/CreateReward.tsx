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
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(50);
  const [icon, setIcon] = useState('Gift');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    await addReward({ title, cost, icon });
    setTitle('');
    setCost(50);
    setIcon('Gift');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconPreview = (Icons as any)[icon] || Icons.Gift;

  return (
    <Card className="mb-8 border-slate-700 bg-slate-800/50">
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

          <div className="grid gap-2 w-full sm:w-24">
            <Label htmlFor="reward-cost">Cost</Label>
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
                    <IconPreview className="w-4 h-4 text-slate-400" />
                </div>
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto">Add</Button>
        </form>
      </CardContent>
    </Card>
  );
}
