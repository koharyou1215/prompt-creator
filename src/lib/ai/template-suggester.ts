import { openRouterRequest } from './openrouter-request';
import { Prompt } from '@/types/prompt';

interface TemplateSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  elements: any[];
  confidence: number;
  reasoning: string;
}

export class TemplateSuggester {
  private readonly templateCategories = {
    portrait: {
      keywords: ['person', 'face', 'portrait', 'headshot', 'character', '人物', '顔', 'ポートレート'],
      templates: [
        {
          name: 'Professional Portrait',
          template: '[subject], professional photography, studio lighting, sharp focus, high resolution, bokeh background',
        },
        {
          name: 'Artistic Portrait',
          template: '[subject], artistic portrait, dramatic lighting, [mood] atmosphere, creative composition',
        },
        {
          name: 'Character Design',
          template: '[character description], full body, character sheet, multiple angles, concept art style',
        }
      ]
    },
    landscape: {
      keywords: ['landscape', 'scenery', 'nature', 'environment', '風景', '自然', '環境'],
      templates: [
        {
          name: 'Epic Landscape',
          template: '[location], epic landscape, golden hour, dramatic sky, wide angle, photorealistic',
        },
        {
          name: 'Fantasy Environment',
          template: '[environment], fantasy landscape, magical atmosphere, vibrant colors, detailed',
        },
        {
          name: 'Minimalist Scene',
          template: '[scene], minimalist composition, simple colors, clean aesthetic, peaceful mood',
        }
      ]
    },
    object: {
      keywords: ['object', 'product', 'item', 'thing', '物体', '製品', 'アイテム'],
      templates: [
        {
          name: 'Product Shot',
          template: '[product], product photography, white background, studio lighting, high detail',
        },
        {
          name: 'Artistic Object',
          template: '[object], artistic rendering, creative lighting, interesting angle, detailed texture',
        }
      ]
    },
    abstract: {
      keywords: ['abstract', 'pattern', 'texture', 'conceptual', '抽象', 'パターン', 'テクスチャ'],
      templates: [
        {
          name: 'Abstract Art',
          template: 'abstract [concept], flowing shapes, vibrant colors, dynamic composition',
        },
        {
          name: 'Geometric Pattern',
          template: 'geometric [pattern], symmetrical design, [color scheme], mathematical precision',
        }
      ]
    }
  };

  /**
   * Analyze prompt and suggest appropriate templates
   */
  async suggestTemplates(
    prompt: string | Prompt,
    count: number = 3,
    modelId?: string
  ): Promise<TemplateSuggestion[]> {
    const promptText = typeof prompt === 'string' ? prompt : prompt.content;

    const systemPrompt = `You are an expert at analyzing prompts and suggesting appropriate templates.
Analyze the given prompt and suggest the most suitable templates that could enhance or structure it better.`;

    const userPrompt = `Analyze this prompt and suggest ${count} appropriate templates:

Prompt: "${promptText}"

For each template suggestion, provide:
1. Name: A descriptive name for the template
2. Category: portrait/landscape/object/abstract/custom
3. Template: The actual template structure with [placeholders] for variable parts
4. Elements: Key elements that should be customized
5. Confidence: 0-100 score for how well this matches
6. Reasoning: Why this template is suitable

Format as JSON array of suggestions.`;

    try {
      const response = await openRouterRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: modelId || 'anthropic/claude-sonnet-4',
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response || '[]';
      const suggestions = this.parseSuggestions(content);

      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(promptText);
    } catch (error) {
      console.error('Template suggestion failed:', error);
      return this.getFallbackSuggestions(promptText);
    }
  }

  /**
   * Get templates based on user history and preferences
   */
  async getPersonalizedTemplates(
    userHistory: Prompt[],
    preferences?: any,
    modelId?: string
  ): Promise<TemplateSuggestion[]> {
    // Analyze user history to find patterns
    const patterns = this.analyzeUserPatterns(userHistory);

    const systemPrompt = `You are an expert at personalizing template suggestions based on user behavior.`;

    const userPrompt = `Based on this user's prompt history, suggest personalized templates:

User patterns:
- Most used categories: ${patterns.topCategories.join(', ')}
- Common elements: ${patterns.commonElements.join(', ')}
- Preferred styles: ${patterns.styles.join(', ')}

Suggest 5 templates that match their preferences.

Format as JSON array with: name, category, template, confidence, reasoning`;

    try {
      const response = await openRouterRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: modelId || 'anthropic/claude-sonnet-4',
        temperature: 0.6,
        max_tokens: 800
      });

