// src/stores/promptStore.ts
"use client";
import { create } from "zustand";
import type { Prompt, PromptElement } from "@/types/prompt";

interface PromptState {
  prompts: Record<string, Prompt>;
  activePromptId: string | null;
  activePrompt: Prompt | null;
  isLoading: boolean;
  error: string | null;
}

interface PromptActions {
  setActivePrompt: (prompt: Prompt | null) => void;
  loadPrompts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }) => Promise<void>;
  addPrompt: (
    data: Omit<
      Prompt,
      "id" | "createdAt" | "updatedAt" | "versionId" | "tags" | "elements"
    > & {
      tags?: string[];
    }
  ) => Promise<Prompt>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<Prompt>;

  updateElement: (elementId: string, updates: Partial<PromptElement>) => void;
  addElement: (element: Omit<PromptElement, "id">) => void;
  removeElement: (elementId: string) => void;
  reorderElements: (elementIds: string[]) => void;
}

export const usePromptStore = create<PromptState & PromptActions>(
  (set, get) => ({
        prompts: {},
        activePromptId: null,
        activePrompt: null,
        isLoading: false,
        error: null,

        setActivePrompt: (prompt) =>
          set({
            activePrompt: prompt,
            activePromptId: prompt?.id ?? null,
          }),

        loadPrompts: async (params) => {
          set({ isLoading: true, error: null });
          const q = new URLSearchParams();
          if (params?.page) q.set("page", String(params.page));
          if (params?.limit) q.set("limit", String(params.limit));
          if (params?.search) q.set("search", params.search);
          if (params?.tags?.length) q.set("tags", params.tags.join(","));

          try {
            const res = await fetch(`/api/prompts?${q.toString()}`, {
              cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to load prompts");
            const data = await res.json();
            const rec: Record<string, Prompt> = {};
            for (const p of data.prompts as Prompt[]) rec[p.id] = p;
            set({ prompts: rec, isLoading: false });
          } catch (e: any) {
            set({ error: e.message, isLoading: false });
          }
        },

        addPrompt: async (payload) => {
          set({ isLoading: true, error: null });
          try {
            const res = await fetch("/api/prompts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create prompt");
            const newPrompt = (await res.json()) as Prompt;
            set((state) => ({
              prompts: { ...state.prompts, [newPrompt.id]: newPrompt },
              activePrompt: newPrompt,
              activePromptId: newPrompt.id,
              isLoading: false,
            }));
            return newPrompt;
          } catch (e: any) {
            set({ error: e.message, isLoading: false });
            throw e;
          }
        },

        updatePrompt: async (id, updates) => {
          const current = get().prompts[id];
          if (!current) return;

          const optimistic = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            prompts: { ...state.prompts, [id]: optimistic },
            activePrompt:
              state.activePromptId === id ? optimistic : state.activePrompt,
          }));

          try {
            const res = await fetch(`/api/prompts/${id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "X-If-Unmodified-Since": String(current.updatedAt),
              },
              body: JSON.stringify(updates),
            });
            if (!res.ok) {
              // rollback
              set((state) => ({
                prompts: { ...state.prompts, [id]: current },
                activePrompt:
                  state.activePromptId === id ? current : state.activePrompt,
                error: `更新に失敗しました (${res.status})`,
              }));
            } else {
              const server = (await res.json()) as Prompt;
              set((state) => ({
                prompts: { ...state.prompts, [id]: server },
                activePrompt:
                  state.activePromptId === id ? server : state.activePrompt,
              }));
            }
          } catch (e: any) {
            set((state) => ({
              prompts: { ...state.prompts, [id]: current },
              activePrompt:
                state.activePromptId === id ? current : state.activePrompt,
              error: e.message,
            }));
          }
        },

        deletePrompt: async (id) => {
          // Implement when DELETE route exists
          const { prompts } = get();
          const { [id]: _, ...rest } = prompts;
          set({ prompts: rest, activePromptId: null, activePrompt: null });
        },

        duplicatePrompt: async (id) => {
          const source = get().prompts[id];
          if (!source) throw new Error("Not found");
          const copyPayload = {
            title: `${source.title} (copy)`,
            content: source.content,
            language: source.language,
            parameters: source.parameters,
            metadata: source.metadata,
            tags: source.tags?.map((t) => t.name) ?? [],
          };
          return get().addPrompt(copyPayload as any);
        },

        updateElement: (elementId, updates) => {
          const { activePrompt } = get();
          if (!activePrompt) return;
          const updatedElements = activePrompt.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el
          );
          const rebuilt = updatedElements
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((el) => el.content)
            .join(", ");
          get().updatePrompt(activePrompt.id, {
            elements: updatedElements,
            content: rebuilt,
          });
        },

        addElement: (element) => {
          const { activePrompt } = get();
          if (!activePrompt) return;
          const newEl: PromptElement = {
            ...element,
            id: `local_${Date.now()}`,
          };
          const updated = [...activePrompt.elements, newEl];
          const rebuilt = updated
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((el) => el.content)
            .join(", ");
          get().updatePrompt(activePrompt.id, {
            elements: updated,
            content: rebuilt,
          });
        },

        removeElement: (elementId) => {
          const { activePrompt } = get();
          if (!activePrompt) return;
          const updated = activePrompt.elements.filter(
            (el) => el.id !== elementId
          );
          const rebuilt = updated
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((el) => el.content)
            .join(", ");
          get().updatePrompt(activePrompt.id, {
            elements: updated,
            content: rebuilt,
          });
        },

        reorderElements: (elementIds) => {
          const { activePrompt } = get();
          if (!activePrompt) return;
          const map = new Map(elementIds.map((id, idx) => [id, idx]));
          const updated = activePrompt.elements.map((el) => ({
            ...el,
            position: map.get(el.id) ?? el.position,
          }));
          const rebuilt = updated
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((el) => el.content)
            .join(", ");
          get().updatePrompt(activePrompt.id, {
            elements: updated,
            content: rebuilt,
          });
        },
      })
);
