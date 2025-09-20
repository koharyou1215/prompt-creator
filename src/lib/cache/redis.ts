import Redis from "ioredis";
import crypto from "crypto";

export class CacheService {
  private redis: Redis.Redis;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL || "";
    // ioredis は直接 URL を受け取る。環境に応じて接続方法を変更してください。
    this.redis = new Redis(url);
  }

  async cacheTranslation(key: string, translation: string, ttl = 3600) {
    await this.redis.setex(`trans:${key}`, ttl, translation);
  }

  async getCachedTranslation(key: string): Promise<string | null> {
    return await this.redis.get(`trans:${key}`);
  }

  async cachePromptOptimization(
    promptHash: string,
    optimized: string,
    ttl = 1800
  ) {
    await this.redis.setex(`opt:${promptHash}`, ttl, optimized);
  }

  async getCachedPromptOptimization(
    promptHash: string
  ): Promise<string | null> {
    return await this.redis.get(`opt:${promptHash}`);
  }

  async cachePromptElements(
    promptContent: string,
    elements: any[],
    ttl = 7200
  ) {
    const key = `elem:${this.hashContent(promptContent)}`;
    await this.redis.setex(key, ttl, JSON.stringify(elements));
  }

  async getCachedPromptElements(promptContent: string): Promise<any[] | null> {
    const key = `elem:${this.hashContent(promptContent)}`;
    const v = await this.redis.get(key);
    return v ? JSON.parse(v) : null;
  }

  private hashContent(content: string): string {
    return crypto.createHash("md5").update(content).digest("hex");
  }
}

export const cacheService = new CacheService();
