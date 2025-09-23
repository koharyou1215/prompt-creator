import { openRouterRequest } from './openrouter-request';

interface NegativePromptConfig {
  style?: string;
  subject?: string;
  quality?: 'high' | 'medium' | 'low';
  customExclusions?: string[];
}

export class NegativePromptGenerator {
  private readonly baseNegatives = {
    quality: {
      high: 'low quality, blurry, pixelated, compression artifacts, jpeg artifacts, noise, grain',
      medium: 'worst quality, low resolution, distorted',
      low: 'bad quality, ugly'
    },
    anatomy: {
      human: 'bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, amputation, malformed hands, extra fingers, fused fingers, too many fingers',
      face: 'bad face, ugly face, malformed face, distorted face, extra eyes, cross-eyed, lazy eye',
      general: 'deformed, disfigured, bad proportions, gross proportions'
    },
    style: {
      photorealistic: 'cartoon, anime, illustration, painting, drawing, art, sketch, 3d, render, cgi',
      anime: 'realistic, photorealistic, photo, real, hyperrealistic',
      painting: 'photo, photorealistic, 3d render, cgi, digital',
      digital: 'traditional media, canvas texture, paper texture, watercolor',
      general: 'watermark, signature, text, logo, copyright, username'
    },
    composition: {
      framing: 'cropped, out of frame, cut off, partial',
      focus: 'out of focus, depth of field, bokeh blur, motion blur',
      multiple: 'duplicate, clone, twins, multiple views, split screen'
    }
  };

  /**
   * Generate context-aware negative prompts
   */
  async generateNegativePrompt(
    positivePrompt: string,
    config: NegativePromptConfig = {},
    modelId?: string
  ): Promise<string> {
    const systemPrompt = `You are an expert at creating effective negative prompts for image generation.
Your negative prompts should exclude unwanted elements while preserving the intended artistic vision.`;

    const userPrompt = `Create an optimized negative prompt for this image generation:

Positive prompt: "${positivePrompt}"
Style: ${config.style || 'general'}
Subject: ${config.subject || 'general'}
Quality level: ${config.quality || 'high'}
${config.customExclusions ? `Additional exclusions: ${config.customExclusions.join(', ')}` : ''}

Requirements:
- Include relevant quality issues to avoid
- Add style-specific exclusions that won't interfere with the desired style
- Include subject-appropriate anatomy/form exclusions
- Keep it concise but comprehensive
- Don't exclude elements that are wanted in the positive prompt

Return only the negative prompt as plain text, no explanations.`;

    try {
      const response = await openRouterRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: modelId || 'anthropic/claude-3-haiku-20240307',
        temperature: 0.3,
        max_tokens: 200
      });

