// src/lib/security/validation.ts
export class SecurityValidator {
  static validatePromptContent(content: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 悪意のあるスクリプト検出
    if (/<script|javascript:|data:text\/html/i.test(content)) {
      issues.push("潜在的に危険なコンテンツが検出されました");
    }

    // 過度に長いプロンプトの検出
    if (content.length > 10000) {
      issues.push("プロンプトが長すぎます（10000文字制限）");
    }

    // 不適切な内容の簡易チェック
    const flaggedTerms = ["explicit", "nsfw", "adult", "violence", "hate"];
    if (flaggedTerms.some((term) => content.toLowerCase().includes(term))) {
      issues.push("不適切な内容が含まれている可能性があります");
    }

    // 特殊文字の過度な使用
    const specialCharCount = (
      content.match(/[!@#$%^&*()_+=\[\]{}|;':",./<>?]/g) || []
    ).length;
    if (specialCharCount > content.length * 0.3) {
      issues.push("特殊文字が多すぎます");
    }

    return { isValid: issues.length === 0, issues };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "") // onclick, onload などのイベントハンドラを削除
      .replace(/data:text\/html/gi, "")
      .trim();
  }

  static validateTitle(title: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!title || title.trim().length === 0) {
      issues.push("タイトルは必須です");
    }

    if (title.length > 200) {
      issues.push("タイトルが長すぎます（200文字制限）");
    }

    if (title.includes("<") || title.includes(">")) {
      issues.push("タイトルにHTMLタグは使用できません");
    }

    return { isValid: issues.length === 0, issues };
  }

  static validateTags(tags: string[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (tags.length > 20) {
      issues.push("タグは20個までです");
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        issues.push("タグは50文字以内にしてください");
      }

      if (
        !/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-_]+$/.test(tag)
      ) {
        issues.push("タグに使用できない文字が含まれています");
      }
    }

    return { isValid: issues.length === 0, issues };
  }

  static validateApiKey(apiKey: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!apiKey || apiKey.trim().length === 0) {
      issues.push("APIキーは必須です");
    }

    if (apiKey.length < 20) {
      issues.push("APIキーが短すぎます");
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(apiKey)) {
      issues.push("APIキーの形式が正しくありません");
    }

    return { isValid: issues.length === 0, issues };
  }

  static validateUserId(userId: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!userId || userId.trim().length === 0) {
      issues.push("ユーザーIDは必須です");
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(userId)) {
      issues.push("ユーザーIDの形式が正しくありません");
    }

    return { isValid: issues.length === 0, issues };
  }

  static rateLimitCheck(
    userId: string,
    action: string,
    windowMs: number = 60000
  ): boolean {
    // 簡易的なレート制限チェック（実際の実装ではRedisなどを使用）
    const key = `rate_limit:${userId}:${action}`;
    const now = Date.now();
    const lastRequest = parseInt(localStorage.getItem(key) || "0");

    if (now - lastRequest < windowMs) {
      return false; // レート制限に引っかかった
    }

    localStorage.setItem(key, now.toString());
    return true; // OK
  }

  static sanitizeHtml(html: string): string {
    const allowedTags = ["b", "i", "em", "strong", "p", "br", "span"];
    const allowedAttributes = ["class", "style"];

    // 簡易的なHTMLサニタイゼーション
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, (match) => {
        const tagMatch = match.match(/^<(\w+)/);
        if (!tagMatch) return "";

        const tagName = tagMatch[1].toLowerCase();
        if (!allowedTags.includes(tagName)) return "";

        return match;
      });
  }
}
