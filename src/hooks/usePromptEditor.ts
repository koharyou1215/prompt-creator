// src/hooks/usePromptEditor.ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { usePromptStore } from "@/stores/promptStore";
import { PromptParser } from "@/lib/ai/prompt-parser";
import { generateVariations } from "@/lib/prompt/variations";
import { OpenRouterClient } from "@/lib/ai/openrouter";
import { DEFAULT_MODELS } from "@/lib/ai/models";
import { useSettingsStore } from "@/stores/settingsStore";

export function usePromptEditor(promptId?: string) {
  const { prompts, activePrompt, setActivePrompt, updatePrompt } =
    usePromptStore();

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
  const parseElements = useCallback(
    async (content: string) => {
      const elements = await PromptParser.parseElements(content);
      if (activePrompt) {
        await updatePrompt(activePrompt.id, { elements });
      }
      return elements;
    },
    [activePrompt, updatePrompt]
  );

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
  const generatePromptVariations = useCallback(
    async (type: "style" | "subject" | "color" | "all", count = 3) => {
      if (!activePrompt) return [];
      const result = await generateVariations({
        basePrompt: activePrompt,
        variationType: type,
        count,
      });
      setVariations(result);
      return result;
    },
    [activePrompt]
  );

  // Replace element
  const replaceElement = useCallback(
    async (elementId: string, newContent: string) => {
      if (!activePrompt) return;
      const updatedElements = activePrompt.elements.map((el) =>
        el.id === elementId ? { ...el, content: newContent } : el
      );
      const rebuilt = updatedElements
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((el) => el.content)
        .join(", ");
      await updatePrompt(activePrompt.id, {
        content: rebuilt,
        elements: updatedElements,
      });
    },
    [activePrompt, updatePrompt]
  );

  // Translate (client-side trigger → API)
  const translate = useCallback(
    async (targetLang: string) => {
      if (!activePrompt) return "";
      setIsTranslating(true);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: activePrompt.content,
            sourceLang: activePrompt.language,
            targetLang,
            useCustomDict: true,
          }),
        });
        if (!res.ok) throw new Error("Translation failed");
        const data = await res.json();
        return String(data.translated || "");
      } finally {
        setIsTranslating(false);
      }
    },
    [activePrompt]
  );

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
}
