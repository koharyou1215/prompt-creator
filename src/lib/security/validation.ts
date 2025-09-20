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
    const flaggedTerms = ["explicit", "nsfw"];
    if (flaggedTerms.some((term) => content.toLowerCase().includes(term))) {
      issues.push("不適切な内容が含まれている可能性があります");
    }

    return { isValid: issues.length === 0, issues };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .trim();
  }
}
