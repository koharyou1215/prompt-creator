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
    // 引数で渡されたAPIキー、またはlocalStorage、または環境変数の順で取得
    this.apiKey =
      apiKey ||
      (typeof window !== "undefined"
        ? localStorage.getItem("openRouterApiKey") || ""
        : "") ||
      process.env.OPENROUTER_API_KEY ||
      "";

    // APIキーが設定されていない場合は警告のみ
    if (!this.apiKey || this.apiKey === "your_openrouter_api_key_here") {
      console.warn(
        "OpenRouter API key not configured. Translation features will be limited."
      );
      console.log("Current API key value:", this.apiKey);
      console.log(
        "localStorage API key:",
        typeof window !== "undefined"
          ? localStorage.getItem("openRouterApiKey")
          : "N/A"
      );
      console.log(
        "process.env API key:",
        process.env.OPENROUTER_API_KEY ? "Present" : "Not present"
      );
      this.apiKey = ""; // 空のキーで続行
    } else {
      console.log("API key successfully configured");
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
        console.log(
          `Making API request (attempt ${attempt}):`,
          `${this.baseUrl}${path}`
        );
        console.log("Request body:", JSON.stringify(body, null, 2));

        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(body),
          signal,
        });

        console.log(
          `API response status (attempt ${attempt}):`,
          response.status
        );

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
    console.log(
      "Building headers with API key:",
      this.apiKey ? "API key present" : "No API key"
    );
    console.log("API key length:", this.apiKey?.length || 0);

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

    return this.parseOpenRouterResponse(response);
  }

  /**
   * OpenRouter APIのレスポンスをパースする関数
   */
  private async parseOpenRouterResponse(response: Response): Promise<string> {
    try {
      console.log("Parsing response with status:", response.status);
      const data = await response.json();
      console.log("Raw API response:", data);

      // OpenRouter APIのレスポンス形式をチェック
      console.log("Checking choices array:", data.choices);
      console.log("Choices length:", data.choices?.length);

      if (
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0
      ) {
        const choice = data.choices[0];
        console.log("First choice:", choice);
        console.log("Choice message:", choice.message);

        if (choice.message) {
          // contentが空でも他のフィールドがある場合がある
          if (choice.message.content) {
            console.log("Found valid content:", choice.message.content);
            return choice.message.content;
          } else {
            console.log("Content is empty, checking other fields");
            // reasoningフィールドを優先的にチェック（OpenRouterの新しい形式）
            if (choice.message.reasoning) {
              console.log("Using reasoning field:", choice.message.reasoning);
              return choice.message.reasoning;
            }
            if (choice.text) {
              console.log("Using text field:", choice.text);
              return choice.text;
            }
            console.log("No valid content found in message");
          }
        }
      }

      // エラーレスポンスの処理
      if (data.error) {
        console.error("API error response:", data.error);
        throw new Error(
          `OpenRouter API error: ${data.error.message || "Unknown error"}`
        );
      }

      // 予期しないレスポンス形式の場合
      console.warn("Unexpected OpenRouter response format:", data);

      // 他のフィールドもチェック
      if (data.content) {
        console.log("Using data.content:", data.content);
        return data.content;
      }
      if (data.result) {
        console.log("Using data.result:", data.result);
        return data.result;
      }
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const message = data.choices[0].message;
        if (message.reasoning) {
          console.log("Using reasoning field:", message.reasoning);
          return message.reasoning;
        }
        if (message.content) {
          console.log("Using message.content:", message.content);
          return message.content;
        }
      }
      if (data.choices && data.choices[0] && data.choices[0].text) {
        console.log("Using text field:", data.choices[0].text);
        return data.choices[0].text;
      }

      console.log("Returning full response as string");
      return JSON.stringify(data) || "";
    } catch (error) {
      console.error("Failed to parse response:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to parse OpenRouter response");
    }
  }

  async completeWithSystem(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    options: Parameters<OpenRouterClient["complete"]>[2] = {}
  ): Promise<string> {
    console.log("completeWithSystem called with:");
    console.log("- systemPrompt:", systemPrompt);
    console.log("- userPrompt:", userPrompt);
    console.log("- model:", model);

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

    console.log("API response received:", response.status);
    return this.parseOpenRouterResponse(response);
  }
}
