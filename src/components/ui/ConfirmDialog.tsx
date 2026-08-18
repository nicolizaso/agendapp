import { useUIStore } from '../../hooks/useUIStore';
import { Modal } from '../Modal';
import { Button } from '../Button';

export function ConfirmDialog() {
  const confirmDialog = useUIStore((state) => state.confirmDialog);
  const closeConfirmDialog = useUIStore((state) => state.closeConfirmDialog);
  const { isOpen, title, message, variant, confirmLabel, cancelLabel, onConfirm, actions } = confirmDialog;

  const handleConfirm = () => {
    onConfirm();
    closeConfirmDialog();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeConfirmDialog} title={title} size="sm">
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-ink-300">{message}</p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {actions ? (
            actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                size="lg"
                className="sm:w-auto"
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
              <Button variant="outline" size="lg" onClick={closeConfirmDialog}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="lg"
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
