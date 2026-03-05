import { create } from 'zustand';
import type { Task } from '../types';

interface UIState {
  // Dashboard State
  selectedDashboardDate: Date;
  setSelectedDashboardDate: (date: Date) => void;

  // Create Task Modal
  isCreateModalOpen: boolean;
  createModalData: {
    initialDate?: Date;
    taskToEdit?: Task;
  };
  openCreateModal: (data?: { initialDate?: Date; taskToEdit?: Task }) => void;
  closeCreateModal: () => void;

  // Settings Modal
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Confirm Dialog
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'default' | 'danger';
    onConfirm: () => void;
    actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }[];
  };
  openConfirmDialog: (data: {
    title: string;
    message: string;
    variant?: 'default' | 'danger';
    onConfirm?: () => void;
    actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }[];
  }) => void;
  closeConfirmDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Dashboard State
  selectedDashboardDate: new Date(),
  setSelectedDashboardDate: (date) => set({ selectedDashboardDate: date }),

  // Create Modal
  isCreateModalOpen: false,
  createModalData: {},
  openCreateModal: (data = {}) => set({ isCreateModalOpen: true, createModalData: data }),
  closeCreateModal: () => set({ isCreateModalOpen: false, createModalData: {} }),

  // Settings Modal
  isSettingsModalOpen: false,
  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),

  // Confirm Dialog
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: () => {},
  },
  openConfirmDialog: (data) => set({
    confirmDialog: {
      isOpen: true,
      title: data.title,
      message: data.message,
      variant: data.variant || 'default',
      onConfirm: data.onConfirm || (() => {}),
      actions: data.actions
    }
  }),
  closeConfirmDialog: () => set((state) => ({
    confirmDialog: { ...state.confirmDialog, isOpen: false }
  })),
}));
