'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  type: 'portrait' | 'landscape' | 'character' | 'scene' | 'abstract' | 'custom';
  category: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

interface TemplateState {
  templates: Record<string, Template>;
  categories: string[];
  isLoading: boolean;
  error: string | null;
  filter: {
    category?: string;
    type?: string;
    tags?: string[];
    isPublic?: boolean;
  };
}

interface TemplateActions {
  loadTemplates: () => Promise<void>;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (id: string) => Template | null;
  setFilter: (filter: TemplateState['filter']) => void;
  clearFilter: () => void;
  getFilteredTemplates: () => Template[];
}

export const useTemplateStore = create<TemplateState & TemplateActions>()(
  devtools((set, get) => ({
    templates: {},
    categories: [
      'ポートレート',
      '風景',
      'キャラクター',
      'イラスト',
      'リアル',
      'ファンタジー',
      'SF',
      'アニメ',
      'その他'
    ],
    isLoading: false,
    error: null,
    filter: {},

    loadTemplates: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error('Failed to load templates');
        const data = await res.json();

        const templatesMap: Record<string, Template> = {};
        data.templates?.forEach((template: Template) => {
          templatesMap[template.id] = template;
        });

        set({ templates: templatesMap, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    addTemplate: async (templateData) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData),
        });

        if (!res.ok) throw new Error('Failed to create template');

        const newTemplate = await res.json();
        set((state) => ({
          templates: { ...state.templates, [newTemplate.id]: newTemplate },
          isLoading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    updateTemplate: async (id, updates) => {
      const current = get().templates[id];
      if (!current) return;

      // Optimistic update
      set((state) => ({
        templates: {
          ...state.templates,
          [id]: { ...current, ...updates, updatedAt: new Date() }
        }
      }));

      try {
        const res = await fetch(`/api/templates/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          // Rollback on failure
          set((state) => ({
            templates: { ...state.templates, [id]: current }
          }));
          throw new Error('Failed to update template');
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    deleteTemplate: async (id) => {
      const current = get().templates[id];
      if (!current) return;

      // Optimistic deletion
      set((state) => {
        const { [id]: _, ...rest } = state.templates;
        return { templates: rest };
      });

      try {
        const res = await fetch(`/api/templates/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          // Rollback on failure
          set((state) => ({
            templates: { ...state.templates, [id]: current }
          }));
          throw new Error('Failed to delete template');
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    useTemplate: (id) => {
      const template = get().templates[id];
      if (template) {
        // 使用回数を増やす
        set((state) => ({
          templates: {
            ...state.templates,
            [id]: { ...template, usageCount: template.usageCount + 1 }
          }
        }));
      }
      return template;
    },

    setFilter: (filter) => {
      set({ filter });
    },

    clearFilter: () => {
      set({ filter: {} });
    },

    getFilteredTemplates: () => {
      const { templates, filter } = get();
      let filtered = Object.values(templates);

      if (filter.category) {
        filtered = filtered.filter(t => t.category === filter.category);
      }
      if (filter.type) {
        filtered = filtered.filter(t => t.type === filter.type);
      }
      if (filter.isPublic !== undefined) {
        filtered = filtered.filter(t => t.isPublic === filter.isPublic);
      }
      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(t =>
          filter.tags!.some(tag => t.tags.includes(tag))
        );
      }

      return filtered.sort((a, b) => b.usageCount - a.usageCount);
    },
  }))
);