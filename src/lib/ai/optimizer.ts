// src/lib/ai/optimizer.ts
import { OpenRouterClient } from './openrouter';
import { DEFAULT_MODELS } from './models';

export class PromptOptimizer {
  private client: OpenRouterClient;

  constructor(apiKey: string | null) {
    this.client = new OpenRouterClient(apiKey);
  }

  async optimizePrompt(prompt: string, modelId?: string): Promise<string> {
    const model = modelId || DEFAULT_MODELS.optimize;

    const systemPrompt = 'You are an expert prompt engineer. Optimize the given prompt for better image generation results. Focus on clarity, specificity, and artistic quality. Maintain the original intent while improving structure.';

    const userPrompt = `Input:\n${prompt}`;

    try {
      const response = await this.client.generateCompletion(
        model,
        systemPrompt,
        userPrompt
      );

      return response.trim();
    } catch (error) {
      console.error('Optimization error:', error);
      throw new Error('プロンプトの最適化に失敗しました');
    }
  }
}