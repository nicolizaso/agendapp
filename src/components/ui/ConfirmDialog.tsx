import { useUIStore } from '../../hooks/useUIStore';
import { Modal } from '../Modal';
import { Button } from '../Button';

export function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useUIStore();
  const { isOpen, title, message, variant, onConfirm } = confirmDialog;

  const handleConfirm = () => {
    onConfirm();
    closeConfirmDialog();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeConfirmDialog} title={title}>
      <div className="space-y-4">
        <p className="text-stone-300 font-body">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          {confirmDialog.actions ? (
            confirmDialog.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={() => {
                  action.onClick();
                  closeConfirmDialog();
                }}
              >
                {action.label}
              </Button>
            ))
          ) : (
            <>
              <Button variant="ghost" onClick={closeConfirmDialog}>
                Cancelar
              </Button>
              <Button
                variant={variant === 'default' ? 'primary' : variant}
                onClick={handleConfirm}
              >
                Confirmar
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
