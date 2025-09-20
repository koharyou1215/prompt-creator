// src/types/compare.ts
import type { Prompt } from "./prompt";

export interface CompareSession {
  id: string;
  prompts: CompareItem[];
  activeComparison?: [string, string];
  diffMode: "text" | "element" | "visual";
  syncScroll: boolean;
}

export interface CompareItem {
  id: string;
  prompt: Prompt;
  image?: { id: string; url: string; thumbnailUrl?: string };
  position: number;
  highlighted: boolean;
}
