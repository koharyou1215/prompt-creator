import { NextRequest, NextResponse } from "next/server";
import { TemplateSuggester } from "@/lib/ai/template-suggester";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError, handleApiSuccess, validateRequiredFields } from "@/lib/api-utils";

// GET /api/templates - Get all templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const isPublic = searchParams.get("public");
    const userId = searchParams.get("userId");

    let query = supabase.from("templates").select("*");

    if (category) {
      query = query.eq("category", category);
    }
    if (type) {
      query = query.eq("type", type);
    }
    if (isPublic !== null) {
      query = query.eq("is_public", isPublic === "true");
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: templates, error } = await query.order("usage_count", {
      ascending: false,
    });

    if (error) {
      return handleApiError(error, "Failed to fetch templates");
    }

    return handleApiSuccess({ templates });
  } catch (error) {
    return handleApiError(error, "Failed to fetch templates");
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
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
      userId,
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
      updated_at: new Date().toISOString(),
    };

    const { data: template, error } = await supabase
      .from("templates")
      .insert([templateData])
      .select()
      .single();

    if (error) {
      return handleApiError(error, "Failed to create template");
    }

    return handleApiSuccess({ template });
  } catch (error) {
    return handleApiError(error, "Failed to create template");
  }
}

// PUT /api/templates - Update template
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("templates")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleApiError(error, "Failed to update template");
    }

    return handleApiSuccess({ template });
  } catch (error) {
    return handleApiError(error, "Failed to update template");
  }
}

// DELETE /api/templates - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("templates").delete().eq("id", id);

    if (error) {
      return handleApiError(error, "Failed to delete template");
    }

    return handleApiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete template");
  }
}
