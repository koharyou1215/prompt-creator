// src/lib/prompt/variations.ts
import type { Prompt } from "@/types/prompt";
import { OpenRouterClient } from "@/lib/ai/openrouter";
import { DEFAULT_MODELS } from "@/lib/ai/models";

export async function generateVariations(opts: {
  basePrompt: Prompt;
  variationType: "style" | "subject" | "color" | "all";
  count: number;
  keepElements?: string[];
}): Promise<string[]> {
  const client = new OpenRouterClient();

  const system = `You are an expert prompt engineer for image generation AI.
Create ${opts.count} variations of the given prompt by modifying the ${
    opts.variationType
  } elements.
${
  opts.keepElements?.length
    ? `Keep these elements unchanged: ${opts.keepElements.join(", ")}`
    : ""
}
Maintain the overall quality and coherence of the prompt.
Return each variation on a new line, no numbering or extra commentary.`;

  const user = `Original prompt:\n${opts.basePrompt.content}\n\nReturn variations only.`;

  const response = await client.complete(
    `${system}\n\n${user}`,
    DEFAULT_MODELS.optimize
  );
  return response
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, opts.count);
}
