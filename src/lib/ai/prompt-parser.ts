// src/lib/ai/prompt-parser.ts
import { v4 as uuid } from "uuid";
import type { PromptElement, ElementType } from "@/types/prompt";

export class PromptParser {
  private static readonly PATTERNS: Record<ElementType, RegExp> = {
    subject:
      /(?:beautiful|handsome|young|old|man|woman|girl|boy|person|character|anime|realistic)\s+[^,]+/gi,
    style:
      /(?:art\s+style|painting|digital\s+art|watercolor|oil\s+painting|sketch|anime\s+style|realistic|photorealistic|illustration)/gi,
    lighting:
      /(?:soft\s+lighting|dramatic\s+lighting|natural\s+light|studio\s+lighting|golden\s+hour|blue\s+hour|rim\s+lighting|backlighting)/gi,
    background:
      /(?:background|backdrop|setting|environment|scene|landscape|interior|outdoor|indoor)/gi,
    composition:
      /(?:close-up|wide\s+shot|portrait|full\s+body|medium\s+shot|bird's\s+eye\s+view|low\s+angle|high\s+angle)/gi,
    color:
      /(?:vibrant\s+colors|muted\s+colors|monochrome|black\s+and\s+white|sepia|warm\s+tones|cool\s+tones|pastel)/gi,
    mood: /(?:mood|atmosphere|feeling|vibe)/gi,
    quality:
      /(?:4k|8k|high\s+resolution|detailed|ultra\s+detailed|masterpiece|best\s+quality|highly\s+detailed)/gi,
    custom: /.^/gi,
  };

  static async parseElements(content: string): Promise<PromptElement[]> {
    const elements: PromptElement[] = [];
    let position = 0;

    for (const [type, pattern] of Object.entries(this.PATTERNS)) {
      if (type === "custom") continue;
      const matches = content.match(pattern as RegExp);
      matches?.forEach((match) => {
        elements.push({
          id: `el_${uuid()}`,
          type: type as ElementType,
          content: match.trim(),
          position: position++,
          isLocked: false,
          variations: [],
        });
      });
    }

    const used = elements.map((e) => e.content);
    content
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !used.some((u) => s.includes(u)))
      .forEach((part) => {
        elements.push({
          id: `el_${uuid()}`,
          type: "custom",
          content: part,
          position: position++,
          isLocked: false,
          variations: [],
        });
      });

    return elements.sort((a, b) => a.position - b.position);
  }
}
