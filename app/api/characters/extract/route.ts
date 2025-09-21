import { NextRequest, NextResponse } from 'next/server';
import { openRouterRequest } from '@/lib/ai/openrouter';

// POST /api/characters/extract - Extract character from prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt text required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at extracting character descriptions from prompts.
Analyze the given prompt and extract detailed character information.`;

    const userPrompt = `Extract character information from this prompt:

"${prompt}"

Extract and provide:
1. Name: Character name if mentioned, otherwise suggest one
2. Description: Brief character description
3. Appearance:
   - Hair: Color, style, length
   - Eyes: Color, shape
   - Outfit: Clothing description
   - Accessories: Any mentioned accessories
   - Physique: Body type if mentioned
4. Personality: Character traits if described
5. Background: Any backstory elements
6. Tags: Relevant tags for categorization

Format as JSON with these exact keys: name, description, appearance (object), personality, background, tags (array)`;

    const response = await openRouterRequest({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: modelId || 'anthropic/claude-sonnet-4',
      temperature: 0.5,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || '{}';

    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch {
      // Try to extract from text
      extractedData = extractFromText(content);
    }

    // Ensure required fields
    const character = {
      name: extractedData.name || 'Unnamed Character',
      description: extractedData.description || '',
      appearance: {
        hair: extractedData.appearance?.hair || 'Not specified',
        eyes: extractedData.appearance?.eyes || 'Not specified',
        outfit: extractedData.appearance?.outfit || 'Not specified',
        accessories: extractedData.appearance?.accessories || '',
        physique: extractedData.appearance?.physique || ''
      },
      personality: extractedData.personality || '',
      background: extractedData.background || '',
      tags: extractedData.tags || [],
      prompts: [prompt],
      referenceImages: []
    };

    return NextResponse.json({ character });
  } catch (error) {
    console.error('Character extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract character' },
      { status: 500 }
    );
  }
}

function extractFromText(text: string): any {
  const result: any = {
    appearance: {}
  };

  // Try to extract name
  const nameMatch = text.match(/Name:?\s*([^\n]+)/i);
  if (nameMatch) result.name = nameMatch[1].trim();

  // Extract description
  const descMatch = text.match(/Description:?\s*([^\n]+)/i);
  if (descMatch) result.description = descMatch[1].trim();

  // Extract appearance details
  const hairMatch = text.match(/Hair:?\s*([^\n]+)/i);
  if (hairMatch) result.appearance.hair = hairMatch[1].trim();

  const eyesMatch = text.match(/Eyes?:?\s*([^\n]+)/i);
  if (eyesMatch) result.appearance.eyes = eyesMatch[1].trim();

  const outfitMatch = text.match(/Outfit|Clothing:?\s*([^\n]+)/i);
  if (outfitMatch) result.appearance.outfit = outfitMatch[1].trim();

  // Extract personality
  const personalityMatch = text.match(/Personality:?\s*([^\n]+)/i);
  if (personalityMatch) result.personality = personalityMatch[1].trim();

  // Extract tags
  const tagsMatch = text.match(/Tags?:?\s*([^\n]+)/i);
  if (tagsMatch) {
    result.tags = tagsMatch[1]
      .split(/[,;]/)
      .map(tag => tag.trim())
      .filter(tag => tag);
  }

  return result;
}