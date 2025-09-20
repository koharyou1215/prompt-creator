// src/lib/ai/models.ts
export interface AIModel {
  id: string;
  label: string;
  provider: string;
  maxTokens: number;
  costPerToken?: number;
  capabilities: string[];
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "anthropic/claude-3-sonnet",
    label: "Claude 3 Sonnet",
    provider: "Anthropic",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "anthropic/claude-3-haiku",
    label: "Claude 3 Haiku",
    provider: "Anthropic",
    maxTokens: 200000,
    capabilities: ["translate", "analysis"],
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    maxTokens: 128000,
    capabilities: ["translate", "analysis"],
  },
  {
    id: "google/gemini-pro-1.5",
    label: "Gemini Pro 1.5",
    provider: "Google",
    maxTokens: 1000000,
    capabilities: ["optimize", "translate", "analysis"],
  },
];

export const DEFAULT_MODELS = {
  optimize: "anthropic/claude-3-sonnet",
  translate: "anthropic/claude-3-haiku",
  analysis: "anthropic/claude-3-sonnet",
} as const;
