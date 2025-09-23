// app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SecurityValidator } from "@/lib/security/validation";

// 環境変数チェック
const isApiKeyConfigured = () => {
  return (
    process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY !== "your_openrouter_api_key_here"
  );
};

export async function POST(request: NextRequest) {
  try {
    // Allow API key from header or environment variable
    const headerKey = request.headers.get("x-openrouter-api-key");
    if (!headerKey && !isApiKeyConfigured()) {
      return NextResponse.json(
        {
          error: "APIキーが設定されていません",
          message:
            "環境変数 OPENROUTER_API_KEY を設定するか、ヘッダ x-openrouter-api-key を送信してください",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text, sourceLang, targetLang, useCustomDict } = body;

    // 入力検証
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "テキストが提供されていません" },
        { status: 400 }
      );
    }

    // セキュリティ検証
    const validation = SecurityValidator.validatePromptContent(text);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "無効なコンテンツです", issues: validation.issues },
        { status: 400 }
      );
    }

    // 翻訳サービスの動的インポート
    const { TranslatorService } = await import("@/lib/ai/translator");

    // Use headerKey if present (already read above)
    const translator = new TranslatorService(headerKey || undefined);

    // 翻訳実行
    const translated = await translator.translate(
      text,
      sourceLang || "auto",
      targetLang || "ja",
      useCustomDict ?? true
    );

    return NextResponse.json({
      original: text,
      translated,
      sourceLang: sourceLang || "auto",
      targetLang: targetLang || "ja",
    });
  } catch (error: any) {
    console.error("Translation API error:", error);

    return NextResponse.json(
      {
        error: "翻訳に失敗しました",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // APIキーのチェック
    if (!isApiKeyConfigured()) {
      return NextResponse.json(
        {
          error: "APIキーが設定されていません",
          message: "環境変数 OPENROUTER_API_KEY を設定してください",
        },
        { status: 503 }
      );
    }

    // 翻訳サービスの動的インポート
    const { translatorService } = await import("@/lib/ai/translator");
    const languages = await translatorService.getSupportedLanguages();

    return NextResponse.json({
      languages,
      message: "Supported languages retrieved successfully",
    });
  } catch (error: any) {
    console.error("Languages API error:", error);

    return NextResponse.json(
      {
        error: "言語リストの取得に失敗しました",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
