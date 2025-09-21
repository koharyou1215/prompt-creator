import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/characters - Get all characters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tags = searchParams.get('tags');

    let query = supabase.from('characters').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    const { data: characters, error } = await query
      .order('usage_count', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ characters });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// POST /api/characters - Create new character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      appearance,
      personality,
      background,
      tags,
      referenceImages,
      prompts,
      userId
    } = body;

    const characterData = {
      name,
      description,
      appearance,
      personality,
      background,
      tags: tags || [],
      reference_images: referenceImages || [],
      prompts: prompts || [],
      user_id: userId,
      is_favorite: false,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: character, error } = await supabase
      .from('characters')
      .insert([characterData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ character });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

// PUT /api/characters - Update character
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Character ID required' },
        { status: 400 }
      );
    }

    const { data: character, error } = await supabase
      .from('characters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ character });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// DELETE /api/characters - Delete character
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Character ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}