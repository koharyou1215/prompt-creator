// src/lib/usage/tracker.ts
export class UsageTracker {
  private static async getPrisma() {
    // Prismaクライアントの動的インポート（実際の実装では適切なパスを指定）
    try {
      const { PrismaClient } = await import("@prisma/client");
      return new PrismaClient();
    } catch {
      console.warn("Prisma client not available");
      return null;
    }
  }

  static async trackApiUsage(
    userId: string,
    provider: string,
    model: string,
    tokens: number,
    cost?: number
  ): Promise<void> {
    const prisma = await this.getPrisma();
    if (!prisma) return;

    try {
      await prisma.apiUsage.create({
        data: {
          userId,
          provider,
          model,
          tokens,
          cost: cost || this.calculateCost(provider, model, tokens),
        },
      });
    } catch (error) {
      console.error("Failed to track API usage:", error);
    }
  }

  static async getUserUsage(
    userId: string,
    period: "daily" | "monthly" = "daily"
  ) {
    const prisma = await this.getPrisma();
    if (!prisma) {
      return { tokens: 0, cost: 0, count: 0 };
    }

    const startDate =
      period === "daily"
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const result = await prisma.apiUsage.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _sum: { tokens: true, cost: true },
        _count: true,
      });

      return {
        tokens: result._sum.tokens || 0,
        cost: result._sum.cost || 0,
        count: result._count,
      };
    } catch (error) {
      console.error("Failed to get user usage:", error);
      return { tokens: 0, cost: 0, count: 0 };
    }
  }

  static async checkRateLimit(userId: string): Promise<boolean> {
    const usage = await this.getUserUsage(userId, "daily");
    const limit = await this.getUserLimit(userId);

    return usage.tokens < limit.dailyTokens;
  }

  static async getUserLimit(
    userId: string
  ): Promise<{ dailyTokens: number; monthlyCost: number }> {
    // 実際の実装ではユーザーのプランや設定に基づいて制限を取得
    // ここではデフォルト値を返す
    return {
      dailyTokens: 100000, // 1日10万トークン
      monthlyCost: 50, // 月額50ドル
    };
  }

  static calculateCost(
    provider: string,
    model: string,
    tokens: number
  ): number {
    // 各プロバイダーとモデルの料金設定
    const pricing: Record<
      string,
      Record<string, { input: number; output: number }>
    > = {
      openrouter: {
        "anthropic/claude-3-sonnet": { input: 0.003, output: 0.015 },
        "anthropic/claude-3-haiku": { input: 0.00025, output: 0.00125 },
        "openai/gpt-4o": { input: 0.005, output: 0.015 },
        "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
        "google/gemini-pro-1.5": { input: 0.00125, output: 0.005 },
      },
    };

    const providerPricing = pricing[provider];
    if (!providerPricing) return 0;

    const modelPricing = providerPricing[model];
    if (!modelPricing) return 0;

    // 入力と出力の比率を仮定（実際の実装では正確な比率を使用）
    const inputTokens = tokens * 0.8;
    const outputTokens = tokens * 0.2;

    return (
      (inputTokens / 1000) * modelPricing.input +
      (outputTokens / 1000) * modelPricing.output
    );
  }

  static async getUsageStats(userId: string, days: number = 30) {
    const prisma = await this.getPrisma();
    if (!prisma) {
      return { dailyUsage: [], totalTokens: 0, totalCost: 0 };
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      // 日別の使用量統計
      const dailyStats = await prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          SUM(tokens) as tokens,
          SUM(cost) as cost,
          COUNT(*) as requests
        FROM ApiUsage 
        WHERE userId = ${userId} AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date
      `;

      // 総計
      const totals = await prisma.apiUsage.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _sum: { tokens: true, cost: true },
        _count: true,
      });

      return {
        dailyUsage: dailyStats,
        totalTokens: totals._sum.tokens || 0,
        totalCost: totals._sum.cost || 0,
        totalRequests: totals._count,
      };
    } catch (error) {
      console.error("Failed to get usage stats:", error);
      return { dailyUsage: [], totalTokens: 0, totalCost: 0, totalRequests: 0 };
    }
  }

  static async getModelUsage(userId: string, days: number = 30) {
    const prisma = await this.getPrisma();
    if (!prisma) {
      return [];
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const modelStats = await prisma.$queryRaw`
        SELECT 
          provider,
          model,
          SUM(tokens) as tokens,
          SUM(cost) as cost,
          COUNT(*) as requests
        FROM ApiUsage 
        WHERE userId = ${userId} AND createdAt >= ${startDate}
        GROUP BY provider, model
        ORDER BY tokens DESC
      `;

      return modelStats;
    } catch (error) {
      console.error("Failed to get model usage:", error);
      return [];
    }
  }

  static async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const prisma = await this.getPrisma();
    if (!prisma) return;

    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    try {
      await prisma.apiUsage.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
    } catch (error) {
      console.error("Failed to cleanup old usage data:", error);
    }
  }
}
