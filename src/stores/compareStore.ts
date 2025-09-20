// src/stores/compareStore.ts
"use client";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CompareItem } from "@/types/compare";
import type { Prompt } from "@/types/prompt";

interface CompareState {
  items: CompareItem[];
  activeComparison: [string, string] | null;
  diffMode: "text" | "element" | "visual";
  syncScroll: boolean;
}

interface CompareActions {
  addItem: (
    prompt: Prompt,
    image?: { id: string; url: string; thumbnailUrl?: string }
  ) => void;
  removeItem: (id: string) => void;
  reorderItems: (activeId: string, overId: string) => void;
  setActiveComparison: (pair: [string, string] | null) => void;
  setDiffMode: (mode: "text" | "element" | "visual") => void;
  clearAll: () => void;
}

export const useCompareStore = create<CompareState & CompareActions>()(
  devtools((set, get) => ({
    items: [],
    activeComparison: null,
    diffMode: "text",
    syncScroll: true,

    addItem: (prompt, image) => {
      const newItem: CompareItem = {
        id: `compare_${Date.now()}`,
        prompt,
        image,
        position: get().items.length,
        highlighted: false,
      };
      set((state) => ({ items: [...state.items, newItem] }));
    },

    removeItem: (id) => {
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        activeComparison: state.activeComparison?.includes(id)
          ? null
          : state.activeComparison,
      }));
    },

    reorderItems: (activeId, overId) => {
      const items = [...get().items];
      const from = items.findIndex((i) => i.id === activeId);
      const to = items.findIndex((i) => i.id === overId);
      if (from < 0 || to < 0) return;
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      set({ items });
    },

    setActiveComparison: (pair) => set({ activeComparison: pair }),
    setDiffMode: (mode) => set({ diffMode: mode }),
    clearAll: () => set({ items: [], activeComparison: null }),
  }))
);
