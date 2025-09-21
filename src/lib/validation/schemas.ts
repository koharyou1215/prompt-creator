// src/lib/validation/schemas.ts
import { z } from "zod";
import { AVAILABLE_MODELS } from "@/lib/ai/models";

export const PromptCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(8000),
  language: z.string().default("en"),
  parameters: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
  tags: z.array(z.string()).optional(),
});

export const PromptUpdateSchema = PromptCreateSchema.partial();

const modelEnum = z.enum(
  AVAILABLE_MODELS.map((m) => m.id) as [string, ...string[]]
);

export const SettingsSchema = z.object({
  defaultLang: z.string().default("ja"),
  autoTranslate: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  theme: z.enum(["light", "dark"]).default("light"),
  modelOptimize: modelEnum,
  modelTranslate: modelEnum,
  modelAnalysis: modelEnum,
});

export const TranslateRequestSchema = z.object({
  text: z.string().min(1),
  sourceLang: z.string().min(2),
  targetLang: z.string().min(2),
  useCustomDict: z.boolean().optional(),
  context: z.string().optional(),
});

export const AISuggestRequestSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(["optimize", "variations", "enhance"]),
  options: z.record(z.any()).optional(),
});
