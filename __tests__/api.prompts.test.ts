import request from "supertest";
// テスト用の app をセットアップする必要があります（Next.js のハンドラを直接 test する構成は別途）

describe("/api/prompts", () => {
  test("GET /api/prompts should return paginated results (placeholder)", async () => {
    // 実運用では Next.js server handler を組み立てて request(app) で叩きます。
    expect(true).toBe(true);
  });
});
