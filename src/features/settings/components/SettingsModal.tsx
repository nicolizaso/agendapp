import { useRef } from 'react';
import { useUIStore } from '../../../hooks/useUIStore';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { exportData, importData } from '../../backup/utils/backup';
import { Cloud, Upload, AlertTriangle } from 'lucide-react';

export function SettingsModal() {
  const { isSettingsModalOpen, closeSettingsModal, openConfirmDialog } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <Modal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} title="Configuración">
      <div className="space-y-6">
        {/* Danger Zone / Data */}
        <div className="space-y-4">
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
      </div>
    </Modal>
  );
}
