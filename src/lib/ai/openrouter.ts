// src/lib/ai/openrouter.ts
interface RequestOptions {
  timeoutMs?: number;
  retries?: number;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private failureCount = 0;
  private lastFailureTime = 0;
  private circuitBreakerThreshold = 5;
  private circuitBreakerTimeout = 60000; // 1分

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey || this.apiKey === "your_openrouter_api_key_here") {
      throw new Error(
        "OpenRouter API key is required. Please set OPENROUTER_API_KEY environment variable."
      );
    }
  }

  private isCircuitOpen(): boolean {
    if (this.failureCount >= this.circuitBreakerThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      return timeSinceLastFailure < this.circuitBreakerTimeout;
    }
    return false;
  }

  private recordSuccess(): void {
    this.failureCount = 0;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  private calculateBackoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private enhanceError(error: any): Error {
    if (error.name === "AbortError") {
      return new Error("リクエストがタイムアウトしました");
    }
    if (error.message?.includes("429")) {
      return new Error(
        "レート制限に達しました。しばらく待ってから再試行してください"
      );
    }
    return error;
  }

  private async request(
    path: string,
    body: any,
    opts?: RequestOptions
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      opts?.timeoutMs ?? 30000
    );

    try {
      // Circuit breaker パターンの実装
      if (this.isCircuitOpen()) {
        throw new Error("サービスが一時的に利用できません");
      }

      const response = await this.executeWithRetry(
        path,
        body,
        opts,
        controller.signal
      );
      this.recordSuccess();
      return response;
    } catch (error) {
      this.recordFailure();
      throw this.enhanceError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // レート制限対応
  private async executeWithRetry(
    path: string,
    body: any,
    opts?: RequestOptions,
    signal?: AbortSignal
  ): Promise<Response> {
    for (let attempt = 1; attempt <= (opts?.retries ?? 3); attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(body),
          signal,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : this.calculateBackoff(attempt);
          await this.delay(delay);
          continue;
        }

        if (
          !response.ok &&
          response.status >= 500 &&
          attempt < (opts?.retries ?? 3)
        ) {
          await this.delay(this.calculateBackoff(attempt));
          continue;
        }

        return response;
      } catch (error) {
        if (attempt === (opts?.retries ?? 3)) throw error;
        await this.delay(this.calculateBackoff(attempt));
      }
    }
    throw new Error("最大リトライ回数に達しました");
  }

  private buildHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Prompt Creator",
    };
  }

  async complete(
    prompt: string,
    model: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      timeoutMs?: number;
      retries?: number;
    } = {}
  ): Promise<string> {
    const response = await this.request(
      "/chat/completions",
      {
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      },
      {
        timeoutMs: options.timeoutMs,
        retries: options.retries,
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async completeWithSystem(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    options: Parameters<OpenRouterClient["complete"]>[2] = {}
  ): Promise<string> {
    const response = await this.request(
      "/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      },
      {
        timeoutMs: options.timeoutMs,
        retries: options.retries,
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}
