import { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { calculateGoldReward } from '../../lib/economy';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Label } from '../../components/Label';
import { Select } from '../../components/Select';
import type { Effort } from '../../types';

export function TaskCreator() {
  const addTask = useStore((state) => state.addTask);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  const [effort, setEffort] = useState<Effort>('LOW');

  const projectedGold = useMemo(() => calculateGoldReward(duration, effort), [duration, effort]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    await addTask({ title, durationMinutes: duration, effort });
    setTitle('');
    setDuration(15);
    setEffort('LOW');
  };

  return (
    <Card className="mb-8 border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle>Create New Mission</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Mission Title</Label>
            <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Project Alpha"
                required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                >
                    {[15, 30, 45, 60, 90, 120, 180, 240].map(m => (
                        <option key={m} value={m}>{m} min</option>
                    ))}
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="effort">Effort Level</Label>
                <Select
                    id="effort"
                    value={effort}
                    onChange={(e) => setEffort(e.target.value as Effort)}
                >
                    <option value="LOW">Low (1.0x)</option>
                    <option value="MEDIUM">Medium (1.5x)</option>
                    <option value="HIGH">High (2.5x)</option>
                </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-slate-400">
                Reward: <span className="text-gold-400 font-bold text-lg ml-1">+{projectedGold} Gold</span>
            </div>
            <Button type="submit" disabled={!title}>
                Add Mission
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
