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
  // Google Models (OpenRouter経由)
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "google/gemini-2.5-flash-light",
    label: "Gemini 2.5 Flash Light",
    provider: "Google (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["translate", "analysis"],
  },

  // Anthropic Models (OpenRouter経由)
  {
    id: "anthropic/claude-opus-4",
    label: "Claude Opus 4",
    provider: "Anthropic (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    provider: "Anthropic (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // xAI Models (OpenRouter経由)
  {
    id: "x-ai/grok-4",
    label: "Grok 4",
    provider: "xAI (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "x-ai/grok-4-fast:free",
    label: "Grok 4 Fast (Free)",
    provider: "xAI (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "x-ai/grok-code-fast-1",
    label: "Grok Code Fast",
    provider: "xAI (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "analysis"],
  },

  // OpenAI Models (OpenRouter経由)
  {
    id: "openai/gpt-5-chat",
    label: "GPT-5 Chat",
    provider: "OpenAI (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["translate", "analysis"],
  },

  // DeepSeek (OpenRouter経由)
  {
    id: "deepseek/deepseek-chat-v3.1",
    label: "DeepSeek Chat v3.1",
    provider: "DeepSeek (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // Mistral (OpenRouter経由)
  {
    id: "mistralai/mistral-medium-3.1",
    label: "Mistral Medium 3.1",
    provider: "Mistral (OpenRouter)",
    maxTokens: 32000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // Meta Llama (OpenRouter経由)
  {
    id: "meta-llama/llama-4-maverick",
    label: "Llama 4 Maverick",
    provider: "Meta (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // Qwen Models (OpenRouter経由)
  {
    id: "qwen/qwen3-max",
    label: "Qwen 3 Max",
    provider: "Qwen (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "qwen/qwen-plus-2025-07-28:thinking",
    label: "Qwen Plus Thinking",
    provider: "Qwen (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "analysis"],
  },
  {
    id: "qwen/qwen-plus-2025-07-28",
    label: "Qwen Plus",
    provider: "Qwen (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },
  {
    id: "qwen/qwen3-next-80b-a3b-thinking",
    label: "Qwen 3 Next 80B Thinking",
    provider: "Qwen (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "analysis"],
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct",
    label: "Qwen 3 Next 80B Instruct",
    provider: "Qwen (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // Nous Research (OpenRouter経由)
  {
    id: "nousresearch/hermes-4-405b",
    label: "Hermes 4 405B",
    provider: "Nous Research (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // Z-AI (OpenRouter経由)
  {
    id: "z-ai/glm-4.5",
    label: "GLM 4.5",
    provider: "Z-AI (OpenRouter)",
    maxTokens: 128000,
    capabilities: ["optimize", "translate", "analysis"],
  },

  // Moonshot (OpenRouter経由)
  {
    id: "moonshotai/kimi-k2-0905",
    label: "Kimi K2",
    provider: "Moonshot (OpenRouter)",
    maxTokens: 200000,
    capabilities: ["optimize", "translate", "analysis"],
  },
];

// デフォルトモデル設定（無効なモデルIDは除外）
export const DEFAULT_MODELS = {
  optimize: "anthropic/claude-sonnet-4",
  translate: "google/gemini-2.5-flash", // 修正: 有効なモデルIDに変更
  analysis: "anthropic/claude-sonnet-4",
} as const;

// モデルID検証関数
export function isValidModelId(modelId: string): boolean {
  // ハルシネーションエラー対策 - 無効なモデルIDを検出
  const invalidModels = [
    "google/gemini-1.5-flash-8b",
    "google/gemini-2.5-flash-exp-0827",
  ];

  if (invalidModels.includes(modelId)) {
    console.warn(`[Model Validation] Invalid model ID detected: ${modelId}`);
    return false;
  }

  // 利用可能なモデルリストに存在するか確認
  return AVAILABLE_MODELS.some(model => model.id === modelId);
}

// セーフモデル取得関数
export function getSafeModelId(modelId: string, capability: keyof typeof DEFAULT_MODELS): string {
  if (isValidModelId(modelId)) {
    return modelId;
  }

  // 無効なモデルの場合はデフォルトにフォールバック
  console.warn(`[Model Fallback] Using default model for ${capability} instead of ${modelId}`);
  return DEFAULT_MODELS[capability];
}
