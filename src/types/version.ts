// src/types/version.ts
import type { PromptElement } from "./prompt";

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
  type: "add" | "remove" | "modify";
  elementType?: string;
  before?: string;
  after?: string;
  position?: number;
}
