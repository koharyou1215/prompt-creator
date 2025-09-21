import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/prompts/[id]/versions/compare - Compare two versions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { versionIds } = body;

    if (!versionIds || versionIds.length !== 2) {
      return NextResponse.json(
        { error: 'Exactly two version IDs required for comparison' },
        { status: 400 }
      );
    }

    // Fetch both versions
    const { data: versions, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', params.id)
      .in('id', versionIds)
      .order('version_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!versions || versions.length !== 2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      );
    }

    const [oldVersion, newVersion] = versions;

    // Generate diff analysis
    const diff = {
      versions: {
        old: oldVersion,
        new: newVersion
      },
      changes: {
        content: analyzeContentChanges(oldVersion.content, newVersion.content),
        elements: analyzeElementChanges(oldVersion.elements, newVersion.elements),
        metadata: {
          version_diff: newVersion.version_number - oldVersion.version_number,
          time_diff: calculateTimeDiff(oldVersion.created_at, newVersion.created_at)
        }
      }
    };

    return NextResponse.json({ comparison: diff });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    );
  }
}

function analyzeContentChanges(oldContent: string, newContent: string) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const changes = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    diff: [] as any[]
  };

  // Simple line-based diff
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined && newLine !== undefined) {
      changes.additions++;
      changes.diff.push({ type: 'add', line: i + 1, content: newLine });
    } else if (oldLine !== undefined && newLine === undefined) {
      changes.deletions++;
      changes.diff.push({ type: 'delete', line: i + 1, content: oldLine });
    } else if (oldLine !== newLine) {
      changes.modifications++;
      changes.diff.push({
        type: 'modify',
        line: i + 1,
        oldContent: oldLine,
        newContent: newLine
      });
    }
  }

  return changes;
}

function analyzeElementChanges(oldElements: any[], newElements: any[]) {
  const changes = {
    added: [] as any[],
    removed: [] as any[],
    modified: [] as any[],
    reordered: false
  };

  const oldMap = new Map(oldElements.map(el => [el.id, el]));
  const newMap = new Map(newElements.map(el => [el.id, el]));

  // Find added elements
  newElements.forEach(el => {
    if (!oldMap.has(el.id)) {
      changes.added.push(el);
    }
  });

  // Find removed elements
  oldElements.forEach(el => {
    if (!newMap.has(el.id)) {
      changes.removed.push(el);
    }
  });

  // Find modified elements
  oldElements.forEach(el => {
    const newEl = newMap.get(el.id);
    if (newEl && JSON.stringify(el) !== JSON.stringify(newEl)) {
      changes.modified.push({
        id: el.id,
        old: el,
        new: newEl
      });
    }
  });

  // Check if order changed
  const oldOrder = oldElements.map(el => el.id).join(',');
  const newOrder = newElements.map(el => el.id).join(',');
  changes.reordered = oldOrder !== newOrder;

  return changes;
}

function calculateTimeDiff(oldDate: string, newDate: string): string {
  const diff = new Date(newDate).getTime() - new Date(oldDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}