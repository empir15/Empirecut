/**
 * EmpireCut — UI Store (Zustand)
 *
 * Gère l'état UI global :
 * - loading overlays
 * - toasts / snackbars
 * - modals
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface UIState {
  // Loading global (ex: pendant l'export)
  isGlobalLoading: boolean;
  globalLoadingMessage: string;

  // Toasts
  toasts: Toast[];

  // Modal active
  activeModal: string | null;
  modalData: unknown;

  // Actions Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Actions Toasts
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Actions Modals
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  globalLoadingMessage: '',
  toasts: [],
  activeModal: null,
  modalData: null,

  setGlobalLoading: (loading, message = '') =>
    set({ isGlobalLoading: loading, globalLoadingMessage: message }),

  showToast: (message, type = 'info', duration = 3000) => {
    const toast: Toast = { id: generateId(), message, type, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toast.id),
      }));
    }, duration);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  openModal: (modalId, data = null) =>
    set({ activeModal: modalId, modalData: data }),

  closeModal: () => set({ activeModal: null, modalData: null }),
}));
