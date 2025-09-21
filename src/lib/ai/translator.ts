// src/lib/ai/translator.ts
import { OpenRouterClient } from "./openrouter";
import { DEFAULT_MODELS } from "./models";
// import { cacheService } from "../cache/redis";  // Redisは一旦無効化
// import { SecurityValidator } from "../security/validation";  // 一旦無効化

export class TranslatorService {
  private client: OpenRouterClient;

  constructor() {
    this.client = new OpenRouterClient();
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
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "your_openrouter_api_key_here") {
      // 簡易的なモック翻訳（開発用）
      if (targetLang === "en") {
        return `[Translated to English] ${text}`;
      } else {
        return `[日本語に翻訳] ${text}`;
      }
    }

    // キャッシュは一旦スキップ

    try {
      const systemPrompt = this.buildSystemPrompt(
        sourceLang,
        targetLang,
        useCustomDict
      );
      const userPrompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`;

      const translated = await this.client.completeWithSystem(
        systemPrompt,
        userPrompt,
        DEFAULT_MODELS.translate,
        {
          maxTokens: Math.min(text.length * 2, 4000),
          temperature: 0.3, // 翻訳では低い温度を使用
        }
      );

      // キャッシュ保存は一旦スキップ

      return translated;
    } catch (error) {
      console.error("Translation failed:", error);
      // APIエラーの場合はエラーを投げる
      throw new Error(`翻訳に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(
    sourceLang: string,
    targetLang: string,
    useCustomDict: boolean
  ): string {
    let prompt = `You are a professional translator. Translate the given text from ${sourceLang} to ${targetLang}.`;

    if (useCustomDict) {
      prompt +=
        "\n\nUse these specialized terms for image generation prompts:\n";
      prompt += '- "beautiful" → "美しい"\n';
      prompt += '- "detailed" → "詳細な"\n';
      prompt += '- "high quality" → "高品質な"\n';
      prompt += '- "art style" → "アートスタイル"\n';
      prompt += '- "digital art" → "デジタルアート"\n';
      prompt += '- "photorealistic" → "フォトリアル"\n';
      prompt += '- "anime style" → "アニメスタイル"\n';
      prompt += '- "portrait" → "ポートレート"\n';
      prompt += '- "landscape" → "風景"\n';
      prompt += '- "lighting" → "照明"\n';
      prompt += '- "composition" → "構図"\n';
    }

    prompt += "\n\nGuidelines:\n";
    prompt += "1. Maintain the original meaning and tone\n";
    prompt += "2. Keep technical terms appropriate for the context\n";
    prompt += "3. Preserve any special formatting or punctuation\n";
    prompt += "4. Return only the translated text without explanations\n";

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
      const systemPrompt =
        'Detect the language of the given text and return only the ISO 639-1 language code (e.g., "en", "ja", "ko").';
      const detected = await this.client.completeWithSystem(
        systemPrompt,
        text,
        DEFAULT_MODELS.analysis,
        { maxTokens: 10, temperature: 0.1 }
      );

      // 結果をクリーンアップ
      const languageCode = detected
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

      // サポートされている言語かチェック
      const supportedLanguages = await this.getSupportedLanguages();
      const supportedCodes = supportedLanguages.map((lang) => lang.code);

      if (supportedCodes.includes(languageCode)) {
        return languageCode;
      } else {
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
