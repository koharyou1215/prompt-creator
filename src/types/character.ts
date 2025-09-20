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
  gender?: "male" | "female" | "non-binary" | "other" | null;
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
