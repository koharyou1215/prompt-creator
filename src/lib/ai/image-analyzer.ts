// src/lib/ai/image-analyzer.ts
import { OpenRouterClient } from "./openrouter";
import { DEFAULT_MODELS } from "./models";

export class ImageAnalyzer {
  private client: OpenRouterClient;

  constructor(apiKey: string | null) {
    this.client = new OpenRouterClient(apiKey);
  }

  async extractPromptFromImage(
    imageBase64: string,
    modelId?: string
  ): Promise<string> {
    const model = modelId || DEFAULT_MODELS.analysis;

    const systemPrompt = `You are an AI image analysis expert. Your task is to analyze the provided image and extract or generate a prompt that could have been used to create a similar image.

Instructions:
1. Analyze the visual elements, style, composition, and artistic choices
2. Identify subjects, objects, settings, and atmospheric elements
3. Note artistic style, medium, color palette, and technical details
4. Generate a detailed prompt that could recreate a similar image

Return ONLY the extracted/generated prompt, without any explanations or additional text.`;

    const userPrompt = `Analyze this image and extract the prompt that could generate a similar result:`;

    try {
      // OpenRouterはvision機能をサポートしている前提
      const response = await this.client.completeWithSystem(
        systemPrompt,
        `${userPrompt}\n\nImage data: ${imageBase64}`,
        model
      );

      return response.trim();
    } catch (error) {
      console.error("Image analysis error:", error);
      throw new Error("画像からのプロンプト抽出に失敗しました");
    }
  }

  async analyzePrompt(
    prompt: string,
    modelId?: string
  ): Promise<{
    analysis: string;
    suggestions: string[];
  }> {
    const model = modelId || DEFAULT_MODELS.analysis;

    const systemPrompt = `You are an AI prompt analysis expert. Analyze the given prompt and provide insights and suggestions for improvement.

Return your response in JSON format:
{
  "analysis": "detailed analysis of the prompt",
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}`;

    const userPrompt = `Analyze this prompt:\n${prompt}`;

    try {
      const response = await this.client.completeWithSystem(
        systemPrompt,
        userPrompt,
        model
      );

      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        analysis: result.analysis || "プロンプトが分析されました",
        suggestions: result.suggestions || [],
      };
    } catch (error) {
      console.error("Analysis error:", error);
      return {
        analysis: "プロンプト分析でエラーが発生しました",
        suggestions: ["もう一度お試しください"],
      };
    }
  }
}
