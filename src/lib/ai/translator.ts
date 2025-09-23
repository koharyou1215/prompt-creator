// src/lib/ai/translator.ts
import { OpenRouterClient } from "./openrouter";
import { DEFAULT_MODELS, getSafeModelId } from "./models";
// import { cacheService } from "../cache/redis";  // Redisは一旦無効化
// import { SecurityValidator } from "../security/validation";  // 一旦無効化

export class TranslatorService {
  private client: OpenRouterClient;

  // Allow injecting an apiKey (server-side header) for server routes
  constructor(apiKey?: string) {
    // Priority: constructor arg > localStorage (client) > process.env (server)
    const resolvedKey =
      apiKey ||
      (typeof window !== "undefined"
        ? localStorage.getItem("openRouterApiKey") || ""
        : process.env.OPENROUTER_API_KEY || "");

    this.client = new OpenRouterClient(resolvedKey);
  }

  async translate(
    text: string,
    sourceLang: string = "auto",
    targetLang: string = "ja",
    useCustomDict: boolean = true
  ): Promise<string> {
    // 入力検証（簡易版）
    if (text.length > 10000) {
      throw new Error("Text too long");
    }

    // APIキーが設定されていない場合は簡易的な翻訳を返す
    const apiKey =
      typeof window !== "undefined"
        ? localStorage.getItem("openRouterApiKey") || ""
        : process.env.OPENROUTER_API_KEY || "";

    console.log(
      "Translator API key check:",
      apiKey ? "API key present" : "No API key"
    );
    console.log("Target language:", targetLang);
    console.log("API key length:", apiKey.length);
    console.log("Source language:", sourceLang);

    if (
      !apiKey ||
      apiKey === "your_openrouter_api_key_here" ||
      apiKey.length < 10
    ) {
      console.log("Using mock translation mode - API key not valid");
      // 簡易的なモック翻訳（開発用）
      if (targetLang === "en") {
        return `[Translated to English] ${text}`;
      } else {
        return `[日本語に翻訳] ${text}`;
      }
    }

    console.log("Using real translation API");

    // 設定画面で選択されたモデルを取得
    const storedModel =
      typeof window !== "undefined"
        ? localStorage.getItem("modelTranslate")
        : null;

    const selectedModel = getSafeModelId(
      storedModel || DEFAULT_MODELS.translate,
      "translate"
    );

    console.log("Final translation params:", {
      sourceLang,
      targetLang,
      selectedModel,
      textLength: text.length,
      useCustomDict,
    });

    // キャッシュは一旦スキップ

    try {
      const systemPrompt = this.buildSystemPrompt(
        sourceLang,
        targetLang,
        useCustomDict
      );
      const userPrompt = `${
        sourceLang === "auto"
          ? `Automatically detect the language and translate`
          : `Translate the following text from ${sourceLang} to`
      } ${targetLang}:\n\n${text}`;

      console.log("Stored model:", storedModel);
      console.log("Using translation model:", selectedModel);
      console.log("Input text length:", text.length);
      const calculatedMaxTokens = Math.min(text.length * 2, 1000); // より適切なmax_tokens設定
      console.log("Calculated max tokens:", calculatedMaxTokens);
      console.log("System prompt:", systemPrompt);
      console.log("User prompt:", userPrompt);

      const translated = await this.client.completeWithSystem(
        systemPrompt,
        userPrompt,
        selectedModel,
        {
          maxTokens: calculatedMaxTokens, // より適切なトークン制限
          temperature: 0.3, // 翻訳では低い温度を使用
        }
      );

      // キャッシュ保存は一旦スキップ

      console.log("Translation completed successfully:", translated);
      return translated;
    } catch (error) {
      console.error("Translation failed:", error);
      // APIエラーの場合はエラーを投げる
      throw new Error(
        `翻訳に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildSystemPrompt(
    sourceLang: string,
    targetLang: string,
    useCustomDict: boolean
  ): string {
    // API ルート2.mdで指定されたプロンプト
    const prompt = `日本語と英語の間でAI画像生成用の翻訳を行い、プロンプト構造、芸術用語、カンマ区切りを維持し、標準的な画像生成用語を使用します。

画像生成プロンプト用に次のテキストを翻訳し、カンマ区切りと専門用語を維持してください。${
      sourceLang === "ja" && targetLang === "en"
        ? "日本語から英語に"
        : targetLang === "ja"
        ? "英語から日本語に"
        : `${sourceLang}から${targetLang}に`
    }翻訳します。芸術用語、品質指標、スタイル記述子は画像生成で一般的に使用される形式で保持してください。

翻訳されたテキストのみを返してください。`;

    return prompt;
  }

  private generateCacheKey(
    text: string,
    sourceLang: string,
    targetLang: string
  ): string {
    // 簡易的なハッシュ生成
    const content = `${sourceLang}-${targetLang}-${text}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash).toString(36);
  }

  async translateBatch(
    texts: string[],
    sourceLang: string = "auto",
    targetLang: string = "ja"
  ): Promise<string[]> {
    const results: string[] = [];

    // バッチ処理で並列翻訳
    const promises = texts.map((text) =>
      this.translate(text, sourceLang, targetLang)
    );

    try {
      const translations = await Promise.all(promises);
      return translations;
    } catch (error) {
      console.error("Batch translation failed:", error);
      throw new Error("一括翻訳に失敗しました");
    }
  }

  async getSupportedLanguages(): Promise<{ code: string; name: string }[]> {
    return [
      { code: "ja", name: "日本語" },
      { code: "en", name: "English" },
      { code: "ko", name: "한국어" },
      { code: "zh", name: "中文" },
      { code: "es", name: "Español" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
      { code: "it", name: "Italiano" },
      { code: "pt", name: "Português" },
      { code: "ru", name: "Русский" },
    ];
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const systemPrompt = `
You are a language detection expert. Analyze the following text and return ONLY the ISO 639-1 language code.

Examples:
- English text → "en"
- 日本語のテキスト → "ja"
- 한국어 텍스트 → "ko"
- 中文文本 → "zh"

Return ONLY the language code, nothing else.`;
      console.log("Language detection input:", text);
      const detected = await this.client.completeWithSystem(
        systemPrompt,
        text,
        DEFAULT_MODELS.analysis,
        { maxTokens: 10, temperature: 0.1 }
      );

      console.log("Language detection raw result:", detected);

      // 結果をクリーンアップ
      const languageCode = detected
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

      console.log("Cleaned language code:", languageCode);

      // サポートされている言語かチェック
      const supportedLanguages = await this.getSupportedLanguages();
      const supportedCodes = supportedLanguages.map((lang) => lang.code);

      console.log("Supported codes:", supportedCodes);
      console.log("Detected code:", languageCode);

      if (supportedCodes.includes(languageCode)) {
        console.log("Language code is supported:", languageCode);
        return languageCode;
      } else {
        console.log("Language code not supported, using auto:", languageCode);
        return "auto"; // サポートされていない場合は自動検出
      }
    } catch (error) {
      console.error("Language detection failed:", error);
      return "auto";
    }
  }
}

// シングルトンインスタンス
export const translatorService = new TranslatorService();
