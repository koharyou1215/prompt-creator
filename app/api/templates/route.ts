import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TemplateSuggester } from '@/lib/ai/template-suggester';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/templates - Get all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const isPublic = searchParams.get('public');
    const userId = searchParams.get('userId');

    let query = supabase.from('templates').select('*');

    if (category) {
      query = query.eq('category', category);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true');
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: templates, error } = await query
      .order('usage_count', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      type,
      content,
      elements,
      tags,
      isPublic,
      userId
    } = body;

    const templateData = {
      name,
      description,
      category,
      type,
      content,
      elements,
      tags,
      is_public: isPublic || false,
      user_id: userId,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: template, error } = await supabase
      .from('templates')
      .insert([templateData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('templates')
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

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}