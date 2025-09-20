Stores & Hooks —
1) src/stores/settingsStore.ts
// src/stores/settingsStore.ts
'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AppSettings {
  defaultLang: string;
  autoTranslate: boolean;
  autoSave: boolean;
  theme: 'light' | 'dark';
  modelOptimize: string;
  modelTranslate: string;
  modelAnalysis: string;
}

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
}

interface SettingsActions {
  load: () => Promise<void>;
  save: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools((set, get) => ({
    settings: null,
    loading: false,
    error: null,
    load: async () => {
      set({ loading: true, error: null });
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        const prefs = data?.preferences ?? {};
        set({
          settings: {
            defaultLang: data.defaultLang ?? 'ja',
            autoTranslate: data.autoTranslate ?? true,
            autoSave: data.autoSave ?? true,
            theme: (data.theme ?? 'light') as 'light' | 'dark',
            modelOptimize: prefs.modelOptimize ?? 'anthropic/claude-3-sonnet',
            modelTranslate: prefs.modelTranslate ?? 'anthropic/claude-3-haiku',
            modelAnalysis: prefs.modelAnalysis ?? 'anthropic/claude-3-sonnet',
          },
          loading: false,
        });
      } catch (e: any) {
        set({ error: e.message, loading: false });
      }
    },
    save: async (patch) => {
      const current = get().settings;
      if (!current) return;
      const next = { ...current, ...patch };
      set({ settings: next });
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        set({ settings: current, error: '設定の保存に失敗しました' });
      }
    },
  }))
);
​
2) src/stores/promptStore.ts
// src/stores/promptStore.ts
'use client';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Prompt, PromptElement } from '@/types/prompt';

interface PromptState {
  prompts: Record<string, Prompt>;
  activePromptId: string | null;
  activePrompt: Prompt | null;
  isLoading: boolean;
  error: string | null;
}

interface PromptActions {
  setActivePrompt: (prompt: Prompt | null) => void;
  loadPrompts: (params?: { page?: number; limit?: number; search?: string; tags?: string[] }) => Promise<void>;
  addPrompt: (data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'versionId' | 'tags' | 'elements'> & {
    tags?: string[];
  }) => Promise<Prompt>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<Prompt>;

  updateElement: (elementId: string, updates: Partial<PromptElement>) => void;
  addElement: (element: Omit<PromptElement, 'id'>) => void;
  removeElement: (elementId: string) => void;
  reorderElements: (elementIds: string[]) => void;
}

export const usePromptStore = create<PromptState & PromptActions>()(
  devtools(
    persist(
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
          if (params?.page) q.set('page', String(params.page));
          if (params?.limit) q.set('limit', String(params.limit));
          if (params?.search) q.set('search', params.search);
          if (params?.tags?.length) q.set('tags', params.tags.join(','));

          try {
            const res = await fetch(`/api/prompts?${q.toString()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load prompts');
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
            const res = await fetch('/api/prompts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to create prompt');
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

          const optimistic = { ...current, ...updates, updatedAt: new Date().toISOString() };
          set((state) => ({
            prompts: { ...state.prompts, [id]: optimistic },
            activePrompt: state.activePromptId === id ? optimistic : state.activePrompt,
          }));

          try {
            const res = await fetch(`/api/prompts/${id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'X-If-Unmodified-Since': String(current.updatedAt),
              },
              body: JSON.stringify(updates),
            });
            if (!res.ok) {
              // rollback
              set((state) => ({
                prompts: { ...state.prompts, [id]: current },
                activePrompt: state.activePromptId === id ? current : state.activePrompt,
                error: `更新に失敗しました (${res.status})`,
              }));
            } else {
              const server = (await res.json()) as Prompt;
              set((state) => ({
                prompts: { ...state.prompts, [id]: server },
                activePrompt: state.activePromptId === id ? server : state.activePrompt,
              }));
            }
          } catch (e: any) {
            set((state) => ({
              prompts: { ...state.prompts, [id]: current },
              activePrompt: state.activePromptId === id ? current : state.activePrompt,
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
          if (!source) throw new Error('Not found');
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
            .join(', ');
          get().updatePrompt(activePrompt.id, { elements: updatedElements, content: rebuilt });
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
            .join(', ');
          get().updatePrompt(activePrompt.id, { elements: updated, content: rebuilt });
        },

        removeElement: (elementId) => {
          const { activePrompt } = get();
          if (!activePrompt) return;
          const updated = activePrompt.elements.filter((el) => el.id !== elementId);
          const rebuilt = updated
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((el) => el.content)
            .join(', ');
          get().updatePrompt(activePrompt.id, { elements: updated, content: rebuilt });
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
            .join(', ');
          get().updatePrompt(activePrompt.id, { elements: updated, content: rebuilt });
        },
      }),
      {
        name: 'prompt-store',
        partialize: (s) => ({ prompts: s.prompts, activePromptId: s.activePromptId }),
      }
    )
  )
);
​
3) src/stores/compareStore.ts
// src/stores/compareStore.ts
'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CompareItem } from '@/types/compare';
import type { Prompt } from '@/types/prompt';

