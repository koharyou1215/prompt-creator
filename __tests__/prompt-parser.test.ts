import { PromptParser } from "@/lib/ai/prompt-parser";

describe("PromptParser", () => {
  test("should parse elements correctly", async () => {
    const content = "beautiful anime girl, digital art, soft lighting";
    const elements = await PromptParser.parseElements(content);

    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(elements.some((e) => e.type === "subject")).toBeTruthy();
    expect(elements.some((e) => e.type === "style")).toBeTruthy();
    expect(elements.some((e) => e.type === "lighting")).toBeTruthy();
  });

  test("should handle empty content", async () => {
    const elements = await PromptParser.parseElements("");
    expect(elements).toHaveLength(0);
  });
});
