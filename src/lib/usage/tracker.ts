import { prisma } from "@/lib/db/prisma";

export class UsageTracker {
  static calculateCost(
    provider: string,
    model: string,
    tokens: number
  ): number | null {
    // 簡易コスト計算（実運用では細かい価格表を参照）
    const rate = provider === "openrouter" ? 0.0001 : 0.0002;
    return Math.round(tokens * rate * 100) / 100;
  }

  static async trackApiUsage(
    userId: string,
    provider: string,
    model: string,
    tokens: number
  ) {
    try {
      await prisma.apiUsage.create({
        data: {
          userId,
          provider,
          model,
          tokens,
          cost: this.calculateCost(provider, model, tokens) as any,
        },
      });
    } catch (e) {
      // ログに落とす、失敗しても処理を継続
      console.warn("Failed to record usage", e);
    }
  }

  static async getUserUsage(userId: string, period: "daily" | "monthly") {
    const startDate =
      period === "daily"
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return await prisma.apiUsage.aggregate({
      where: { userId, createdAt: { gte: startDate } },
      _sum: { tokens: true, cost: true },
      _count: true,
    });
  }

  static async checkRateLimit(userId: string): Promise<boolean> {
    const usage = await this.getUserUsage(userId, "daily");
    const dailyTokens = 100000; // デフォルト制限（ユーザー別の設定に置き換え可能）
    return (usage._sum.tokens ?? 0) < dailyTokens;
  }
}
