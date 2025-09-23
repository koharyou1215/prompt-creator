// src/lib/usage/tracker.ts
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface ApiUsageData {
  user_id: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  created_at?: string;
}

export class UsageTracker {
  static async trackApiUsage(
    userId: string,
    provider: string,
    model: string,
    tokens: number,
    cost?: number
  ): Promise<void> {
    const supabase = createServerSupabaseClient();

    try {
      const usageData: ApiUsageData = {
        user_id: userId,
        provider,
        model,
        tokens,
        cost: cost || this.calculateCost(provider, model, tokens),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("api_usage").insert([usageData]);

      if (error) {
        console.error("Failed to track API usage:", error);
      }
    } catch (error) {
      console.error("Failed to track API usage:", error);
    }
  }

  static async getUserUsage(
    userId: string,
    period: "daily" | "monthly" = "daily"
  ) {
    const supabase = createServerSupabaseClient();

    const startDate =
      period === "daily"
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase
        .from("api_usage")
        .select("tokens, cost")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString());

      if (error) {
        console.error("Failed to get user usage:", error);
        return { tokens: 0, cost: 0, count: 0 };
      }

      const totalTokens =
        data?.reduce((sum, row) => sum + (row.tokens || 0), 0) || 0;
      const totalCost =
        data?.reduce((sum, row) => sum + (row.cost || 0), 0) || 0;

      return {
        tokens: totalTokens,
        cost: totalCost,
        count: data?.length || 0,
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
    // Default limits - can be customized per user in the future
    return {
      dailyTokens: 100000, // 100k tokens per day
      monthlyCost: 50, // $50 per month
    };
  }

  static calculateCost(
    provider: string,
    model: string,
    tokens: number
  ): number {
    // Pricing per 1000 tokens
    const pricing: Record<
      string,
      Record<string, { input: number; output: number }>
    > = {
      openrouter: {
        "anthropic/claude-sonnet-4": { input: 0.003, output: 0.015 },
        "anthropic/claude-opus-4": { input: 0.015, output: 0.075 },
        "anthropic/claude-3-haiku-20240307": {
          input: 0.00025,
          output: 0.00125,
        },
        "openai/gpt-4o": { input: 0.005, output: 0.015 },
        "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
        "google/gemini-2.5-flash": { input: 0.00125, output: 0.005 },
        "google/gemini-2.5-pro": { input: 0.0035, output: 0.014 },
        "x-ai/grok-4": { input: 0.005, output: 0.015 },
        "x-ai/grok-4-fast:free": { input: 0.0, output: 0.0 },
      },
      gemini: {
        "google/gemini-2.5-flash": { input: 0.00125, output: 0.005 },
        "gemini-2.5-flash-light": { input: 0.0005, output: 0.002 },
        "google/gemini-2.5-pro": { input: 0.0035, output: 0.014 },
      },
    };

    const providerPricing = pricing[provider];
    if (!providerPricing) return 0;

    const modelPricing = providerPricing[model];
    if (!modelPricing) return 0;

    // Assume 80% input, 20% output ratio
    const inputTokens = tokens * 0.8;
    const outputTokens = tokens * 0.2;

    return (
      (inputTokens / 1000) * modelPricing.input +
      (outputTokens / 1000) * modelPricing.output
    );
  }

  static async getUsageStats(userId: string, days: number = 30) {
    const supabase = createServerSupabaseClient();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase
        .from("api_usage")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to get usage stats:", error);
        return {
          dailyUsage: [],
          totalTokens: 0,
          totalCost: 0,
          totalRequests: 0,
        };
      }

      // Group by day
      const dailyUsage: Record<
        string,
        { tokens: number; cost: number; requests: number }
      > = {};

      data?.forEach((row) => {
        const date = new Date(row.created_at).toISOString().split("T")[0];
        if (!dailyUsage[date]) {
          dailyUsage[date] = { tokens: 0, cost: 0, requests: 0 };
        }
        dailyUsage[date].tokens += row.tokens || 0;
        dailyUsage[date].cost += row.cost || 0;
        dailyUsage[date].requests += 1;
      });

      const dailyUsageArray = Object.entries(dailyUsage).map(
        ([date, stats]) => ({
          date,
          ...stats,
        })
      );

      const totalTokens =
        data?.reduce((sum, row) => sum + (row.tokens || 0), 0) || 0;
      const totalCost =
        data?.reduce((sum, row) => sum + (row.cost || 0), 0) || 0;

      return {
        dailyUsage: dailyUsageArray,
        totalTokens,
        totalCost,
        totalRequests: data?.length || 0,
      };
    } catch (error) {
      console.error("Failed to get usage stats:", error);
      return { dailyUsage: [], totalTokens: 0, totalCost: 0, totalRequests: 0 };
    }
  }

  static async getModelUsage(userId: string, days: number = 30) {
    const supabase = createServerSupabaseClient();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase
        .from("api_usage")
        .select("provider, model, tokens, cost")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString());

      if (error) {
        console.error("Failed to get model usage:", error);
        return [];
      }

      // Group by provider and model
      const modelUsage: Record<
        string,
        { tokens: number; cost: number; requests: number }
      > = {};

      data?.forEach((row) => {
        const key = `${row.provider}:${row.model}`;
        if (!modelUsage[key]) {
          modelUsage[key] = { tokens: 0, cost: 0, requests: 0 };
        }
        modelUsage[key].tokens += row.tokens || 0;
        modelUsage[key].cost += row.cost || 0;
        modelUsage[key].requests += 1;
      });

      return Object.entries(modelUsage).map(([key, stats]) => {
        const [provider, model] = key.split(":");
        return {
          provider,
          model,
          ...stats,
        };
      });
    } catch (error) {
      console.error("Failed to get model usage:", error);
      return [];
    }
  }

  static async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const supabase = createServerSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    try {
      const { error } = await supabase
        .from("api_usage")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) {
        console.error("Failed to cleanup old usage data:", error);
      }
    } catch (error) {
      console.error("Failed to cleanup old usage data:", error);
    }
  }
}
