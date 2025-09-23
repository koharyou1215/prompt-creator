/**
 * OpenRouter APIのレスポンスをパースする関数
 */
export function parseOpenRouterResponse(data: any): string {
  try {
    // OpenRouter APIの標準レスポンス形式をチェック
    if (
      data.choices &&
      Array.isArray(data.choices) &&
      data.choices.length > 0
    ) {
      const choice = data.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
    }

    // エラーレスポンスの処理
    if (data.error) {
      throw new Error(
        `OpenRouter API error: ${data.error.message || "Unknown error"}`
      );
    }

    // 予期しないレスポンス形式の場合
    console.warn("Unexpected OpenRouter response format:", data);
    return data?.content || data?.result || JSON.stringify(data) || "";
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to parse OpenRouter response");
  }
}

// OpenRouter API request helper function
export async function openRouterRequest(params: {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const apiKey =
    (typeof window !== "undefined"
      ? localStorage.getItem("openRouterApiKey") || ""
      : "") ||
    process.env.OPENROUTER_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Prompt Creator",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 1000,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return parseOpenRouterResponse(data);
}
