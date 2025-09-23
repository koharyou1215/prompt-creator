// src/lib/ai/analyzer.ts
import { OpenRouterClient } from "./openrouter";
import { DEFAULT_MODELS } from "./models";

export interface PromptAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  effectivenessScore: number;
  clarityScore: number;
  specificityScore: number;
}

export class PromptAnalyzer {
  private client: OpenRouterClient;

  constructor(apiKey: string | null) {
    this.client = new OpenRouterClient(apiKey);
  }

  async analyzePrompt(
    prompt: string,
    modelId?: string
  ): Promise<PromptAnalysis> {
    const model = modelId || DEFAULT_MODELS.analysis;

    const systemPrompt = `You are an AI prompt analysis expert. Analyze the given prompt and provide a detailed assessment in JSON format.

You must respond with ONLY valid JSON, no explanations or additional text.

The JSON should have this exact structure:
{
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "effectivenessScore": 0-100,
  "clarityScore": 0-100,
  "specificityScore": 0-100
}

Evaluation criteria:
- Effectiveness: How well the prompt achieves its intended purpose
- Clarity: How clear and unambiguous the prompt is
- Specificity: How specific and detailed the prompt is`;

    const userPrompt = `Analyze the following prompt:

${prompt}`;

    try {
      const response = await this.client.completeWithSystem(
        systemPrompt,
        userPrompt,
        model
      );

      // Parse JSON response
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate the response structure
      if (
        !analysis.strengths ||
        !analysis.weaknesses ||
        !analysis.suggestions
      ) {
        throw new Error("Invalid analysis structure");
      }

      return {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || [],
        effectivenessScore: analysis.effectivenessScore || 70,
        clarityScore: analysis.clarityScore || 70,
        specificityScore: analysis.specificityScore || 70,
      };
    } catch (error) {
      console.error("Analysis error:", error);

      // Return a default analysis on error
      return {
        strengths: ["プロンプトが提供されています"],
        weaknesses: ["分析エラーが発生しました"],
        suggestions: ["もう一度お試しください"],
        effectivenessScore: 50,
        clarityScore: 50,
        specificityScore: 50,
      };
    }
  }
}
