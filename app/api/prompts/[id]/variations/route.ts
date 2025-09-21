import { NextRequest, NextResponse } from 'next/server';
import { VariationEngine } from '@/lib/ai/variation-engine';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/prompts/[id]/variations - Generate variations
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      strategy = 'style',
      count = 3,
      modelId,
      elements,
      saveToHistory = false
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

    const engine = new VariationEngine();
    let variations: string[] = [];

    if (elements && elements.length > 0) {
      // Generate variations for specific elements
      const variationMap = await engine.generateBatchVariations(
        elements,
        strategy,
        count,
        modelId
      );

      // Combine variations
      variations = engine.combineVariations(
        elements,
        variationMap,
        count
      );
    } else {
      // Generate smart variations for all elements
      const promptElements = prompt.elements || [];
      const allVariations: string[] = [];

      for (const element of promptElements) {
        const elementVariations = await engine.generateSmartVariations(
          element,
          1,
          modelId
        );
        allVariations.push(...elementVariations);
      }

      variations = allVariations.slice(0, count);
    }

    // Save to history if requested
    if (saveToHistory && variations.length > 0) {
      const variationRecords = variations.map((variation, index) => ({
        prompt_id: params.id,
        content: variation,
        type: 'variation',
        strategy,
        order_index: index,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('prompt_variations')
        .insert(variationRecords);
    }

    return NextResponse.json({
      variations,
      strategy,
      count: variations.length
    });
  } catch (error) {
    console.error('Variation generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate variations' },
      { status: 500 }
    );
  }
}

// GET /api/prompts/[id]/variations - Get saved variations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: variations, error } = await supabase
      .from('prompt_variations')
      .select('*')
      .eq('prompt_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ variations });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch variations' },
      { status: 500 }
    );
  }
}