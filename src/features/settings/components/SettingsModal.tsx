import { useRef, useState } from 'react';
import { useUIStore } from '../../../hooks/useUIStore';
import { useStore } from '../../../lib/store';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { exportData, importData } from '../../backup/utils/backup';
import { Cloud, Upload, AlertTriangle, Settings, Grid, Plus, Pencil, Trash2 } from 'lucide-react';
import { IconResolver } from '../../../lib/categoryUtils';
import { CategoryForm } from './CategoryForm';
import { cn } from '../../../lib/utils';
import type { Category } from '../../../types';

export function SettingsModal() {
  const { isSettingsModalOpen, closeSettingsModal, openConfirmDialog } = useUIStore();
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'categories'>('categories');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Confirmation before restore
      openConfirmDialog({
        title: '¿Estás seguro?',
        message: 'Al restaurar una copia de seguridad, se reemplazarán todas las tareas actuales. Esta acción no se puede deshacer.',
        variant: 'danger',
        onConfirm: () => {
           importData(file);
           closeSettingsModal();
        }
      });
      // Reset input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    openConfirmDialog({
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.label}"? Las tareas asociadas mantendrán el color temporalmente hasta que sean editadas.`,
      variant: 'danger',
      onConfirm: () => {
        deleteCategory(category.id);
      }
    });
  };

  const handleSaveCategory = (categoryData: Omit<Category, 'id'>) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      const id = categoryData.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `cat-${Date.now()}`;
      addCategory({ id, ...categoryData });
    }
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  return (
    <Modal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} title="Configuración">
      <div className="flex space-x-2 border-b border-neutral-800 pb-2 mb-4">
         <button
            onClick={() => { setActiveTab('categories'); setIsFormOpen(false); }}
            className={cn(
               "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
               activeTab === 'categories' ? "bg-neutral-800 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
            )}
         >
            <Grid className="w-4 h-4" />
            Categorías
         </button>
         <button
            onClick={() => { setActiveTab('general'); setIsFormOpen(false); }}
            className={cn(
               "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
               activeTab === 'general' ? "bg-neutral-800 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
            )}
         >
            <Settings className="w-4 h-4" />
            General
         </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'categories' && (
          <div className="space-y-4">
             {isFormOpen ? (
                <CategoryForm
                   initialData={editingCategory}
                   onSave={handleSaveCategory}
                   onCancel={() => { setIsFormOpen(false); setEditingCategory(null); }}
                />
             ) : (
                <>
                   <div className="flex items-center justify-between mb-2">
                       <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                           Gestionar Categorías
                       </h3>
                       <Button size="sm" variant="outline" onClick={() => setIsFormOpen(true)} className="gap-2 text-xs py-1 h-auto border-neutral-700">
                           <Plus className="w-3 h-3" />
                           Nueva
                       </Button>
                   </div>
                   <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800">
                       {categories.map((cat) => (
                          <div key={cat.id} className="flex items-center justify-between bg-neutral-900/50 border border-neutral-800 p-3 rounded-lg hover:bg-neutral-800/80 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className={cn("p-2 rounded-lg flex items-center justify-center", cat.bg, cat.color, cat.border, "border")}>
                                     <IconResolver iconName={cat.icon} size={18} />
                                  </div>
                                  <span className="font-medium text-neutral-200">{cat.label}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(cat)} className="text-neutral-500 hover:text-neutral-200 w-8 h-8">
                                     <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(cat)} className="text-neutral-500 hover:text-red-500 w-8 h-8" disabled={cat.id === 'otros'}>
                                     <Trash2 className="w-4 h-4" />
                                  </Button>
                              </div>
                          </div>
                       ))}
                   </div>
                </>
             )}
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Zona de Peligro / Datos
            </h3>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-4">
                <p className="text-sm text-neutral-300">
                    Administra tus datos locales. Puedes exportar una copia de seguridad o restaurarla en cualquier momento.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="ghost"
                        onClick={exportData}
                        className="w-full justify-start gap-3 border border-neutral-700 hover:bg-neutral-800"
                    >
                        <Cloud className="w-4 h-4" />
                        Exportar Copia de Seguridad
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleImportClick}
                        className="w-full justify-start gap-3 border border-neutral-700 hover:bg-neutral-800"
                    >
                        <Upload className="w-4 h-4" />
                        Restaurar Copia de Seguridad
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>

                <p className="text-xs text-neutral-500 italic">
                    * Al restaurar, se reemplazarán las tareas actuales.
                </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
