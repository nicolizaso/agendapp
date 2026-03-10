import { useState } from 'react';
import { useHabits } from '../../../hooks/useHabits';
import { useStore } from '../../../lib/store';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { cn } from '../../../lib/utils';
import { Check } from 'lucide-react';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-neutral-500',
];

export function CreateHabitModal({ isOpen, onClose }: CreateHabitModalProps) {
  const { addHabit } = useHabits();
  const { categories } = useStore();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [categoryId, setCategoryId] = useState(categories.length > 0 ? categories[0].id : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId) return;

    await addHabit({
      title,
      emoji: emoji || '⚡',
      color: selectedColor,
      categoryId,
    });

    setTitle('');
    setEmoji('');
    setSelectedColor(COLORS[0]);
    if (categories.length > 0) setCategoryId(categories[0].id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Hábito">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title & Emoji Row */}
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-200 mb-1">Título</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-md p-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-neutral-700"
                    placeholder="Ej: Leer 10 págs"
                    required
                    autoFocus
                />
            </div>
            <div className="w-20">
                <label className="block text-sm font-medium text-neutral-200 mb-1">Emoji</label>
                <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    maxLength={2}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-md p-3 text-center text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-neutral-700"
                    placeholder="📚"
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-neutral-200 mb-1">Categoría</label>
            <CustomSelect
                value={categoryId}
                onChange={setCategoryId}
                options={categories.map(c => ({ value: c.id, label: c.label }))}
                placeholder="Seleccionar categoría..."
            />
        </div>

        {/* Color Picker */}
        <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Color</label>
            <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            color,
                            selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-950 scale-110" : "opacity-70 hover:opacity-100"
                        )}
                    >
                        {selectedColor === color && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex justify-end pt-2">
            <Button type="submit">Crear Hábito</Button>
        </div>
      </form>
    </Modal>
  );
}
