import Redis from "ioredis";
import crypto from "crypto";

export class CacheService {
  private redis: Redis | null = null;

  constructor() {
    // Redis接続は環境変数がある場合のみ
    if (process.env.UPSTASH_REDIS_REST_URL) {
      this.redis = new Redis(process.env.UPSTASH_REDIS_REST_URL);
    }
  }

  private isAvailable(): boolean {
    return this.redis !== null;
  }

  async cacheTranslation(
    key: string,
    translation: string,
    ttl = 3600
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.setex(`trans:${key}`, ttl, translation);
    } catch (error) {
      console.warn("Translation cache failed:", error);
    }
  }

  async getCachedTranslation(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.redis!.get(`trans:${key}`);
    } catch (error) {
      console.warn("Translation cache retrieval failed:", error);
      return null;
    }
  }

  async cachePromptOptimization(
    promptHash: string,
    optimized: string,
    ttl = 1800
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.setex(`opt:${promptHash}`, ttl, optimized);
    } catch (error) {
      console.warn("Optimization cache failed:", error);
    }
  }

  async getCachedPromptOptimization(
    promptHash: string
  ): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.redis!.get(`opt:${promptHash}`);
    } catch (error) {
      console.warn("Optimization cache retrieval failed:", error);
      return null;
    }
  }

  async cachePromptElements(
    promptContent: string,
    elements: any[],
    ttl = 7200
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const key = `elem:${this.hashContent(promptContent)}`;
      await this.redis!.setex(key, ttl, JSON.stringify(elements));
    } catch (error) {
      console.warn("Elements cache failed:", error);
    }
  }

  async getCachedPromptElements(promptContent: string): Promise<any[] | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = `elem:${this.hashContent(promptContent)}`;
      const cached = await this.redis!.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Elements cache retrieval failed:", error);
      return null;
    }
  }

  // キャラクター情報のキャッシュ
  async cacheCharacterInfo(
    promptHash: string,
    character: any,
    ttl = 3600
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.setex(
        `char:${promptHash}`,
        ttl,
        JSON.stringify(character)
      );
    } catch (error) {
      console.warn("Character cache failed:", error);
    }
  }

  async getCachedCharacterInfo(promptHash: string): Promise<any | null> {
    if (!this.isAvailable()) return null;

    try {
      const cached = await this.redis!.get(`char:${promptHash}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Character cache retrieval failed:", error);
      return null;
    }
  }

  // バリエーション生成のキャッシュ
  async cacheVariations(
    promptHash: string,
    variations: string[],
    ttl = 1800
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.setex(
        `var:${promptHash}`,
        ttl,
        JSON.stringify(variations)
      );
    } catch (error) {
      console.warn("Variations cache failed:", error);
    }
  }

  async getCachedVariations(promptHash: string): Promise<string[] | null> {
    if (!this.isAvailable()) return null;

    try {
      const cached = await this.redis!.get(`var:${promptHash}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Variations cache retrieval failed:", error);
      return null;
    }
  }

  // キャッシュクリア
  async clearCache(pattern: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      console.warn("Cache clear failed:", error);
    }
  }

  private hashContent(content: string): string {
    return crypto.createHash("md5").update(content).digest("hex");
  }
}

export const cacheService = new CacheService();