      const generatedNegative = response || '';
      return this.cleanAndValidate(generatedNegative) || this.buildFallbackNegative(config);
    } catch (error) {
      console.error('Negative prompt generation failed:', error);
      return this.buildFallbackNegative(config);
    }
  }

  /**
   * Generate multiple negative prompt variations
   */
  async generateNegativeVariations(
    positivePrompt: string,
    count: number = 3,
    config: NegativePromptConfig = {},
    modelId?: string
  ): Promise<string[]> {
    const variations: string[] = [];

    // Generate with different emphasis levels
    const emphasisLevels = ['minimal', 'standard', 'comprehensive'];

    for (let i = 0; i < Math.min(count, emphasisLevels.length); i++) {
      const systemPrompt = `You are an expert at creating ${emphasisLevels[i]} negative prompts for image generation.`;

      const userPrompt = `Create a ${emphasisLevels[i]} negative prompt for:

Positive prompt: "${positivePrompt}"
Style: ${config.style || 'general'}

Requirements for ${emphasisLevels[i]} negative:
${emphasisLevels[i] === 'minimal' ? '- Only the most critical exclusions\n- Very concise (under 50 words)' : ''}
${emphasisLevels[i] === 'standard' ? '- Balanced coverage of common issues\n- Moderate length (50-100 words)' : ''}
${emphasisLevels[i] === 'comprehensive' ? '- Thorough coverage of potential issues\n- Detailed exclusions (100-150 words)' : ''}

Return only the negative prompt as plain text.`;

      try {
        const response = await openRouterRequest({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: modelId || 'anthropic/claude-3-haiku-20240307',
          temperature: 0.5,
          max_tokens: 200
        });

        const negative = response || '';
        variations.push(this.cleanAndValidate(negative) || this.buildFallbackNegative(config, emphasisLevels[i]));
      } catch (error) {
        console.error(`Failed to generate ${emphasisLevels[i]} negative:`, error);
        variations.push(this.buildFallbackNegative(config, emphasisLevels[i]));
      }
    }

    return variations;
  }

  /**
   * Build template-based negative prompts
   */
  buildTemplateNegative(
    template: 'minimal' | 'standard' | 'comprehensive' | 'style-specific',
    config: NegativePromptConfig = {}
  ): string {
    const parts: string[] = [];

    switch (template) {
      case 'minimal':
        parts.push(this.baseNegatives.quality.low);
        parts.push('deformed, ugly');
        break;

      case 'standard':
        parts.push(this.baseNegatives.quality.medium);
        if (config.subject === 'human' || config.subject === 'portrait') {
          parts.push(this.baseNegatives.anatomy.human);
        } else {
          parts.push(this.baseNegatives.anatomy.general);
        }
        parts.push(this.baseNegatives.style.general);
        break;

      case 'comprehensive':
        parts.push(this.baseNegatives.quality.high);
        parts.push(this.baseNegatives.anatomy.general);
        if (config.subject === 'human' || config.subject === 'portrait') {
          parts.push(this.baseNegatives.anatomy.human);
          parts.push(this.baseNegatives.anatomy.face);
        }
        parts.push(this.baseNegatives.composition.framing);
        parts.push(this.baseNegatives.composition.focus);
        parts.push(this.baseNegatives.style.general);
        break;

      case 'style-specific':
        parts.push(this.baseNegatives.quality.medium);
        if (config.style && this.baseNegatives.style[config.style as keyof typeof this.baseNegatives.style]) {
          parts.push(this.baseNegatives.style[config.style as keyof typeof this.baseNegatives.style]);
        }
        parts.push(this.baseNegatives.style.general);
        break;
    }

    // Add custom exclusions
    if (config.customExclusions && config.customExclusions.length > 0) {
      parts.push(config.customExclusions.join(', '));
    }

    return this.deduplicateTerms(parts.join(', '));
  }

  /**
   * Analyze positive prompt to suggest negative terms
   */
  analyzeForNegatives(positivePrompt: string): string[] {
    const suggestions: string[] = [];
    const lower = positivePrompt.toLowerCase();

    // Style detection
    if (lower.includes('photo') || lower.includes('realistic')) {
      suggestions.push('cartoon, anime, illustration');
    } else if (lower.includes('anime') || lower.includes('manga')) {
      suggestions.push('realistic, photorealistic');
    } else if (lower.includes('painting') || lower.includes('art')) {
      suggestions.push('photo, 3d render');
    }

    // Subject detection
    if (lower.includes('person') || lower.includes('human') || lower.includes('portrait')) {
      suggestions.push('bad anatomy, malformed face');
    } else if (lower.includes('landscape') || lower.includes('scenery')) {
      suggestions.push('people, humans, characters');
    } else if (lower.includes('animal')) {
      suggestions.push('human features, anthropomorphic');
    }

    // Quality markers
    if (lower.includes('detailed') || lower.includes('intricate')) {
      suggestions.push('simple, minimalist, low detail');
    } else if (lower.includes('simple') || lower.includes('minimalist')) {
      suggestions.push('busy, cluttered, over-detailed');
    }

    return [...new Set(suggestions)];
  }

  // Helper methods
  private buildFallbackNegative(
    config: NegativePromptConfig,
    emphasis: string = 'standard'
  ): string {
    const template = emphasis === 'minimal' ? 'minimal' :
                    emphasis === 'comprehensive' ? 'comprehensive' :
                    'standard';
    return this.buildTemplateNegative(template, config);
  }

  private cleanAndValidate(negative: string): string {
    // Remove any explanation text
    const cleaned = negative
      .replace(/^(Here's|This is|The negative prompt).*?:/gi, '')
      .replace(/\n\n.*$/s, '') // Remove trailing explanations
      .trim();

    // Validate it contains actual negative terms
    if (cleaned.length < 10 || cleaned.includes('```')) {
      return '';
    }

    return this.deduplicateTerms(cleaned);
  }

  private deduplicateTerms(text: string): string {
    const terms = text.split(',').map(t => t.trim().toLowerCase());
    const unique = [...new Set(terms)];
    return unique.join(', ');
  }
}