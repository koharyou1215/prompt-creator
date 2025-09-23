// src/stores/settingsStore.ts
"use client";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface AppSettings {
  defaultLang: string;
  autoTranslate: boolean;
  autoSave: boolean;
  theme: "light" | "dark";
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
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        const prefs = data?.preferences ?? {};
        set({
          settings: {
            defaultLang: data.defaultLang ?? "ja",
            autoTranslate: data.autoTranslate ?? true,
            autoSave: data.autoSave ?? true,
            theme: (data.theme ?? "light") as "light" | "dark",
            modelOptimize: prefs.modelOptimize ?? "anthropic/claude-sonnet-4",
            modelTranslate: prefs.modelTranslate ?? "google/gemini-2.5-flash",
            modelAnalysis: prefs.modelAnalysis ?? "anthropic/claude-sonnet-4",
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
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        set({ settings: current, error: "設定の保存に失敗しました" });
      }
    },
  }))
);
