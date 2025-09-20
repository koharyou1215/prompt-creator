 Types ＆ Core Logic —
1) src/types/prompt.ts
// src/types/prompt.ts
export type ElementType =
  | 'subject'
  | 'background'
  | 'style'
  | 'lighting'
  | 'composition'
  | 'color'
  | 'mood'
  | 'quality'
  | 'custom';

export interface PromptElement {
  id: string;
  type: ElementType;
  content: string;
  position: number;
  isLocked: boolean;
  variations?: string[];
  metadata?: Record<string, any>;
}

export interface PromptParameters {
  model?: string;
  aspectRatio?: string;
  chaos?: number;
  stylize?: number;
  quality?: number;
  seed?: number;
  negativePrompt?: string;
  customParams?: Record<string, any>;
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  platform: string;
  metadata?: Record<string, any>;
  createdAt: string | Date;
}

export interface PromptMetadata {
  source?: 'manual' | 'ai' | 'template' | 'import';
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
​
2) src/types/version.ts
// src/types/version.ts
import type { PromptElement } from './prompt';

export interface Version {
  id: string;
  promptId: string;
  versionNumber: number;
  content: string;
  elements: PromptElement[];
  changes: VersionChange[];
  createdAt: string | Date;
  createdBy?: string;
  comment?: string;
}

export interface VersionChange {
  type: 'add' | 'remove' | 'modify';
  elementType?: string;
  before?: string;
  after?: string;
  position?: number;
}
​
3) src/types/compare.ts
// src/types/compare.ts
import type { Prompt } from './prompt';

export interface CompareSession {
  id: string;
  prompts: CompareItem[];
  activeComparison?: [string, string];
  diffMode: 'text' | 'element' | 'visual';
  syncScroll: boolean;
}

export interface CompareItem {
  id: string;
  prompt: Prompt;
  image?: { id: string; url: string; thumbnailUrl?: string };
  position: number;
  highlighted: boolean;
}
​
4) src/types/workspace.ts
// src/types/workspace.ts
export interface WorkspaceState {
  activePromptId?: string;
  editMode: 'text' | 'visual' | 'tree';
  selectedElements: string[];
  showPreview: boolean;
  showVariations: boolean;
  translationMode: boolean;
  autoSave: boolean;
}
​
5) src/types/character.ts
// src/types/character.ts
export interface CharacterInfo {
  id: string;
  name: string;
  description: string;
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  style: CharacterStyle;
  metadata: CharacterMetadata;
  referenceImages?: string[];
  tags: string[];
  usageCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CharacterAppearance {
  gender?: 'male' | 'female' | 'non-binary' | 'other' | null;
  age?: string | null;
  hair?: { color?: string; style?: string; length?: string };
  eyes?: { color?: string; shape?: string };
  build?: string | null;
  height?: string | null;
  distinctiveFeatures?: string[];
}

export interface CharacterPersonality {
  traits?: string[];
  mood?: string | null;
  expression?: string | null;
  posture?: string | null;
}

export interface CharacterStyle {
  clothing?: string | null;
  accessories?: string[];
  era?: string | null;
  theme?: string | null;
}

export interface CharacterMetadata {
  sourcePromptIds: string[];
  firstAppearance: string | Date;
  lastUsed: string | Date;
  favorite: boolean;
  rating?: number;
}
​
6) src/lib/ai/prompt-parser.ts
// src/lib/ai/prompt-parser.ts
import { v4 as uuid } from 'uuid';
import type { PromptElement, ElementType } from '@/types/prompt';

