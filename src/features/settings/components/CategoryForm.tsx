import { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { AVAILABLE_ICONS, AVAILABLE_COLORS, IconResolver } from '../../../lib/categoryUtils';
import { cn } from '../../../lib/utils';
import type { Category } from '../../../types';

interface CategoryFormProps {
  initialData?: Category | null;
  onSave: (categoryData: Omit<Category, 'id'>) => void;
  onCancel: () => void;
}

export function CategoryForm({ initialData, onSave, onCancel }: CategoryFormProps) {
  const [label, setLabel] = useState(initialData?.label ?? '');
  const [points, setPoints] = useState(initialData?.points ?? 10);
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon ?? AVAILABLE_ICONS[0]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(() => {
    if (initialData) {
      const colorIndex = AVAILABLE_COLORS.findIndex(c => c.color === initialData.color);
      return colorIndex >= 0 ? colorIndex : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label);
      setPoints(initialData.points ?? 10);
      setSelectedIcon(initialData.icon);
      const colorIndex = AVAILABLE_COLORS.findIndex(c => c.color === initialData.color);
      setSelectedColorIndex(colorIndex >= 0 ? colorIndex : 0);
    } else {
      setLabel('');
      setPoints(10);
      setSelectedIcon(AVAILABLE_ICONS[0]);
      setSelectedColorIndex(0);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const theme = AVAILABLE_COLORS[selectedColorIndex];
    onSave({
      label: label.trim(),
      icon: selectedIcon,
      color: theme.color,
      bg: theme.bg,
      border: theme.border,
      ring: theme.ring,
      points: points,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-1">Nombre de la Categoría</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2.5 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-600"
          placeholder="Ej: Proyectos"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Icono</label>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-neutral-700">
          {AVAILABLE_ICONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setSelectedIcon(iconName)}
              className={cn(
                "p-2 rounded-md flex items-center justify-center transition-all",
                selectedIcon === iconName
                  ? "bg-red-500/20 border border-red-500 text-red-400"
                  : "bg-neutral-800 border border-transparent text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              )}
            >
              <IconResolver iconName={iconName} size={20} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Color</label>
        <div className="flex flex-wrap gap-3">
          {AVAILABLE_COLORS.map((theme, idx) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => setSelectedColorIndex(idx)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                theme.bg,
                selectedColorIndex === idx ? `border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]` : "border-transparent"
              )}
              title={theme.name}
            >
               {/* Internal dot just to show color clearly */}
               <div className={cn("w-full h-full rounded-full opacity-50", theme.bg)} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Guardar Cambios' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
}
