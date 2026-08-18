import { create } from 'zustand';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: 'default' | 'danger';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  actions?: { label: string; onClick: () => void; variant?: ButtonVariant }[];
}

interface UIState {
  confirmDialog: ConfirmDialogState;
  openConfirmDialog: (data: {
    title: string;
    message: string;
    variant?: 'default' | 'danger';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    actions?: { label: string; onClick: () => void; variant?: ButtonVariant }[];
  }) => void;
  closeConfirmDialog: () => void;
}

const closedDialog: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'default',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  onConfirm: () => {},
};

export const useUIStore = create<UIState>((set) => ({
  confirmDialog: closedDialog,

  openConfirmDialog: (data) =>
    set({
      confirmDialog: {
        isOpen: true,
        title: data.title,
        message: data.message,
        variant: data.variant || 'default',
        confirmLabel: data.confirmLabel || 'Confirmar',
        cancelLabel: data.cancelLabel || 'Cancelar',
        onConfirm: data.onConfirm || (() => {}),
        actions: data.actions,
      },
    }),

  closeConfirmDialog: () => set((state) => ({ confirmDialog: { ...state.confirmDialog, isOpen: false } })),
}));
