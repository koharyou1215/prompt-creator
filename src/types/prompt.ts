// src/types/prompt.ts
export type ElementType =
  | "subject"
  | "background"
  | "style"
  | "lighting"
  | "composition"
  | "color"
  | "mood"
  | "quality"
  | "custom";

export interface PromptElement {
  id: string;
  type: ElementType;
  content: string;
  position: number;
  isLocked: boolean;
  variations?: string[];
  metadata?: Record<string, unknown>;
}

export interface PromptParameters {
  model?: string;
  aspectRatio?: string;
  chaos?: number;
  stylize?: number;
  quality?: number;
  seed?: number;
  negativePrompt?: string;
  customParams?: Record<string, string | number | boolean>;
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  platform: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

export interface PromptMetadata {
  source?: "manual" | "ai" | "template" | "import";
  referenceImage?: string;
  generatedImages?: GeneratedImage[];
  usageCount: number;
  rating?: number | null;
  notes?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  language: string;
  elements: PromptElement[];
  tags: { id: string; name: string }[];
  parameters: PromptParameters;
  metadata: PromptMetadata;
  versionId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
