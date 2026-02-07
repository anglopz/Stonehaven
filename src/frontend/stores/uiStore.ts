/**
 * UI Store - Zustand
 * Manages UI state like flash messages, modals, loading states
 */

import { create } from 'zustand';
import { FlashMessage } from '@/types';

interface UiState {
  flashMessages: FlashMessage[];
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  
  // Flash messages
  addFlashMessage: (message: FlashMessage) => void;
  removeFlashMessage: (index: number) => void;
  clearFlashMessages: () => void;
  
  // Modal
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  flashMessages: [],
  isModalOpen: false,
  modalContent: null,

  // Flash messages
  addFlashMessage: (message) =>
    set((state) => ({
      flashMessages: [...state.flashMessages, message],
    })),

  removeFlashMessage: (index) =>
    set((state) => ({
      flashMessages: state.flashMessages.filter((_, i) => i !== index),
    })),

  clearFlashMessages: () =>
    set({
      flashMessages: [],
    }),

  // Modal
  openModal: (content) =>
    set({
      isModalOpen: true,
      modalContent: content,
    }),

  closeModal: () =>
    set({
      isModalOpen: false,
      modalContent: null,
    }),
}));
