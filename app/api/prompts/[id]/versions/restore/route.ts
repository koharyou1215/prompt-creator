import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/prompts/[id]/versions/restore - Restore a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { versionId } = body;

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', versionId)
      .eq('prompt_id', params.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Create a new version as a restore point
    const { data: latestVersion, error: latestError } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    // Create restore version
    const restoreData = {
      prompt_id: params.id,
      version_number: nextVersionNumber,
      content: version.content,
      elements: version.elements,
      change_summary: `Restored from version ${version.version_number}`,
      created_at: new Date().toISOString(),
      restored_from: versionId
    };

    const { data: newVersion, error: createError } = await supabase
      .from('prompt_versions')
      .insert([restoreData])
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Update the main prompt
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        content: version.content,
        elements: version.elements,
        current_version: nextVersionNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      version: newVersion,
      message: `Successfully restored version ${version.version_number}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}