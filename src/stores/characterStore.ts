'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CharacterInfo } from '@/types/character';

interface CharacterState {
  characters: Record<string, CharacterInfo>;
  selectedCharacterId: string | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    tags?: string[];
    search?: string;
    favorite?: boolean;
  };
}

interface CharacterActions {
  loadCharacters: () => Promise<void>;
  addCharacter: (character: Omit<CharacterInfo, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updateCharacter: (id: string, updates: Partial<CharacterInfo>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  selectCharacter: (id: string | null) => void;
  extractFromPrompt: (promptContent: string) => Promise<CharacterInfo | null>;
  toggleFavorite: (id: string) => void;
  incrementUsage: (id: string) => void;
  setFilter: (filter: CharacterState['filter']) => void;
  getFilteredCharacters: () => CharacterInfo[];
  searchCharacters: (query: string) => CharacterInfo[];
}

export const useCharacterStore = create<CharacterState & CharacterActions>()(
  devtools((set, get) => ({
    characters: {},
    selectedCharacterId: null,
    isLoading: false,
    error: null,
    filter: {},

    loadCharacters: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/characters');
        if (!res.ok) throw new Error('Failed to load characters');
        const data = await res.json();

        const charactersMap: Record<string, CharacterInfo> = {};
        data.characters?.forEach((character: CharacterInfo) => {
          charactersMap[character.id] = character;
        });

        set({ characters: charactersMap, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    addCharacter: async (characterData) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(characterData),
        });

        if (!res.ok) throw new Error('Failed to create character');

        const newCharacter = await res.json();
        set((state) => ({
          characters: { ...state.characters, [newCharacter.id]: newCharacter },
          isLoading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    updateCharacter: async (id, updates) => {
      const current = get().characters[id];
      if (!current) return;

      // Optimistic update
      const updated = { ...current, ...updates, updatedAt: new Date() };
      set((state) => ({
        characters: { ...state.characters, [id]: updated }
      }));

      try {
        const res = await fetch(`/api/characters/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          // Rollback on failure
          set((state) => ({
            characters: { ...state.characters, [id]: current }
          }));
          throw new Error('Failed to update character');
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    deleteCharacter: async (id) => {
      const current = get().characters[id];
      if (!current) return;

      // Optimistic deletion
      set((state) => {
        const { [id]: _, ...rest } = state.characters;
        return {
          characters: rest,
          selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId
        };
      });

      try {
        const res = await fetch(`/api/characters/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          // Rollback on failure
          set((state) => ({
            characters: { ...state.characters, [id]: current }
          }));
          throw new Error('Failed to delete character');
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    selectCharacter: (id) => {
      set({ selectedCharacterId: id });
    },

    extractFromPrompt: async (promptContent) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/characters/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptContent }),
        });

        if (!res.ok) throw new Error('Failed to extract character');

        const character = await res.json();
        set({ isLoading: false });
        return character;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    toggleFavorite: (id) => {
      const character = get().characters[id];
      if (!character) return;

      const updated = {
        ...character,
        metadata: {
          ...character.metadata,
          favorite: !character.metadata.favorite,
        }
      };

      set((state) => ({
        characters: { ...state.characters, [id]: updated }
      }));

      // バックエンドに保存
      fetch(`/api/characters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updated.metadata }),
      });
    },

    incrementUsage: (id) => {
      const character = get().characters[id];
      if (!character) return;

      const updated = {
        ...character,
        usageCount: character.usageCount + 1,
        metadata: {
          ...character.metadata,
          lastUsed: new Date(),
        }
      };

      set((state) => ({
        characters: { ...state.characters, [id]: updated }
      }));
    },

    setFilter: (filter) => {
      set({ filter });
    },

    getFilteredCharacters: () => {
      const { characters, filter } = get();
      let filtered = Object.values(characters);

      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(c =>
          filter.tags!.some(tag => c.tags.includes(tag))
        );
      }

      if (filter.favorite !== undefined) {
        filtered = filtered.filter(c => c.metadata.favorite === filter.favorite);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
        );
      }

      return filtered.sort((a, b) => b.usageCount - a.usageCount);
    },

    searchCharacters: (query) => {
      const characters = Object.values(get().characters);
      const queryLower = query.toLowerCase();

      return characters.filter(c =>
        c.name.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower) ||
        c.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    },
  }))
);