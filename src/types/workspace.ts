// src/types/workspace.ts
export interface WorkspaceState {
  activePromptId?: string;
  editMode: "text" | "visual" | "tree";
  selectedElements: string[];
  showPreview: boolean;
  showVariations: boolean;
  translationMode: boolean;
  autoSave: boolean;
}