interface CompareState {
  items: CompareItem[];
  activeComparison: [string, string] | null;
  diffMode: 'text' | 'element' | 'visual';
  syncScroll: boolean;
}

interface CompareActions {
  addItem: (prompt: Prompt, image?: { id: string; url: string; thumbnailUrl?: string }) => void;
  removeItem: (id: string) => void;
  reorderItems: (activeId: string, overId: string) => void;
  setActiveComparison: (pair: [string, string] | null) => void;
  setDiffMode: (mode: 'text' | 'element' | 'visual') => void;
  clearAll: () => void;
}

export const useCompareStore = create<CompareState & CompareActions>()(
  devtools((set, get) => ({
    items: [],
    activeComparison: null,
    diffMode: 'text',
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
        activeComparison: state.activeComparison?.includes(id) ? null : state.activeComparison,
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
​
4) src/hooks/usePromptEditor.ts
// src/hooks/usePromptEditor.ts
'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePromptStore } from '@/stores/promptStore';
import { PromptParser } from '@/lib/ai/prompt-parser';
import { generateVariations } from '@/lib/prompt/variations';
import { OpenRouterClient } from '@/lib/ai/openrouter';
import { DEFAULT_MODELS } from '@/lib/ai/models';
import { useSettingsStore } from '@/stores/settingsStore';

export function usePromptEditor(promptId?: string) {
  const {
    prompts,
    activePrompt,
    setActivePrompt,
    updatePrompt,
  } = usePromptStore();

  const { settings } = useSettingsStore();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load active
  useEffect(() => {
    if (promptId && prompts[promptId]) {
      setActivePrompt(prompts[promptId]);
    }
  }, [promptId, prompts, setActivePrompt]);

  // Parse elements
  const parseElements = useCallback(async (content: string) => {
    const elements = await PromptParser.parseElements(content);
    if (activePrompt) {
      await updatePrompt(activePrompt.id, { elements });
    }
    return elements;
  }, [activePrompt, updatePrompt]);

  // Optimize with AI
  const optimizeWithAI = useCallback(async () => {
    if (!activePrompt) return;
    setIsOptimizing(true);
    try {
      const client = new OpenRouterClient();
      const model = settings?.modelOptimize ?? DEFAULT_MODELS.optimize;
      const system = `You are an expert in crafting image generation prompts.
Optimize the following prompt for better results. Improve clarity and add useful details.`;
      const user = `Prompt:\n${activePrompt.content}\nReturn the improved prompt only.`;

      const improved = await client.complete(`${system}\n\n${user}`, model);
      const elements = await PromptParser.parseElements(improved);
      await updatePrompt(activePrompt.id, { content: improved, elements });
    } finally {
      setIsOptimizing(false);
    }
  }, [activePrompt, updatePrompt, settings?.modelOptimize]);

  // Generate variations
  const generatePromptVariations = useCallback(async (type: 'style' | 'subject' | 'color' | 'all', count = 3) => {
    if (!activePrompt) return [];
    const result = await generateVariations({
      basePrompt: activePrompt,
      variationType: type,
      count,
    });
    setVariations(result);
    return result;
  }, [activePrompt]);

  // Replace element
  const replaceElement = useCallback(async (elementId: string, newContent: string) => {
    if (!activePrompt) return;
    const updatedElements = activePrompt.elements.map((el) =>
      el.id === elementId ? { ...el, content: newContent } : el
    );
    const rebuilt = updatedElements
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((el) => el.content)
      .join(', ');
    await updatePrompt(activePrompt.id, { content: rebuilt, elements: updatedElements });
  }, [activePrompt, updatePrompt]);

  // Translate (client-side trigger → API)
  const translate = useCallback(async (targetLang: string) => {
    if (!activePrompt) return '';
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activePrompt.content,
          sourceLang: activePrompt.language,
          targetLang,
          useCustomDict: true,
        }),
      });
      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      return String(data.translated || '');
    } finally {
      setIsTranslating(false);
    }
  }, [activePrompt]);

  return {
    activePrompt,
    isOptimizing,
    isTranslating,
    variations,
    parseElements,
    optimizeWithAI,
    generatePromptVariations,
    replaceElement,
    translate,
  };