export class PromptParser {
  private static readonly PATTERNS: Record<ElementType, RegExp> = {
    subject: /(?:beautiful|handsome|young|old|man|woman|girl|boy|person|character|anime|realistic)\s+[^,]+/gi,
    style: /(?:art\s+style|painting|digital\s+art|watercolor|oil\s+painting|sketch|anime\s+style|realistic|photorealistic|illustration)/gi,
    lighting: /(?:soft\s+lighting|dramatic\s+lighting|natural\s+light|studio\s+lighting|golden\s+hour|blue\s+hour|rim\s+lighting|backlighting)/gi,
    background: /(?:background|backdrop|setting|environment|scene|landscape|interior|outdoor|indoor)/gi,
    composition: /(?:close-up|wide\s+shot|portrait|full\s+body|medium\s+shot|bird's\s+eye\s+view|low\s+angle|high\s+angle)/gi,
    color: /(?:vibrant\s+colors|muted\s+colors|monochrome|black\s+and\s+white|sepia|warm\s+tones|cool\s+tones|pastel)/gi,
    mood: /(?:mood|atmosphere|feeling|vibe)/gi,
    quality: /(?:4k|8k|high\s+resolution|detailed|ultra\s+detailed|masterpiece|best\s+quality|highly\s+detailed)/gi,
    custom: /.^/gi,
  };

  static async parseElements(content: string): Promise<PromptElement[]> {
    const elements: PromptElement[] = [];
    let position = 0;

    for (const [type, pattern] of Object.entries(this.PATTERNS)) {
      if (type === 'custom') continue;
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
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !used.some((u) => s.includes(u)))
      .forEach((part) => {
        elements.push({
          id: `el_${uuid()}`,
          type: 'custom',
          content: part,
          position: position++,
          isLocked: false,
          variations: [],
        });
      });

    return elements.sort((a, b) => a.position - b.position);
  }
}
​
7) src/lib/ai/character-extractor.ts
// src/lib/ai/character-extractor.ts
import { OpenRouterClient } from './openrouter';
import { DEFAULT_MODELS } from './models';
import type { CharacterInfo } from '@/types/character';
import { v4 as uuid } from 'uuid';

export class CharacterExtractor {
  static async extractCharacterInfo(prompt: string): Promise<CharacterInfo | null> {
    const client = new OpenRouterClient();
    const system = `You are an expert at analyzing image generation prompts and extracting character information.
Return JSON with keys: name, appearance, personality, style.`;
    const user = `Prompt:\n${prompt}\nReturn JSON only.`;

    const response = await client.complete(`${system}\n\n${user}`, DEFAULT_MODELS.analysis);
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/{[\s\S]*}/);
    try {
      const raw = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response);
      return this.normalize(raw);
    } catch {
      return null;
    }
  }

  private static normalize(data: any): CharacterInfo {
    return {
      id: `char_${uuid()}`,
      name: data.name || 'Unknown Character',
      description: this.describe(data),
      appearance: {
        gender: data.appearance?.gender ?? null,
        age: data.appearance?.age ?? null,
        hair: {
          color: data.appearance?.hair?.color || '',
          style: data.appearance?.hair?.style || '',
          length: data.appearance?.hair?.length || '',
        },
        eyes: {
          color: data.appearance?.eyes?.color || '',
          shape: data.appearance?.eyes?.shape || '',
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
      parts.push(`with ${data.appearance.hair.color || ''} ${data.appearance.hair.style || ''} hair`.trim());
    }
    if (data.appearance?.eyes?.color) parts.push(`${data.appearance.eyes.color} eyes`);
    if (data.style?.clothing) parts.push(`wearing ${data.style.clothing}`);
    if (data.personality?.mood) parts.push(`in a ${data.personality.mood} mood`);
    return parts.join(', ');
  }

  static async extractAllCharactersFromPrompt(prompt: string): Promise<CharacterInfo[]> {
    // Simple version: try to extract one character from the whole prompt
    const c = await this.extractCharacterInfo(prompt);
    return c ? [c] : [];
  }
}
​
8) src/lib/prompt/variations.ts
// src/lib/prompt/variations.ts
import type { Prompt } from '@/types/prompt';
import { OpenRouterClient } from '@/lib/ai/openrouter';
import { DEFAULT_MODELS } from '@/lib/ai/models';

export async function generateVariations(opts: {
  basePrompt: Prompt;
  variationType: 'style' | 'subject' | 'color' | 'all';
  count: number;
  keepElements?: string[];
}): Promise<string[]> {
  const client = new OpenRouterClient();

  const system = `You are an expert prompt engineer for image generation AI.
Create ${opts.count} variations of the given prompt by modifying the ${opts.variationType} elements.
${opts.keepElements?.length ? `Keep these elements unchanged: ${opts.keepElements.join(', ')}` : ''}
Maintain the overall quality and coherence of the prompt.
Return each variation on a new line, no numbering or extra commentary.`;

  const user = `Original prompt:\n${opts.basePrompt.content}\n\nReturn variations only.`;

  const response = await client.complete(`${system}\n\n${user}`, DEFAULT_MODELS.optimize);
  return response
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, opts.count);
}