import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { customDictionary } from '@/lib/dictionary/custom-dictionary';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
);

// GET /api/dictionary - Get dictionary entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const userId = searchParams.get('userId');

    // Get user's custom dictionary from database
    if (userId) {
      const { data: userDictionary } = await supabase
        .from('user_dictionaries')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userDictionary && userDictionary.entries) {
        customDictionary.importDictionary(userDictionary.entries);
      }
    }

    let entries;

    if (category) {
      entries = customDictionary.getEntriesByCategory(category);
    } else if (query) {
      entries = customDictionary.searchEntries(query);
    } else {
      entries = customDictionary.getAllEntries();
    }

    const categories = customDictionary.getAllCategories();

    return NextResponse.json({
      entries,
      categories,
      stats: {
        totalEntries: entries.length,
        mostUsed: customDictionary.getMostUsedEntries(5)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dictionary' },
      { status: 500 }
    );
  }
}

// POST /api/dictionary - Add dictionary entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      original,
      translation,
      category,
      context,
      examples,
      priority = 5,
      userId
    } = body;

    const entry = {
      id: `custom_${Date.now()}`,
      original,
      translation,
      category,
      context,
      examples,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    customDictionary.addEntry(entry);

    // Save to user's dictionary in database
    if (userId) {
      const dictionaryData = customDictionary.exportDictionary();

      await supabase
        .from('user_dictionaries')
        .upsert({
          user_id: userId,
          entries: dictionaryData,
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add dictionary entry' },
      { status: 500 }
    );
  }
}

// PUT /api/dictionary - Update dictionary entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      );
    }

    customDictionary.updateEntry(id, updates);

    // Save to database
    if (userId) {
      const dictionaryData = customDictionary.exportDictionary();

      await supabase
        .from('user_dictionaries')
        .upsert({
          user_id: userId,
          entries: dictionaryData,
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update dictionary entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/dictionary - Delete dictionary entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      );
    }

    customDictionary.deleteEntry(id);

    // Save to database
    if (userId) {
      const dictionaryData = customDictionary.exportDictionary();

      await supabase
        .from('user_dictionaries')
        .upsert({
          user_id: userId,
          entries: dictionaryData,
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete dictionary entry' },
      { status: 500 }
    );
  }
}