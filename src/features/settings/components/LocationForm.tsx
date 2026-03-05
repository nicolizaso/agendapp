import { useState } from 'react';
import { useStore } from '../../../lib/store';
import { Button } from '../../../components/Button';
import type { Location } from '../../../types';

interface LocationFormProps {
  initialData?: Location;
  onCancel: () => void;
  onComplete: () => void;
}

export function LocationForm({ initialData, onCancel, onComplete }: LocationFormProps) {
  const { addLocation, updateLocation } = useStore();
  const [formData, setFormData] = useState<Omit<Location, 'id'>>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    floor: initialData?.floor || '',
    apt: initialData?.apt || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
      return; // Basic validation
    }

    if (initialData?.id) {
      updateLocation(initialData.id, formData);
    } else {
      addLocation({
        id: crypto.randomUUID(),
        ...formData
      });
    }

    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-neutral-200 mb-4">
        {initialData ? 'Editar Lugar' : 'Nuevo Lugar'}
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Nombre del Lugar <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            placeholder="Ej: Oficina, Casa de Mamá"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            placeholder="Ej: Av. Siempreviva 742"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Piso
            </label>
            <input
              type="text"
              value={formData.floor}
              onChange={e => setFormData({ ...formData, floor: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
              placeholder="Ej: 3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Dpto / Oficina
            </label>
            <input
              type="text"
              value={formData.apt}
              onChange={e => setFormData({ ...formData, apt: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
              placeholder="Ej: B"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Información Adicional / Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none h-20"
            placeholder="Ej: Tocar timbre dos veces..."
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-neutral-200 text-neutral-900 hover:bg-white"
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
