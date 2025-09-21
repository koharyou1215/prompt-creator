import { NextRequest, NextResponse } from 'next/server';
import { TemplateSuggester } from '@/lib/ai/template-suggester';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const suggester = new TemplateSuggester();

// POST /api/templates/suggest - Get template suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, count = 3, modelId, userId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt text required' },
        { status: 400 }
      );
    }

    // Get suggestions from AI
    const suggestions = await suggester.suggestTemplates(
      prompt,
      count,
      modelId
    );

    // If user is logged in, get personalized suggestions
    if (userId) {
      // Get user's prompt history
      const { data: userPrompts } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (userPrompts && userPrompts.length > 0) {
        const personalizedSuggestions = await suggester.getPersonalizedTemplates(
          userPrompts,
          undefined,
          modelId
        );

        // Merge personalized with regular suggestions
        suggestions.push(...personalizedSuggestions);
      }
    }

    // Remove duplicates and limit to requested count
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.template, s])).values()
    ).slice(0, count);

    return NextResponse.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Template suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest templates' },
      { status: 500 }
    );
  }
}

// GET /api/templates/suggest - Get category templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const prompt = searchParams.get('prompt');

    const suggester = new TemplateSuggester();

    if (category) {
      // Get templates for specific category
      const templates = suggester.getCategoryTemplates(category);
      return NextResponse.json({ templates });
    }

    if (prompt) {
      // Auto-categorize prompt
      const detectedCategory = suggester.categorizePrompt(prompt);
      const templates = suggester.getCategoryTemplates(detectedCategory);
      return NextResponse.json({
        category: detectedCategory,
        templates
      });
    }

    // Return all category templates
    const allCategories = ['portrait', 'landscape', 'object', 'abstract'];
    const allTemplates: any = {};

    allCategories.forEach(cat => {
      allTemplates[cat] = suggester.getCategoryTemplates(cat);
    });

    return NextResponse.json({ templates: allTemplates });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get category templates' },
      { status: 500 }
    );
  }
}