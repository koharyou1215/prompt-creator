import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/prompts/[id]/versions/[versionId] - Get specific version
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const { data: version, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', params.id)
      .eq('id', params.versionId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id]/versions/[versionId] - Delete a version
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    // Check if this is not the current version
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('current_version')
      .eq('id', params.id)
      .single();

    if (promptError) {
      return NextResponse.json({ error: promptError.message }, { status: 500 });
    }

    const { data: version, error: versionError } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('id', params.versionId)
      .single();

    if (versionError) {
      return NextResponse.json({ error: versionError.message }, { status: 500 });
    }

    if (prompt.current_version === version.version_number) {
      return NextResponse.json(
        { error: 'Cannot delete current version' },
        { status: 400 }
      );
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('prompt_versions')
      .delete()
      .eq('id', params.versionId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete version' },
      { status: 500 }
    );
  }
}