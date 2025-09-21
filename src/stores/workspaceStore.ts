'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { WorkspaceState } from '@/types/workspace';

interface WorkspaceStore extends WorkspaceState {
  // State
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // Actions
  setActivePromptId: (id: string | undefined) => void;
  setEditMode: (mode: 'text' | 'visual' | 'tree') => void;
  setSelectedElements: (elementIds: string[]) => void;
  toggleSelectedElement: (elementId: string) => void;
  selectElement: (elementId: string) => void; // Add selectElement
  clearSelectedElements: () => void;
  setShowPreview: (show: boolean) => void;
  togglePreview: () => void; // Add togglePreview
  setShowVariations: (show: boolean) => void;
  setTranslationMode: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  resetWorkspace: () => void;
}

const initialState: WorkspaceState & { leftPanelCollapsed: boolean; rightPanelCollapsed: boolean } = {
  activePromptId: undefined,
  editMode: 'visual',
  selectedElements: [],
  showPreview: true,
  showVariations: false,
  translationMode: false,
  autoSave: true,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setActivePromptId: (id) => set({ activePromptId: id }),

        setEditMode: (mode) => set({ editMode: mode }),

        setSelectedElements: (elementIds) => set({ selectedElements: elementIds }),

        toggleSelectedElement: (elementId) => {
          const current = get().selectedElements;
          const updated = current.includes(elementId)
            ? current.filter(id => id !== elementId)
            : [...current, elementId];
          set({ selectedElements: updated });
        },

        selectElement: (elementId) => set({ selectedElements: [elementId] }),

        clearSelectedElements: () => set({ selectedElements: [] }),

        setShowPreview: (show) => set({ showPreview: show }),

        togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),

        setShowVariations: (show) => set({ showVariations: show }),

        setTranslationMode: (enabled) => set({ translationMode: enabled }),

        setAutoSave: (enabled) => set({ autoSave: enabled }),

        setLeftPanelCollapsed: (collapsed) => set({ leftPanelCollapsed: collapsed }),

        setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),

        resetWorkspace: () => set(initialState),
      }),
      {
        name: 'workspace-store',
        partialize: (state) => ({
          editMode: state.editMode,
          showPreview: state.showPreview,
          showVariations: state.showVariations,
          translationMode: state.translationMode,
          autoSave: state.autoSave,
          leftPanelCollapsed: state.leftPanelCollapsed,
          rightPanelCollapsed: state.rightPanelCollapsed,
        }),
      }
    )
  )
);