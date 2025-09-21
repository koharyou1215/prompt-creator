import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface VersionData {
  prompt_id: string;
  version_number: number;
  content: string;
  elements: any[];
  change_summary: string;
  created_at: string;
  created_by?: string;
}

// GET /api/prompts/[id]/versions - Get all versions for a prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: versions, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST /api/prompts/[id]/versions - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, elements, change_summary, created_by } = body;

    // Get the latest version number
    const { data: latestVersion, error: versionError } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    // Create new version
    const versionData: VersionData = {
      prompt_id: params.id,
      version_number: nextVersionNumber,
      content,
      elements,
      change_summary,
      created_at: new Date().toISOString(),
      created_by
    };

    const { data: newVersion, error: createError } = await supabase
      .from('prompt_versions')
      .insert([versionData])
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Update the main prompt with the latest version
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        content,
        elements,
        current_version: nextVersionNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ version: newVersion });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}