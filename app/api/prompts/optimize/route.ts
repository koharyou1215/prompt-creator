import { NextRequest, NextResponse } from "next/server";
import { PromptOptimizer } from "@/lib/ai/optimizer";
import { handleApiError, handleApiSuccess } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get API key from localStorage/headers
    const apiKey =
      request.headers.get("x-openrouter-api-key") ||
      process.env.OPENROUTER_API_KEY ||
      null;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 401 }
      );
    }

    const optimizer = new PromptOptimizer(apiKey);
    const optimizedPrompt = await optimizer.optimizePrompt(prompt, modelId);

    // Return plain JSON (not wrapped) so client code that expects
    // { original, optimized } continues to work.
    return NextResponse.json({
      original: prompt,
      optimized: optimizedPrompt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Optimization error:", error);
    return handleApiError(error, "Failed to optimize prompt");
  }
}
