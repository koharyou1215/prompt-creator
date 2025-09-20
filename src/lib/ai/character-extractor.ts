// src/lib/ai/character-extractor.ts
import { OpenRouterClient } from "./openrouter";
import { DEFAULT_MODELS } from "./models";
import type { CharacterInfo } from "@/types/character";
import { v4 as uuid } from "uuid";

export class CharacterExtractor {
  static async extractCharacterInfo(
    prompt: string
  ): Promise<CharacterInfo | null> {
    const client = new OpenRouterClient();
    const system = `You are an expert at analyzing image generation prompts and extracting character information.
Return JSON with keys: name, appearance, personality, style.`;
    const user = `Prompt:\n${prompt}\nReturn JSON only.`;

    const response = await client.complete(
      `${system}\n\n${user}`,
      DEFAULT_MODELS.analysis
    );
    const jsonMatch =
      response.match(/```json\s*([\s\S]*?)\s*```/) ||
      response.match(/{[\s\S]*}/);
    try {
      const raw = JSON.parse(
        jsonMatch ? jsonMatch[1] || jsonMatch[0] : response
      );
      return this.normalize(raw);
    } catch {
      return null;
    }
  }

  private static normalize(data: any): CharacterInfo {
    return {
      id: `char_${uuid()}`,
      name: data.name || "Unknown Character",
      description: this.describe(data),
      appearance: {
        gender: data.appearance?.gender ?? null,
        age: data.appearance?.age ?? null,
        hair: {
          color: data.appearance?.hair?.color || "",
          style: data.appearance?.hair?.style || "",
          length: data.appearance?.hair?.length || "",
        },
        eyes: {
          color: data.appearance?.eyes?.color || "",
          shape: data.appearance?.eyes?.shape || "",
        },
        build: data.appearance?.build ?? null,
        height: data.appearance?.height ?? null,
        distinctiveFeatures: data.appearance?.distinctiveFeatures ?? [],
      },
      personality: {
        traits: data.personality?.traits ?? [],
        mood: data.personality?.mood ?? null,
        expression: data.personality?.expression ?? null,
        posture: data.personality?.posture ?? null,
      },
      style: {
        clothing: data.style?.clothing ?? null,
        accessories: data.style?.accessories ?? [],
        era: data.style?.era ?? null,
        theme: data.style?.theme ?? null,
      },
      metadata: {
        sourcePromptIds: [],
        firstAppearance: new Date(),
        lastUsed: new Date(),
        favorite: false,
        rating: data.metadata?.rating,
      },
      referenceImages: [],
      tags: [],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private static describe(data: any): string {
    const parts: string[] = [];
    if (data.name) parts.push(data.name);
    if (data.appearance?.age) parts.push(data.appearance.age);
    if (data.appearance?.gender) parts.push(data.appearance.gender);
    if (data.appearance?.hair?.color || data.appearance?.hair?.style) {
      parts.push(
        `with ${data.appearance.hair.color || ""} ${
          data.appearance.hair.style || ""
        } hair`.trim()
      );
    }
    if (data.appearance?.eyes?.color)
      parts.push(`${data.appearance.eyes.color} eyes`);
    if (data.style?.clothing) parts.push(`wearing ${data.style.clothing}`);
    if (data.personality?.mood)
      parts.push(`in a ${data.personality.mood} mood`);
    return parts.join(", ");
  }

  static async extractAllCharactersFromPrompt(
    prompt: string
  ): Promise<CharacterInfo[]> {
    // Simple version: try to extract one character from the whole prompt
    const c = await this.extractCharacterInfo(prompt);
    return c ? [c] : [];
  }
}
