import { PromptElement } from '@/types/prompt';
import { openRouterRequest } from './openrouter';

export class VariationEngine {
  private readonly strategies = {
    style: {
      system: 'You are an expert at creating stylistic variations of prompts while maintaining core meaning.',
      variations: [
        'photorealistic',
        'anime style',
        'oil painting',
        'watercolor',
        'digital art',
        'sketch',
        'pixel art',
        'minimalist'
      ]
    },
    detail: {
      system: 'You are an expert at adjusting detail levels in prompts.',
      variations: [
        'highly detailed',
        'simple',
        'intricate',
        'abstract',
        'hyper-realistic',
        'conceptual'
      ]
    },
    mood: {
      system: 'You are an expert at creating emotional variations of prompts.',
      variations: [
        'dramatic',
        'serene',
        'mysterious',
        'vibrant',
        'melancholic',
        'energetic',
        'ethereal',
        'dark'
      ]
    },
    composition: {
      system: 'You are an expert at varying composition and perspective in prompts.',
      variations: [
        'close-up',
        'wide angle',
        'bird\'s eye view',
        'dutch angle',
        'symmetrical',
        'rule of thirds',
        'centered',
        'dynamic angle'
      ]
    }
  };

  /**
   * Generate variations for a single element
   */
  async generateElementVariations(
    element: PromptElement,
    strategy: keyof typeof this.strategies = 'style',
    count: number = 3,
    modelId?: string
  ): Promise<string[]> {
    const strategyConfig = this.strategies[strategy];
    const selectedVariations = this.selectRandomVariations(
      strategyConfig.variations,
      count
    );

    const systemPrompt = strategyConfig.system;
    const userPrompt = `Generate ${count} variations of this prompt element using these styles: ${selectedVariations.join(', ')}.

Original: "${element.content}"

Requirements:
- Maintain the core subject and meaning
- Apply the specified style/mood/detail variations
- Keep each variation concise and focused
- Return only the variations as a JSON array of strings

Format: ["variation1", "variation2", "variation3"]`;

    try {
      const response = await openRouterRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: modelId || 'anthropic/claude-3-haiku-20240307',
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '[]';
      const variations = this.parseVariations(content);

      return variations.length > 0 ? variations : [element.content];
    } catch (error) {
      console.error('Variation generation failed:', error);
      return this.generateFallbackVariations(element, selectedVariations);
    }
  }

  /**
   * Generate batch variations for multiple elements
   */
  async generateBatchVariations(
    elements: PromptElement[],
    strategy: keyof typeof this.strategies = 'style',
    variantsPerElement: number = 2,
    modelId?: string
  ): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(elements, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(element =>
        this.generateElementVariations(element, strategy, variantsPerElement, modelId)
          .then(variations => ({ id: element.id, variations }))
      );

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ id, variations }) => {
        results.set(id, variations);
      });
    }

    return results;
  }

  /**
   * Generate smart variations based on element type
   */
  async generateSmartVariations(
    element: PromptElement,
    count: number = 3,
    modelId?: string
  ): Promise<string[]> {
    const strategyMap: Record<string, keyof typeof this.strategies> = {
      subject: 'detail',
      style: 'style',
      environment: 'mood',
      composition: 'composition',
      quality: 'detail',
      negative: 'style'
    };

    const strategy = strategyMap[element.type] || 'style';
    return this.generateElementVariations(element, strategy, count, modelId);
  }

  /**
   * Combine elements with variations
   */
  combineVariations(
    elements: PromptElement[],
    variationMap: Map<string, string[]>,
    combinationCount: number = 5
  ): string[] {
    const combinations: string[] = [];

    for (let i = 0; i < combinationCount; i++) {
      const parts: string[] = [];

      elements.forEach(element => {
        const variations = variationMap.get(element.id) || [element.content];
        const randomIndex = Math.floor(Math.random() * variations.length);
        parts.push(variations[randomIndex]);
      });

      combinations.push(parts.join(', '));
    }

    return combinations;
  }

  /**
   * Generate negative prompt variations
   */
  async generateNegativeVariations(
    baseNegative: string,
    context: string,
    count: number = 3,
    modelId?: string
  ): Promise<string[]> {
    const systemPrompt = 'You are an expert at creating effective negative prompts for image generation.';
    const userPrompt = `Generate ${count} variations of negative prompts based on this context:

Context: "${context}"
Base negative: "${baseNegative}"

Requirements:
- Include common quality issues to avoid
- Add style-specific exclusions
- Keep technical terms that improve generation
- Each variation should be comprehensive but not redundant

Format: ["negative1", "negative2", "negative3"]`;

    try {
      const response = await openRouterRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: modelId || 'anthropic/claude-3-haiku-20240307',
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '[]';
      return this.parseVariations(content);
    } catch (error) {
      console.error('Negative variation generation failed:', error);
      return this.generateFallbackNegatives(baseNegative, count);
    }
  }

  // Helper methods
  private selectRandomVariations(variations: string[], count: number): string[] {
    const shuffled = [...variations].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private parseVariations(content: string): string[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.filter(v => typeof v === 'string');
      }
    } catch {
      // Fallback: extract strings from numbered list
      const matches = content.match(/["']([^"']+)["']/g);
      if (matches) {
        return matches.map(m => m.replace(/["']/g, ''));
      }
    }
    return [];
  }

  private generateFallbackVariations(
    element: PromptElement,
    styles: string[]
  ): string[] {
    return styles.map(style => `${element.content}, ${style}`);
  }

  private generateFallbackNegatives(base: string, count: number): string[] {
    const commonNegatives = [
      'low quality, blurry, pixelated',
      'distorted, deformed, ugly',
      'bad anatomy, wrong proportions',
      'duplicate, extra limbs',
      'cropped, out of frame'
    ];

    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      const additionals = commonNegatives
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .join(', ');
      results.push(`${base}, ${additionals}`);
    }
    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}