      const content = response || '[]';
      return this.parseSuggestions(content);
    } catch (error) {
      console.error('Personalized template suggestion failed:', error);
      return [];
    }
  }

  /**
   * Improve existing prompt using template
   */
  async improveWithTemplate(
    prompt: string,
    templateId?: string,
    modelId?: string
  ): Promise<string> {
    const systemPrompt = `You are an expert at improving prompts using structured templates.
Enhance the given prompt while maintaining its core intent.`;

    const userPrompt = `Improve this prompt using best practices and structure:

Original: "${prompt}"

Requirements:
- Maintain the original intent
- Add relevant details and modifiers
- Structure it properly
- Make it more effective for image generation

Return only the improved prompt.`;

    try {
      const response = await openRouterRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: modelId || 'anthropic/claude-sonnet-4',
        temperature: 0.5,
        max_tokens: 300
      });

      return response || prompt;
    } catch (error) {
      console.error('Template improvement failed:', error);
      return prompt;
    }
  }

  /**
   * Auto-categorize prompt
   */
  categorizePrompt(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    for (const [category, config] of Object.entries(this.templateCategories)) {
      if (config.keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return category;
      }
    }

    return 'custom';
  }

  /**
   * Get category-specific templates
   */
  getCategoryTemplates(category: string): any[] {
    return this.templateCategories[category as keyof typeof this.templateCategories]?.templates || [];
  }

  // Helper methods
  private parseSuggestions(content: string): TemplateSuggestion[] {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((s, index) => ({
          id: `suggestion_${Date.now()}_${index}`,
          name: s.name || 'Untitled Template',
          description: s.description || '',
          category: s.category || 'custom',
          template: s.template || '',
          elements: s.elements || [],
          confidence: s.confidence || 50,
          reasoning: s.reasoning || ''
        }));
      }
    } catch {
      // Try to extract from text
      const suggestions: TemplateSuggestion[] = [];
      const lines = content.split('\n');

      let current: any = {};
      lines.forEach(line => {
        if (line.includes('Name:')) {
          if (current.name) {
            suggestions.push({
              id: `suggestion_${Date.now()}_${suggestions.length}`,
              ...current,
              confidence: current.confidence || 50
            });
          }
          current = { name: line.split('Name:')[1].trim() };
        } else if (line.includes('Template:')) {
          current.template = line.split('Template:')[1].trim();
        } else if (line.includes('Category:')) {
          current.category = line.split('Category:')[1].trim();
        }
      });

      if (current.name) {
        suggestions.push({
          id: `suggestion_${Date.now()}_${suggestions.length}`,
          ...current,
          confidence: 50
        });
      }

      return suggestions;
    }
    return [];
  }

  private getFallbackSuggestions(prompt: string): TemplateSuggestion[] {
    const category = this.categorizePrompt(prompt);
    const categoryTemplates = this.getCategoryTemplates(category);

    return categoryTemplates.slice(0, 3).map((t, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      name: t.name,
      description: `${category} template suggestion`,
      category,
      template: t.template,
      elements: this.extractPlaceholders(t.template),
      confidence: 60,
      reasoning: `Matched based on ${category} keywords`
    }));
  }

  private extractPlaceholders(template: string): string[] {
    const matches = template.match(/\[([^\]]+)\]/g);
    return matches ? matches.map(m => m.slice(1, -1)) : [];
  }

  private analyzeUserPatterns(history: Prompt[]) {
    const categories: Record<string, number> = {};
    const elements: Record<string, number> = {};
    const styles: Record<string, number> = {};

    history.forEach(prompt => {
      // Count categories
      const category = this.categorizePrompt(prompt.content);
      categories[category] = (categories[category] || 0) + 1;

      // Extract common elements
      prompt.elements?.forEach(el => {
        elements[el.type] = (elements[el.type] || 0) + 1;

        // Extract style keywords
        if (el.content.includes('style') || el.content.includes('art')) {
          const styleMatch = el.content.match(/(\w+)\s*(style|art)/gi);
          if (styleMatch) {
            styleMatch.forEach(s => {
              styles[s] = (styles[s] || 0) + 1;
            });
          }
        }
      });
    });

    return {
      topCategories: Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat),
      commonElements: Object.entries(elements)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([el]) => el),
      styles: Object.entries(styles)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([style]) => style)
    };
  }
}