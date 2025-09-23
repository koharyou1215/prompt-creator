// src/lib/ai/optimizer.ts
import { OpenRouterClient } from "./openrouter";
import { DEFAULT_MODELS } from "./models";

export class PromptOptimizer {
  private client: OpenRouterClient;

  constructor(apiKey: string | null) {
    this.client = new OpenRouterClient(apiKey);
  }

  async optimizePrompt(prompt: string, modelId?: string): Promise<string> {
    const model = modelId || DEFAULT_MODELS.optimize;

    const systemPrompt = `You are an expert AI image generation prompt engineer. Your task is to transform user input into highly effective image generation prompts.

Analyze the user's intent and create an optimized prompt that:
1. **Understands Intent**: Extract what the user wants to create (subject, mood, style)
2. **Adds Essential Details**: Include missing but important details like:
   - Lighting (golden hour, studio lighting, dramatic shadows)
   - Composition (rule of thirds, centered, close-up)
   - Art style (photorealistic, anime, oil painting, digital art)
   - Quality modifiers (highly detailed, 8k, professional)
   - Camera settings (shallow depth of field, wide angle)
3. **Structures Effectively**: Order elements from subject → style → details → quality
4. **Uses Proven Keywords**: Include effective keywords like "masterpiece", "best quality", "highly detailed"
5. **Maintains Clarity**: Keep descriptions specific and avoid contradictions

Transform simple descriptions into rich, detailed prompts that will generate stunning images.
Use comma-separated format typical for image generation.
If the input is already detailed, enhance and reorganize it for better results.`;

    const userPrompt = `Transform this into an optimized image generation prompt:

${prompt}

Output only the optimized prompt, nothing else.`;

    try {
      const response = await this.client.completeWithSystem(
        systemPrompt,
        userPrompt,
        model
      );

      return response.trim();
    } catch (error) {
      console.error("Optimization error:", error);
      throw new Error("プロンプトの最適化に失敗しました");
    }
  }
}
