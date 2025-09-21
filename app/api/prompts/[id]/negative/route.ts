import { NextRequest, NextResponse } from 'next/server';
import { NegativePromptGenerator } from '@/lib/ai/negative-generator';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/prompts/[id]/negative - Generate negative prompt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      style,
      subject,
      quality = 'high',
      customExclusions,
      modelId,
      generateVariations = false,
      variationCount = 3
    } = body;

    // Get the prompt
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const generator = new NegativePromptGenerator();
    const config = {
      style,
      subject,
      quality,
      customExclusions
    };

    let result;

    if (generateVariations) {
      // Generate multiple negative prompt variations
      const negatives = await generator.generateNegativeVariations(
        prompt.content,
        variationCount,
        config,
        modelId
      );

      result = {
        negatives,
        type: 'variations',
        count: negatives.length
      };
    } else {
      // Generate single optimized negative prompt
      const negative = await generator.generateNegativePrompt(
        prompt.content,
        config,
        modelId
      );

      result = {
        negative,
        type: 'single'
      };
    }

    // Save to prompt metadata
    await supabase
      .from('prompts')
      .update({
        negative_prompt: generateVariations ? result.negatives[0] : result.negative,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Negative prompt generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate negative prompt' },
      { status: 500 }
    );
  }
}

// GET /api/prompts/[id]/negative - Get negative prompt templates
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const generator = new NegativePromptGenerator();

    // Get the prompt to determine context
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Analyze prompt to determine style and subject
    const analysis = generator.analyzeForNegatives(prompt.content);

    // Generate template-based negatives
    const templates = {
      minimal: generator.buildTemplateNegative('minimal'),
      standard: generator.buildTemplateNegative('standard'),
      comprehensive: generator.buildTemplateNegative('comprehensive'),
      styleSpecific: generator.buildTemplateNegative('style-specific', {
        style: prompt.metadata?.style || 'general'
      })
    };

    return NextResponse.json({
      templates,
      suggestions: analysis,
      currentNegative: prompt.negative_prompt
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get negative prompt templates' },
      { status: 500 }
    );
  }
}